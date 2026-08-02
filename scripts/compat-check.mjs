#!/usr/bin/env node
/**
 * Compatibility harness: proves the packed react-decor tarballs work against an
 * arbitrary consumer React + TypeScript pair, independent of this repo's own
 * (newer) toolchain.
 *
 *   node scripts/compat-check.mjs --ts 5.0.4 --react 18
 *   node scripts/compat-check.mjs --ts latest --react latest
 *   node scripts/compat-check.mjs --ts 5.0.4 --react 18 --keep   # keep temp dir
 *
 * What it checks, in a scratch project with ONLY the requested versions:
 *   1. transform  — all placements (+ $at slots) compile away; no directive text
 *                   survives.
 *   2. scan       — the AT catalog still fires (AT002 on a wrapper with children).
 *   3. at-tsc     — green on a strict project (skipLibCheck OFF, so the $at
 *                   typings are also proven against that @types/react), and RED
 *                   on a seeded type error (the gate actually gates).
 *   4. runtime    — the transformed output transpiles with the consumer's OWN
 *                   TypeScript and renders with the consumer's OWN react-dom.
 *   5. eslint     — the virtualizing parser parses cleanly and a react-decor
 *                   rule (no-local-atom) still reports.
 *   6. slot ref   — the props-forwarding asChild pattern under jsdom: the
 *                   Slot-injected ref attaches on React 19 (ref-as-prop) and
 *                   is dropped with the function-component ref warning on 18 —
 *                   pinning BOTH documented behaviors of the wide react peer.
 *
 * Used by the CI `compat` matrix; also runnable locally. Requires network for
 * the scratch `npm install`.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const TS = opt('ts', '5.0.4')
const REACT = opt('react', '18')
const KEEP = args.includes('--keep')
const typesTag = REACT === 'latest' ? 'latest' : REACT.split('.')[0]

const tmp = mkdtempSync(path.join(tmpdir(), 'react-decor-compat-'))
const log = (msg) => console.log(`[compat ts=${TS} react=${REACT}] ${msg}`)
const fail = (msg) => {
  console.error(`[compat ts=${TS} react=${REACT}] FAIL: ${msg}`)
  console.error(`scratch project kept at: ${tmp}`)
  process.exit(1)
}
const assert = (cond, msg) => {
  if (!cond) fail(msg)
}

// ---------------------------------------------------------------- 0. scaffold
log('packing tarballs from lib source…')
execFileSync(
  'npm',
  ['pack', './lib/react-decor', './lib/react-decor/ts-plugin', '--pack-destination', tmp],
  {
    cwd: repoRoot,
    stdio: 'pipe',
  },
)
// Digit-aware: the lib tarball is react-decor-<version>.tgz — matching on a
// leading digit (not a hardcoded major) keeps this working across 1.0.0 while
// still excluding react-decor-ts-plugin-*.tgz.
const tgzs = readdirSync(tmp).filter((f) => f.endsWith('.tgz'))
const libTgz = tgzs.find((f) => /^react-decor-\d/.test(f))
const pluginTgz = tgzs.find((f) => f.startsWith('react-decor-ts-plugin-'))
assert(libTgz && pluginTgz, `packed tarballs not found in ${tmp}`)

writeFileSync(
  path.join(tmp, 'package.json'),
  JSON.stringify(
    {
      name: 'react-decor-compat-scratch',
      private: true,
      devDependencies: {
        'react-decor': `file:./${libTgz}`,
        'react-decor-ts-plugin': `file:./${pluginTgz}`,
        typescript: TS,
        react: REACT,
        'react-dom': REACT,
        '@types/react': typesTag,
        '@types/react-dom': typesTag,
        eslint: '^9',
        '@typescript-eslint/parser': '^8',
        jsdom: '^26',
      },
    },
    null,
    2,
  ),
)

log('npm install (scratch project)…')
execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
  cwd: tmp,
  stdio: 'pipe',
})

const req = createRequire(path.join(tmp, 'noop.js'))
const tsInstalled = req('typescript/package.json').version
const reactInstalled = req('react/package.json').version
log(`installed: typescript@${tsInstalled}, react@${reactInstalled}`)

mkdirSync(path.join(tmp, 'src'))
writeFileSync(
  path.join(tmp, 'src', 'widgets.tsx'),
  `import type { ReactElement, ReactNode } from 'react'

export function Card({ children }: { children?: ReactNode }) {
  return <section data-w="card">{children}</section>
}
export function Labeled({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <label>
      <span>{text}</span>
      {children}
    </label>
  )
}
export function Overlay({ content, tone }: { content?: ReactElement; tone: string }) {
  return <aside data-tone={tone}>{content}</aside>
}
`,
)
writeFileSync(
  path.join(tmp, 'src', 'sample.at.tsx'),
  `import { $at } from 'react-decor'
import { Card, Labeled, Overlay } from './widgets'

@Card
@Labeled({ text: 'email' })
export function DeclStack({ id }: { id: string }) {
  return <input type="email" id={id} />
}

@Overlay({ content: $at, tone: 'brand' })
@Card
export function SlottedStack({ name }: { name: string }) {
  @(<Labeled text={name} />)
  return (
    <div>
      @(<Overlay content={$at} tone="tree" />)
      <span>{name}</span>
      <i>sibling stays</i>
    </div>
  )
}
`,
)
writeFileSync(
  path.join(tmp, 'src', 'consumer-types.ts'),
  `import type { ReactElement } from 'react'
import { $at } from 'react-decor'

// The sentinel must type-check as a ReactElement against this @types/react.
const el: ReactElement = $at
export const ok = el !== null
`,
)
writeFileSync(
  path.join(tmp, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        lib: ['ES2022', 'DOM'],
        types: [],
        noEmit: true,
        esModuleInterop: true,
        skipLibCheck: false,
      },
      include: ['src'],
    },
    null,
    2,
  ),
)

// ---------------------------------------------------------------- 1. transform
const sampleSrc = readFileSync(path.join(tmp, 'src', 'sample.at.tsx'), 'utf8')
const { transform } = req('react-decor/transform')
const out = transform(sampleSrc, path.join(tmp, 'src', 'sample.at.tsx'))
assert(out.changed, 'transform reported changed=false')
assert(!out.code.includes('@('), 'directive text survived the transform')
assert(!/^@/m.test(out.code), 'a decl-position directive survived the transform')
for (const needle of [
  'DeclStack_base',
  'SlottedStack_base',
  '<Card>',
  "<Labeled text={'email'}>",
  'content={<Card><SlottedStack_base',
]) {
  assert(out.code.includes(needle), `transform output missing: ${needle}`)
}
log('transform ok (all placements + $at slots compiled away)')

// ---------------------------------------------------------------- 2. scan (AT catalog)
const { scan } = req('react-decor/scan')
const badResult = scan(
  `import { Card } from './widgets'
@(<Card><b>x</b></Card>)
export function Bad() {
  return <i />
}
`,
  'bad.at.tsx',
)
assert(
  (badResult.errors ?? []).some((e) => e.code === 'AT002'),
  `AT002 not reported for a wrapper with children (got: ${JSON.stringify(badResult.errors)})`,
)
log('scan ok (AT002 fires)')

// ---------------------------------------------------------------- 3. at-tsc (green + red)
const atTsc = path.join(tmp, 'node_modules', '.bin', 'at-tsc')
const green = spawnSync(atTsc, ['-p', 'tsconfig.json', '--noEmit'], { cwd: tmp, encoding: 'utf8' })
assert(
  green.status === 0,
  `at-tsc failed on a clean strict project:\n${green.stdout}\n${green.stderr}`,
)

mkdirSync(path.join(tmp, 'broken'))
writeFileSync(path.join(tmp, 'broken', 'oops.at.tsx'), `export const n: number = 'not a number'\n`)
writeFileSync(
  path.join(tmp, 'tsconfig.broken.json'),
  JSON.stringify({ extends: './tsconfig.json', include: ['src', 'broken'] }, null, 2),
)
const red = spawnSync(atTsc, ['-p', 'tsconfig.broken.json', '--noEmit'], {
  cwd: tmp,
  encoding: 'utf8',
})
assert(red.status !== 0, 'at-tsc passed a project with a seeded type error')
assert(/TS2322|2322/.test(red.stdout + red.stderr), 'at-tsc red run did not surface TS2322')
log('at-tsc ok (green on clean, red on seeded error)')

// ---------------------------------------------------------------- 4. runtime render
const ts = req('typescript')
const transpile = (code, fileName) =>
  ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName,
  }).outputText
mkdirSync(path.join(tmp, 'dist'))
writeFileSync(
  path.join(tmp, 'dist', 'widgets.js'),
  transpile(readFileSync(path.join(tmp, 'src', 'widgets.tsx'), 'utf8'), 'widgets.tsx'),
)
writeFileSync(path.join(tmp, 'dist', 'sample.js'), transpile(out.code, 'sample.tsx'))

const { createElement } = req('react')
const { renderToStaticMarkup } = req('react-dom/server')
const compiled = req(path.join(tmp, 'dist', 'sample.js'))
const declHtml = renderToStaticMarkup(createElement(compiled.DeclStack, { id: 'em' }))
assert(
  declHtml ===
    '<section data-w="card"><label><span>email</span><input type="email" id="em"/></label></section>',
  `DeclStack markup mismatch:\n${declHtml}`,
)
const slottedHtml = renderToStaticMarkup(createElement(compiled.SlottedStack, { name: 'Zoe' }))
assert(
  slottedHtml.startsWith('<aside data-tone="brand"><section data-w="card"><label><span>Zoe</span>'),
  `SlottedStack outer stack mismatch:\n${slottedHtml}`,
)
assert(
  slottedHtml.includes('<aside data-tone="tree"><span>Zoe</span></aside><i>sibling stays</i>'),
  `SlottedStack in-tree slot mismatch:\n${slottedHtml}`,
)
log(`runtime ok (transformed output renders on react-dom@${reactInstalled})`)

// ---------------------------------------------------------------- 5. eslint parser + a rule
const { Linter } = req('eslint')
const { reactDecorEslint } = req('react-decor/eslint')
// cwd anchors the flat-config `**/*.at.tsx` glob to the scratch project.
const linter = new Linter({ cwd: tmp })
const cleanMessages = linter.verify(sampleSrc, [reactDecorEslint()], 'src/sample.at.tsx')
assert(
  cleanMessages.length === 0,
  `eslint reported on the clean sample: ${JSON.stringify(cleanMessages)}`,
)
const localAtom = linter.verify(
  `import { Card } from './widgets'
