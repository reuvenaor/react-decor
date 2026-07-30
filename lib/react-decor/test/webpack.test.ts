import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { GREEN } from './corpus.ts'

interface LoaderContext {
  resourcePath: string
  callback: (err: Error | null, content?: string, map?: object) => void
}
type Loader = (this: LoaderContext, source: string, map?: object) => void

// createRequire mirrors how loader-runner loads the loader (a native CJS require
// of the bare 'react-decor/webpack' specifier through the package exports map).
const require = createRequire(import.meta.url)
const loader = require('react-decor/webpack') as Loader

interface LoaderResult {
  err: Error | null
  content?: string
  map?: object
}

function run(source: string, resourcePath: string, map?: object): LoaderResult {
  let out: LoaderResult | undefined
  const ctx: LoaderContext = {
    resourcePath,
    callback(err, content, m) {
      out = { err, content, map: m }
    },
  }
  loader.call(ctx, source, map)
  if (!out) throw new Error('loader did not call this.callback')
  return out
}

describe('webpack loader', () => {
  it('passes through non-matching ids and @-less files, forwarding the upstream map', () => {
    const upstream = { version: 3 }
    const plain = run(GREEN.declFn, '/x/file.tsx', upstream)
    expect(plain.content).toBe(GREEN.declFn)
    expect(plain.map).toBe(upstream)
    const atless = run('export const A = 1\n', '/x/file.at.tsx')
    expect(atless.content).toBe('export const A = 1\n')
  })

  it('passes through matching files whose @ occurrences are not directives', () => {
    const code = 'const s = "a@b"\nexport const A = () => <i>{s}</i>\n'
    const res = run(code, '/x/plain.at.tsx')
    expect(res.err).toBeNull()
    expect(res.content).toBe(code)
  })

  it('transforms matching files and emits a PLAIN V3 map object', () => {
    const res = run(GREEN.declFn, '/x/email.at.tsx')
    expect(res.err).toBeNull()
    expect(res.content).toContain('EmailInput_base')
    expect(res.content).not.toContain('@Card')
    // loader-runner serializes the map — it must be a plain object, not the
    // magic-string SourceMap class instance.
    expect(Object.getPrototypeOf(res.map)).toBe(Object.prototype)
    const map = res.map as { version: number; sources: string[]; sourcesContent: string[] }
    expect(map.version).toBe(3)
    expect(map.sources).toEqual(['/x/email.at.tsx'])
    expect(map.sourcesContent).toEqual([GREEN.declFn])
  })

  it('throws a positioned AtBuildError on malformed directives', () => {
    const bad = '@card\nexport function X() { return <i/> }\n'
    expect(() => run(bad, '/x/b.at.tsx')).toThrow(/\[react-decor] AT003.*\(\/x\/b\.at\.tsx:1:1\)/)
    try {
      run(bad, '/x/b.at.tsx')
    } catch (e) {
      expect((e as Error).name).toBe('AtBuildError')
    }
  })
})
