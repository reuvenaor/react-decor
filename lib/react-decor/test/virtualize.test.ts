import { virtualize } from 'react-decor/virtualize'
import { describe, expect, it } from 'vitest'
import { ERRORS, GREEN, parseDiagCount } from './corpus.ts'

describe('virtualize — guaranteed properties', () => {
  for (const [name, src] of Object.entries(GREEN)) {
    it(`${name}: same length, parse-clean, idempotent`, () => {
      const v = virtualize(src, `${name}.at.tsx`)
      expect(v.code.length).toBe(src.length)
      expect(parseDiagCount(v.code)).toBe(0)
      const again = virtualize(v.code, `${name}2.at.tsx`)
      expect(again.code).toBe(v.code)
      expect(again.changed).toBe(false)
    })
  }

  for (const [name, { src }] of Object.entries(ERRORS)) {
    it(`${name}: length is preserved even on errors (best-effort swaps)`, () => {
      const v = virtualize(src, `${name}.at.tsx`)
      expect(v.code.length).toBe(src.length)
      expect(v.errors.length).toBeGreaterThan(0)
    })
  }

  it('produces the documented swap shapes', () => {
    // bare form → `;` (a component reference is never thenable)
    const decl = virtualize(GREEN.declConstArrow, 'd.at.tsx').code
    expect(decl).toContain(';Card')
    // call form → `!` (consumes a possibly-thenable ReactNode call result)
    const call = virtualize(GREEN.declFn, 'f.at.tsx').code
    expect(call).toContain("!Labeled({ text: 'Email address'")
    // jsx form → `;` (negating a JSX literal would be tsc's TS2872 "always truthy")
    const jsx = virtualize(GREEN.declDefault, 'j.at.tsx').code
    expect(jsx).toContain(';(<Card tone="brand" />)')
    const tree = virtualize(GREEN.tree, 't.at.tsx').code
    expect(tree).toContain('{ <Card tone="x" />}')
    expect(tree).toContain('{ <Labeled text="E" />}')
    // slotted call form keeps $at in the virtual text — the slot prop type-checks
    const slot = virtualize(GREEN.declSlotCall, 'sv.at.tsx').code
    expect(slot).toContain("!Route({ path: '/settings', element: $at })")
  })

  it('identifier offsets are identical raw vs virtual (spot check)', () => {
    const src = GREEN.declFn
    const v = virtualize(src, 'o.at.tsx').code
    expect(v.indexOf('EmailInput')).toBe(src.indexOf('EmailInput'))
    expect(v.indexOf("'Email address'")).toBe(src.indexOf("'Email address'"))
  })
})
