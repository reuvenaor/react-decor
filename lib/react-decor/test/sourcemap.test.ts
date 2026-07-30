import { originalPositionFor, TraceMap, type EncodedSourceMap } from '@jridgewell/trace-mapping'
import { transform } from 'react-decor/transform'
import { describe, expect, it } from 'vitest'
import { GREEN } from './corpus.ts'

// magic-string's SourceMap types `version` as number; trace-mapping requires the
// literal 3 — structurally identical at runtime, so bridge through unknown.
const asEncoded = (map: unknown) => map as EncodedSourceMap

/** 1-based line + 0-based column of `needle` in `text` (trace-mapping conventions). */
function locate(text: string, needle: string) {
  const idx = text.indexOf(needle)
  if (idx === -1) throw new Error(`needle not found: ${needle}`)
  const pre = text.slice(0, idx)
  return { line: pre.split('\n').length, column: idx - (pre.lastIndexOf('\n') + 1) }
}

describe('transform — sourcemaps', () => {
  it('inside-tree wrapper attributes map back to their exact raw offsets', () => {
    const src = GREEN.tree
    const res = transform(src, 'tree.at.tsx')
    const tracer = new TraceMap(asEncoded(res.map))
    const gen = locate(res.code, 'tone="x"')
    const mapped = originalPositionFor(tracer, { line: gen.line, column: gen.column })
    const orig = locate(src, 'tone="x"')
    expect(mapped.line).toBe(orig.line)
    expect(mapped.column).toBe(orig.column)
  })

  it('slotted in-tree emit: wrapper attrs AND the moved target keep raw offsets', () => {
    const src = GREEN.treeSlot
    const res = transform(src, 'treeSlot.at.tsx')
    const tracer = new TraceMap(asEncoded(res.map))
    for (const needle of ['tone="x"', '<input />']) {
      const gen = locate(res.code, needle)
      const mapped = originalPositionFor(tracer, { line: gen.line, column: gen.column })
      const orig = locate(src, needle)
      expect(mapped.line).toBe(orig.line)
      expect(mapped.column).toBe(orig.column)
    }
  })

  it('emits a map with the source id and embedded content', () => {
    const res = transform(GREEN.declFn, 'declFn.at.tsx')
    expect(res.map.sources).toEqual(['declFn.at.tsx'])
    expect(res.map.sourcesContent?.[0]).toBe(GREEN.declFn)
  })

  it('kept body code maps through unchanged (declaration placement)', () => {
    const src = GREEN.declFn
    const res = transform(src, 'declFn.at.tsx')
    const tracer = new TraceMap(asEncoded(res.map))
    const gen = locate(res.code, 'type="email"')
    const mapped = originalPositionFor(tracer, { line: gen.line, column: gen.column })
    const orig = locate(src, 'type="email"')
    expect(mapped.line).toBe(orig.line)
    expect(mapped.column).toBe(orig.column)
  })
})