export function Outer({ items }: { items: string[] }) {
  @Card
  const Tile = ({ v }: { v: string }) => <b>{v}</b>
  return items.map((v) => <Tile key={v} v={v} />)
}
`,
  [reactDecorEslint()],
  'src/local.at.tsx',
)
assert(
  localAtom.some((m) => m.ruleId === 'react-decor/no-local-atom'),
  `no-local-atom did not report (got: ${JSON.stringify(localAtom.map((m) => m.ruleId))})`,
)
log('eslint ok (parser clean, no-local-atom reports)')

// ---------------------------------------------------------------- 6. slot ref forwarding (jsdom)
// The props-forwarding asChild pattern (the no-aschild-decl-decorator escape)
// carries a Slot-injected ref only on React 19's ref-as-prop. Pin the installed
// version to its documented behavior: 19 attaches the ref through the
// forwarding atom; 18 drops it with the function-component ref warning.
writeFileSync(
  path.join(tmp, 'dist', 'ref-box.js'),
  `const refBox = { current: null, set(el) { refBox.current = el } }\nexports.refBox = refBox\n`,
)
const refProbeSrc = `import { cloneElement } from 'react'
import type { ReactElement } from 'react'
import { refBox } from './ref-box'

// Radix-Slot-like clone boundary: inject className + a callback ref into the
// child element (the generated <Cta_base {...props} />).
export function SlotLike({
  asChild,
  className,
  children,
}: {
  asChild?: boolean
  className?: string
  children?: ReactElement
}) {
  if (asChild && children) {
    return cloneElement(children, { className, ref: refBox.set } as Record<string, unknown>)
  }
  return null
}

