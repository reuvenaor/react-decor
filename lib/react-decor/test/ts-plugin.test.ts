import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const init = require('react-decor-ts-plugin') as (m: { typescript: typeof ts }) => {
  create(info: ts.server.PluginCreateInfo): ts.LanguageService
}

const here = path.dirname(fileURLToPath(import.meta.url))
const projDir = path.join(here, '__fixtures__', 'project')
const okFile = path.join(projDir, 'ok.at.tsx')
const composersFile = path.join(projDir, 'composers.tsx')
const badWrapFile = path.join(projDir, 'virtual-badwrap.at.tsx')
const unusedFile = path.join(projDir, 'virtual-unused.at.tsx')
const slotOkFile = path.join(projDir, 'virtual-slot-ok.at.tsx')
const slotBadFile = path.join(projDir, 'virtual-slot-bad.at.tsx')

// In-memory files exercise the injected AT diagnostics + the unused-import delta;
// the rest come from disk.
const virtualFiles = new Map<string, string>([
  [
    badWrapFile,
    "import { Frame } from './composers'\n\n@(<Frame><b>no</b></Frame>)\nexport function W() {\n  return <div>w</div>\n}\n",
  ],
  [
    unusedFile,
    // Card and Frame are referenced ONLY inside directives (declaration + return
    // position) — the raw checker does not count decorator references as uses.
    "import { Card, Frame } from './composers'\n\n@Card({ tone: 'brand' })\nexport function A() {\n  @(<Frame />)\n  return <i>a</i>\n}\n",
  ],
  [
    slotOkFile,
    [
      "import type { ReactElement } from 'react'",
      "import { $at } from 'react-decor'",
      '',
      'function Pane({ content, tone }: { content?: ReactElement; tone: string }) {',
      '  return <div data-tone={tone}>{content}</div>',
      '}',
      '',
      "@Pane({ tone: 'ok', content: $at })",
      'export function Good() {',
      '  return <i>g</i>',
      '}',
      '',
    ].join('\n'),
  ],
  [
    slotBadFile,
    [
      "import { $at } from 'react-decor'",
      '',
      'function Strict({ content }: { content: string }) {',
      '  return <b>{content}</b>',
      '}',
      '',
      '@Strict({ content: $at })',
      'export function Bad() {',
      '  return <i>b</i>',
      '}',
      '',
    ].join('\n'),
  ],
])

function makeLanguageService({ plugin = true } = {}) {
  const rootFiles = [composersFile, okFile, badWrapFile, unusedFile, slotOkFile, slotBadFile]
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  }
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => rootFiles,
    getScriptVersion: () => '1',
    getScriptSnapshot: (f) => {
      const virtual = virtualFiles.get(f)
      if (virtual !== undefined) return ts.ScriptSnapshot.fromString(virtual)
      const t = ts.sys.readFile(f)
      return t === undefined ? undefined : ts.ScriptSnapshot.fromString(t)
    },
    getCurrentDirectory: () => projDir,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: (f) => virtualFiles.has(f) || ts.sys.fileExists(f),
    readFile: (f) => virtualFiles.get(f) ?? ts.sys.readFile(f),
    readDirectory: (p, ext, exc, inc, depth) => ts.sys.readDirectory(p, ext, exc, inc, depth),
    directoryExists: (d) => ts.sys.directoryExists(d),
    getDirectories: (d) => ts.sys.getDirectories(d),
  }
  const base = ts.createLanguageService(host)
  if (!plugin) return base
  const info = {
    languageServiceHost: host,
    languageService: base,
    config: {},
  } as unknown as ts.server.PluginCreateInfo
  return init({ typescript: ts }).create(info)
}

describe('tsserver plugin', () => {
  it('serves decorated files diagnostic-clean through the virtualized snapshots', () => {
    const ls = makeLanguageService()
    const diags = [...ls.getSyntacticDiagnostics(okFile), ...ls.getSemanticDiagnostics(okFile)]
    expect(
      diags.map((d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`),
    ).toEqual([])
  }, 60_000)

  it('quick info + completions work INSIDE decorator expressions at raw positions', () => {
    const ls = makeLanguageService()
    const raw = ts.sys.readFile(okFile) ?? ''
    const cardAt = raw.indexOf('@Card({') + 2
    const qi = ls.getQuickInfoAtPosition(okFile, cardAt)
    expect(qi && ts.displayPartsToString(qi.displayParts)).toContain('tone: string')
    const toneAt = raw.indexOf("tone: 'brand'")
    const completions = ls.getCompletionsAtPosition(okFile, toneAt, {})
    expect(completions?.entries.some((e) => e.name === 'tone')).toBe(true)
  }, 60_000)

  it('imports referenced only inside directives are never flagged unused (ts 6133)', () => {
    // The raw checker (VS Code's built-in TS, no plugin) does not count decorator
    // references as uses, so it reports the imports unused — per-name 6133, or 6192
    // when the whole declaration is unused. Through the plugin the virtualized text
    // references them as real expressions — neither code appears (suggestion
    // diagnostics are what editors render as grayed-out unused spans).
    const UNUSED_CODES = [6133, 6192]
    const raw = makeLanguageService({ plugin: false })
    const rawCodes = raw.getSuggestionDiagnostics(unusedFile).map((d) => d.code)
    expect(rawCodes.some((c) => UNUSED_CODES.includes(c))).toBe(true)
    const ls = makeLanguageService()
    const codes = ls.getSuggestionDiagnostics(unusedFile).map((d) => d.code)
    expect(codes.some((c) => UNUSED_CODES.includes(c))).toBe(false)
    expect(ls.getSemanticDiagnostics(unusedFile)).toEqual([])
  }, 60_000)

  it('type-checks the $at slot against the receiving prop (children never was)', () => {
    const ls = makeLanguageService()
    expect(ls.getSemanticDiagnostics(slotOkFile)).toEqual([])
    const diags = ls.getSemanticDiagnostics(slotBadFile)
    const mismatch = diags.find((d) => d.code === 2322 || d.code === 2345)
    expect(mismatch, JSON.stringify(diags.map((d) => d.code))).toBeDefined()
    // the mismatch surfaces inside the directive, at raw coordinates
    const raw = virtualFiles.get(slotBadFile) ?? ''
    expect(mismatch?.start).toBeGreaterThanOrEqual(raw.indexOf('@Strict'))
    expect(mismatch?.start).toBeLessThan(raw.indexOf('export function Bad'))
  }, 60_000)

  it('appends AT-catalog errors as react-decor semantic diagnostics', () => {
    const ls = makeLanguageService()
    const diags = ls.getSemanticDiagnostics(badWrapFile)
    const at = diags.find((d) => d.source === 'react-decor')
    expect(at).toBeDefined()
    expect(at?.code).toBe(90002)
    expect(ts.flattenDiagnosticMessageText(at?.messageText ?? '', ' ')).toContain('AT002')
    // positioned on the raw wrapper element
    const raw = virtualFiles.get(badWrapFile) ?? ''
    expect(at?.start).toBe(raw.indexOf('<Frame><b>'))
  }, 60_000)
})
