#!/usr/bin/env node
'use strict'

/**
 * at-tsc — drop-in `tsc --noEmit` replacement that type-checks react-decor decorated
 * files in TWO passes.
 *
 * Pass 1 (every .at.tsx): the same-length virtualization (../src/virtualize.cjs) —
 * the compiler host serves `@Card` files as `;Card` text, so decorator expressions
 * are FULLY type-checked (call-form props objects against the component's props,
 * JSX-form elements as real elements) and TS1206 never exists. Positions map 1:1
 * to the raw files by construction.
 *
 * Pass 2 (files with return-position or in-tree groups): the virtual view checks a
 * slot prop against the `$at` stand-in (ReactElement) and the returned expression
 * DETACHED — never the actual splice — so a type error in the real composed output
 * (`element={ok ? <a/> : null}` against a non-null prop) shipped green. One extra
 * Program serves those files as their TRANSFORMED text; diagnostics are mapped back
 * through the transform's decoded sourcemap, filtered to each directive group's
 * raw window, and deduped against pass 1.
 *
 * Code frames always render from the RAW text so users see `@Card`, never `;Card`.
 * Supports solution-style configs (files: [] + references) by recursing into each
 * referenced project — matching this repo's root tsconfig layout.
 */

const path = require('path')
const ts = require('typescript')
const { scan } = require('../src/scan.cjs')
const { transformWithDecodedMap } = require('../src/transform.cjs')
const { virtualizeFromScan } = require('../src/virtualize.cjs')

function parseArgs(argv) {
  let project = './tsconfig.json'
  let filter = /\.at\.tsx$/
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-p' || a === '--project') project = argv[++i]
    else if (a === '--filter') filter = new RegExp(argv[++i])
    else if (a === '--noEmit') {
      // compat no-op: at-tsc never emits
    } else {
      process.stderr.write(`at-tsc: unknown argument "${a}"\n`)
      process.exit(2)
    }
  }
  return { project, filter }
}

function locate(text, pos) {
  const pre = text.slice(0, pos)
  const line = pre.split('\n').length - 1
  const col = pos - (pre.lastIndexOf('\n') + 1)
  return { line, col }
}

/** Offsets of every line start — offset ↔ line/col conversions for pass 2. */
function lineStartsOf(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1)
  return starts
}

/**
 * Map a generated-text offset back to a raw line/col through the decoded map.
 * hires 'boundary' marks every token boundary of retained original text, so
 * positions in original content resolve token-exact; positions inside INSERTED
 * text (wrapper tags) fall back to the nearest preceding boundary — close
 * enough for the window filter and a raw code frame.
 */
function mapGeneratedToRaw(mappings, genStarts, genOffset) {
  let lo = 0
  let hi = genStarts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (genStarts[mid] <= genOffset) lo = mid
    else hi = mid - 1
  }
  const line = lo
  const col = genOffset - genStarts[line]
  let seg = null
  let sameLine = false
  for (const s of mappings[line] ?? []) {
    if (s.length < 4) continue
    if (s[0] <= col) {
      seg = s
      sameLine = true
    } else break
  }
  if (!seg) {
    for (let l = line - 1; l >= 0 && !seg; l--) {
      const row = mappings[l] ?? []
      for (let i = row.length - 1; i >= 0; i--) {
        if (row[i].length >= 4) {
          seg = row[i]
          break
        }
      }
    }
  }
  if (!seg) return null
  return { line: seg[2], col: seg[3] + (sameLine ? col - seg[0] : 0) }
}

/** Print one diagnostic with a 1-line code frame rendered from the RAW file text. */
function printDiag(fileName, rawText, pos, len, label, message) {
  if (fileName != null && rawText != null && typeof pos === 'number') {
    const { line, col } = locate(rawText, pos)
    const lineText = rawText.split('\n')[line] ?? ''
    const caretLen = Math.max(1, Math.min(len || 1, Math.max(1, lineText.length - col)))
    process.stdout.write(`${fileName}:${line + 1}:${col + 1} - ${label}: ${message}\n`)
    process.stdout.write(`  ${lineText}\n`)
    process.stdout.write(`  ${' '.repeat(col)}${'^'.repeat(caretLen)}\n`)
  } else {
    process.stdout.write(`${label}: ${message}\n`)
  }
}