@SlotLike({ asChild: true, className: 'btn' })
export function Cta(p: { className?: string }) {
  return (
    <a {...p} href="/go">
      go
    </a>
  )
}
`
const refOut = transform(refProbeSrc, path.join(tmp, 'src', 'ref-probe.at.tsx'))
writeFileSync(path.join(tmp, 'dist', 'ref-probe.js'), transpile(refOut.code, 'ref-probe.tsx'))

const { JSDOM } = req('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
// node ≥21 predefines navigator as a getter — defineProperty, not assignment
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })

const refWarnings = []
const origConsoleError = console.error
console.error = (...a) => {
  const text = a.map(String).join(' ')
  if (/Function components cannot be given refs/.test(text)) refWarnings.push(text)
  else origConsoleError(...a)
}
try {
  const { createRoot } = req('react-dom/client')
  const { flushSync } = req('react-dom')
  const { refBox } = req(path.join(tmp, 'dist', 'ref-box.js'))
  const probe = req(path.join(tmp, 'dist', 'ref-probe.js'))
  const root = createRoot(dom.window.document.getElementById('root'))
  flushSync(() => root.render(createElement(probe.Cta, {})))
  const major = Number(reactInstalled.split('.')[0])
  if (major >= 19) {
    assert(
      refBox.current && refBox.current.tagName === 'A',
      `slot-injected ref did not attach on react ${reactInstalled}`,
    )
    assert(refWarnings.length === 0, `unexpected ref warning on react ${reactInstalled}`)
    log('slot ref ok (ref-as-prop flows through the forwarding atom)')
  } else {
    assert(
      refBox.current === null,
      `expected the documented react-18 ref drop, got ${String(refBox.current)}`,
    )
    assert(refWarnings.length > 0, 'expected the react-18 function-component ref warning')
    log('slot ref ok (react 18 drops the injected ref — the documented caveat)')
  }
} finally {
  console.error = origConsoleError
}

// ---------------------------------------------------------------- done
if (!KEEP) rmSync(tmp, { recursive: true, force: true })
log(`PASS — react-decor works against typescript@${tsInstalled} + react@${reactInstalled}`)
