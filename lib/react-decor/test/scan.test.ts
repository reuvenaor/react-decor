import { scan } from 'react-decor/scan'
import { describe, expect, it } from 'vitest'
import { ERRORS, GREEN } from './corpus.ts'

describe('scan — placements and forms', () => {
  it('classifies a top-level function declaration with bare + call directives', () => {
    const r = scan(GREEN.declFn, 'declFn.at.tsx')
    expect(r.errors).toEqual([])
    expect(r.groups).toHaveLength(1)
    const g = r.groups[0]
    if (g.placement !== 'declaration') throw new Error('expected declaration group')
    expect(g.directives.map((d) => d.form)).toEqual(['bare', 'call'])
    expect(g.directives[1].openTag).toBe("<Labeled text={'Email address'} data-x={1} {...rest}>")
    expect(g.target).toMatchObject({
      kind: 'function-decl',
      name: 'EmailInput',
      exported: true,
      isDefault: false,
      usesProps: false,
    })
  })

  it('handles export default and const-arrow declarations', () => {
    const def = scan(GREEN.declDefault, 'd.at.tsx').groups[0]
    if (def.placement !== 'declaration') throw new Error('expected declaration group')
    expect(def.target).toMatchObject({ name: 'Hero', isDefault: true })
    expect(def.directives[0].form).toBe('jsx')

    const arrow = scan(GREEN.declConstArrow, 'a.at.tsx').groups[0]
    if (arrow.placement !== 'declaration') throw new Error('expected declaration group')
    expect(arrow.target).toMatchObject({ kind: 'const-arrow', name: 'Chip', exported: true })
  })

  it('finds local declarations inside a component body', () => {
    const r = scan(GREEN.localDecl, 'l.at.tsx')
    expect(r.errors).toEqual([])
    expect(r.groups.map((g) => g.placement)).toEqual(['declaration'])
  })

  it('recovers return-position directives from MissingDeclaration nodes', () => {
    const r = scan(GREEN.returnJsx, 'r.at.tsx')
    expect(r.errors).toEqual([])
    const g = r.groups[0]
    if (g.placement !== 'return') throw new Error('expected return group')
    expect(g.directives.map((d) => d.form)).toEqual(['jsx', 'bare'])
    expect(g.exprIsJsx).toBe(true)
    expect(scan(GREEN.returnNonJsx, 'n.at.tsx').groups[0]).toMatchObject({ exprIsJsx: false })
    expect(scan(GREEN.returnMulti, 'm.at.tsx').groups).toHaveLength(2)
  })

  it('parses inside-tree chains, including the ") @(" shared text node', () => {
    const r = scan(GREEN.tree, 't.at.tsx')
    expect(r.errors).toEqual([])
    const g = r.groups[0]
    if (g.placement !== 'jsx-child') throw new Error('expected jsx-child group')
    expect(g.directives.map((d) => d.name)).toEqual(['Card', 'Labeled'])
    const same = scan(GREEN.treeSameLine, 's.at.tsx').groups[0]
    if (same.placement !== 'jsx-child') throw new Error('expected jsx-child group')
    expect(same.directives.map((d) => d.name)).toEqual(['A', 'B'])
  })

  it('accepts empty-pair wrappers and expression-container targets', () => {
    expect(scan(GREEN.treeEmptyPair, 'e.at.tsx').errors).toEqual([])
    expect(scan(GREEN.treeExprTarget, 'x.at.tsx').errors).toEqual([])
  })

  it('call-form args accept element values (spliced verbatim into the open tag)', () => {
    const r = scan(GREEN.declElemArg, 'ea.at.tsx')
    expect(r.errors).toEqual([])
    const g = r.groups[0]
    if (g.placement !== 'declaration') throw new Error('expected declaration group')
    expect(g.directives[0].openTag).toBe("<Panel header={<H titled />} tone={'x'}>")
  })

  it('flags props-identifier capture and supports dotted wrapper names', () => {
    const p = scan(GREEN.propsRef, 'p.at.tsx').groups[0]
    if (p.placement !== 'declaration') throw new Error('expected declaration group')
    expect(p.target.usesProps).toBe(true)
    expect(scan(GREEN.dottedName, 'dot.at.tsx').errors).toEqual([])
  })

  it('classifies target-slot directives (call + jsx forms) with the split emit pair', () => {
    const r = scan(GREEN.declSlotCall, 'sc.at.tsx')
    expect(r.errors).toEqual([])
    const g = r.groups[0]
    if (g.placement !== 'declaration') throw new Error('expected declaration group')
    expect(g.directives[0]).toMatchObject({
      form: 'call',
      slotted: true,
      openTag: "<Route path={'/settings'} element={",
      closeTag: '} />',
    })
    const t = scan(GREEN.treeSlot, 'ts.at.tsx').groups[0]
    if (t.placement !== 'jsx-child') throw new Error('expected jsx-child group')
    expect(t.directives[0].slotted).toBe(true)
    expect(t.directives[0].sentinelStart).toBeGreaterThan(0)
    const x = scan(GREEN.treeSlotExpr, 'tx.at.tsx').groups[0]
    if (x.placement !== 'jsx-child') throw new Error('expected jsx-child group')
    expect(x.targetExpr).toBeDefined()
  })

  it('never scans expression containers as directive text (the escape hatch)', () => {
    const r = scan(GREEN.escapeHatch, 'esc.at.tsx')
    expect(r.errors).toEqual([])
    expect(r.groups).toEqual([])
  })

  it('composes all placements in one file', () => {
    const r = scan(GREEN.compose, 'c.at.tsx')
    expect(r.errors).toEqual([])
    expect(r.groups.map((g) => g.placement).sort()).toEqual([
      'declaration',
      'declaration',
      'jsx-child',
      'return',
    ])
  })
})

describe('scan — error catalog', () => {
  for (const [name, { src, code }] of Object.entries(ERRORS)) {
    it(`${name} → ${code}`, () => {
      const r = scan(src, `${name}.at.tsx`)
      expect(r.errors.length).toBeGreaterThan(0)
      expect(r.errors[0].code).toBe(code)
      // every error carries a resolvable raw-file span
      expect(r.errors[0].span.start).toBeGreaterThanOrEqual(0)
      expect(r.errors[0].span.end).toBeGreaterThan(r.errors[0].span.start)
      expect(r.errors[0].span.end).toBeLessThanOrEqual(src.length)
    })
  }

  it('bare @<Card /> points at the parens fix', () => {
    const r = scan(ERRORS.at007BareJsxHint.src, 'hint.at.tsx')
    expect(r.errors[0].message).toContain('parentheses')
  })

  it('a real syntax error inside a decorated component still surfaces', () => {
    const r = scan(ERRORS.at000Real.src, 'real.at.tsx')
    expect(r.errors.every((e) => e.code === 'AT000')).toBe(true)
  })

  it('a broken return body is not masked by the consumed 1146', () => {
    const r = scan(
      'export function B() {\n  @(<Shell />)\n  return <div><span></div>\n}\n',
      'broken.at.tsx',
    )
    expect(r.errors.some((e) => e.code === 'AT000')).toBe(true)
  })
})