function checkProject(configPath, filter, seen) {
  const resolved = path.resolve(configPath)
  if (seen.has(resolved)) return 0
  seen.add(resolved)

  const parseHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      process.stderr.write(`${ts.flattenDiagnosticMessageText(d.messageText, '\n')}\n`)
      process.exit(1)
    },
  }
  const parsed = ts.getParsedCommandLineOfConfigFile(resolved, { noEmit: true }, parseHost)
  if (!parsed) {
    process.stderr.write(`at-tsc: cannot read ${resolved}\n`)
    process.exit(1)
  }

  // Solution-style config (files: [] + references): recurse into each project.
  if (parsed.fileNames.length === 0 && (parsed.projectReferences?.length ?? 0) > 0) {
    // Recoverable config diagnostics on the solution file itself (the unknown /
    // mistyped-option TS5023/TS5025 class) land in parsed.errors, not in the
    // unrecoverable callback — report them here or they vanish with the early
    // return and at-tsc exits 0 where tsc reports.
    let n = 0
    for (const d of parsed.errors) {
      if (d.category !== ts.DiagnosticCategory.Error) continue
      n++
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n    ')
      if (d.file && typeof d.start === 'number') {
        printDiag(
          path.relative(process.cwd(), d.file.fileName),
          d.file.text,
          d.start,
          d.length ?? 1,
          `error TS${d.code}`,
          msg,
        )
      } else {
        printDiag(null, null, null, null, `error TS${d.code}`, msg)
      }
    }
    for (const ref of parsed.projectReferences ?? []) {
      n += checkProject(ts.resolveProjectReferencePath(ref), filter, seen)
    }
    return n
  }

  const host = ts.createCompilerHost(parsed.options)
  const origGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreate) => {
    if (filter.test(fileName)) {
      const raw = ts.sys.readFile(fileName)
      if (raw != null) {
        const virt = virtualizeFromScan(raw, scan(raw, fileName)).code
        return ts.createSourceFile(fileName, virt, languageVersionOrOptions, true)
      }
    }
    return origGetSourceFile(fileName, languageVersionOrOptions, onError, shouldCreate)
  }
  const origReadFile = host.readFile.bind(host)
  host.readFile = (fileName) => {
    const text = origReadFile(fileName)
    if (text != null && filter.test(fileName)) {
      return virtualizeFromScan(text, scan(text, fileName)).code
    }
    return text
  }

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: { ...parsed.options, noEmit: true },
    projectReferences: parsed.projectReferences,
    host,
  })

  const rawCache = new Map()
  const rawTextOf = (fileName) => {
    if (!rawCache.has(fileName)) rawCache.set(fileName, ts.sys.readFile(fileName) ?? null)
    return rawCache.get(fileName)
  }

  let errorCount = 0
  // (file|code|raw line) of everything pass 1 reported — pass 2 dedups against it
  const reported = new Set()
  for (const d of [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]) {
    if (d.category !== ts.DiagnosticCategory.Error) continue
    errorCount++
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n    ')
    if (d.file && typeof d.start === 'number') {
      const raw = rawTextOf(d.file.fileName)
      if (raw != null) reported.add(`${d.file.fileName}|${d.code}|${locate(raw, d.start).line}`)
      printDiag(
        path.relative(process.cwd(), d.file.fileName),
        raw,
        d.start,
        d.length ?? 1,
        `error TS${d.code}`,
        msg,
      )
    } else {
      printDiag(null, null, null, null, `error TS${d.code}`, msg)
    }
  }

  // Directive errors are real errors even though the virtualized text parses clean.
  for (const fileName of parsed.fileNames) {
    if (!filter.test(fileName)) continue
    const raw = rawTextOf(fileName)
    if (raw == null) continue
    for (const e of scan(raw, fileName).errors) {
      errorCount++
      printDiag(
        path.relative(process.cwd(), fileName),
        raw,
        e.span.start,
        e.span.end - e.span.start,
        `error react-decor/${e.code}`,
        e.message,
      )
    }
  }

  // -------- pass 2: type-check the real spliced output (see header) --------
  const flagged = new Map()
  for (const fileName of parsed.fileNames) {
    if (!filter.test(fileName)) continue
    const raw = rawTextOf(fileName)
    if (raw == null) continue
    const sc = scan(raw, fileName)
    if (sc.errors.length > 0) continue // reported above; the transform would throw
    if (!sc.groups.some((g) => g.placement === 'return' || g.placement === 'jsx-child')) continue
    const out = transformWithDecodedMap(raw, fileName)
    // Raw-file windows a mapped diagnostic must land in: only the regions whose
    // composition the virtual view could not check. Everything else is pass-1
    // territory (or synthetic decl wrappers, fully covered by pass 1).
    const windows = []
    for (const g of out.groups) {
      if (g.placement === 'return') windows.push([g.directives[0].atPos, g.exprEnd])
      else if (g.placement === 'jsx-child') windows.push([g.directives[0].atPos, g.target.end])
    }
    flagged.set(fileName, { raw, out, windows })
  }
  if (flagged.size > 0) {
    const host2 = ts.createCompilerHost(parsed.options)
    const serve = (fileName, text) => {
      const f = flagged.get(fileName)
      if (f) return f.out.code
      if (filter.test(fileName)) return virtualizeFromScan(text, scan(text, fileName)).code
      return text
    }
    const origGetSourceFile2 = host2.getSourceFile.bind(host2)
    host2.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreate) => {
      if (filter.test(fileName)) {
        const raw = ts.sys.readFile(fileName)
        if (raw != null) {
          return ts.createSourceFile(fileName, serve(fileName, raw), languageVersionOrOptions, true)
        }
      }
      return origGetSourceFile2(fileName, languageVersionOrOptions, onError, shouldCreate)
    }
    const origReadFile2 = host2.readFile.bind(host2)
    host2.readFile = (fileName) => {
      const text = origReadFile2(fileName)
      if (text != null && filter.test(fileName)) return serve(fileName, text)
      return text
    }
    const program2 = ts.createProgram({
      rootNames: parsed.fileNames,
      options: { ...parsed.options, noEmit: true },
      projectReferences: parsed.projectReferences,
      host: host2,
    })
    for (const [fileName, f] of flagged) {
      const sf2 = program2.getSourceFile(fileName)
      if (!sf2) continue
      const genStarts = lineStartsOf(f.out.code)
      const rawStarts = lineStartsOf(f.raw)
      const diags = [
        ...program2.getSyntacticDiagnostics(sf2),
        ...program2.getSemanticDiagnostics(sf2),
      ]
      for (const d of diags) {
        if (d.category !== ts.DiagnosticCategory.Error) continue
        if (!d.file || d.file.fileName !== sf2.fileName || typeof d.start !== 'number') continue
        const m = mapGeneratedToRaw(f.out.decodedMap.mappings, genStarts, d.start)
        if (!m) continue
        const lineStart = rawStarts[m.line] ?? 0
        const lineEnd = m.line + 1 < rawStarts.length ? rawStarts[m.line + 1] - 1 : f.raw.length
        const rawPos = Math.min(lineStart + m.col, lineEnd)
        if (!f.windows.some(([a, b]) => rawPos >= a && rawPos <= b)) continue
        const key = `${fileName}|${d.code}|${m.line}`
        if (reported.has(key)) continue
        reported.add(key)
        errorCount++
        const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n    ')
        printDiag(
          path.relative(process.cwd(), fileName),
          f.raw,
          rawPos,
          d.length ?? 1,
          `error TS${d.code}`,
          msg,
        )
      }
    }
  }
  return errorCount
}

const { project, filter } = parseArgs(process.argv.slice(2))
const errors = checkProject(project, filter, new Set())
if (errors > 0) {
  process.stdout.write(`\nat-tsc: found ${errors} error${errors === 1 ? '' : 's'}.\n`)
  process.exit(1)
}
