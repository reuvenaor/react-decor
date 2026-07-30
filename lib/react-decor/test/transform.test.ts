import { AtBuildError, transform } from 'react-decor/transform'
import { describe, expect, it } from 'vitest'
import { ERRORS, GREEN, parseDiagCount } from './corpus.ts'

const parseClean = (code: string) => parseDiagCount(code) === 0

describe('transform — output', () => {
  for (const [name, src] of Object.entries(GREEN)) {
    it(`${name}: output parses as clean TSX with no directives left`, () => {
      const r = transform(src, `${name}.at.tsx`)
      expect(parseClean(r.code), r.code).toBe(true)
      // escapeHatch INTENTIONALLY renders literal "@(" via {'@('} — everywhere else
      // no directive text may survive the transform.
      if (name !== 'escapeHatch') expect(r.code).not.toContain('@(')
      expect(r.changed).toBe(name !== 'escapeHatch')
    })
  }

  it('declaration: rename + adjacent same-name wrapper, export preserved', () => {
    const r = transform(GREEN.declFn, 'declFn.at.tsx')
    expect(r.code).toContain('function EmailInput_base(props) {')
    expect(r.code).toContain('export function EmailInput(props) {')
    expect(r.code).toContain(
      "<Card><Labeled text={'Email address'} data-x={1} {...rest}><EmailInput_base {...props} /></Labeled></Card>",
    )
  })

  it('declaration: export default and const-arrow shapes', () => {
    const d = transform(GREEN.declDefault, 'd.at.tsx').code
    expect(d).toContain('function Hero_base() {')
    expect(d).toContain('export default function Hero(props) {')
    expect(d).toContain('<Card tone="brand"><Hero_base {...props} /></Card>')

    const a = transform(GREEN.declConstArrow, 'a.at.tsx').code
    expect(a).toContain('const Chip_base = (p) => <span {...p} />')
    expect(a).toContain('export const Chip = (props) => (<Card><Chip_base {...props} /></Card>);')
  })

  it('element-valued args splice verbatim — a hand-authored component as a prop', () => {
    const d = transform(GREEN.declElemArg, 'ea.at.tsx').code
    expect(d).toContain("<Panel header={<H titled />} tone={'x'}><Body_base {...props} /></Panel>")
    const t = transform(GREEN.treeElemArg, 'et.at.tsx').code
    expect(t).toContain('<Panel header={<H />}><input /></Panel>')
  })

  it('return: wraps the returned tree; non-JSX expressions get braces', () => {
    const r = transform(GREEN.returnJsx, 'r.at.tsx').code
    expect(r).toContain('return (<Shell tint="muted"><Inner><dl>{x}</dl></Inner></Shell>)')
    const n = transform(GREEN.returnNonJsx, 'n.at.tsx').code
    expect(n).toContain('return (<Card>{ok ? <a href="/a">a</a> : null}</Card>)')
    const m = transform(GREEN.returnMulti, 'm.at.tsx').code
    expect(m).toContain('return (<Card><b>yes</b></Card>)')
    expect(m).toContain('return (<Frame><i>no</i></Frame>)')
  })

  it('block-bodied map: return directive copies attrs incl. key={expr} verbatim', () => {
    const r = transform(GREEN.mapReturnKey, 'k.at.tsx').code
    expect(r).toContain(
      'return (<Item key={it.id} className="h-full"><a href={it.href}>{it.label}</a></Item>)',
    )
  })

  it('hoists a key on the returned element to the outermost wrapper', () => {
    // The wrapper is the emitted array element — a key the author wrote on the
    // returned element (where the virtualized react/jsx-key lint sees it) must
    // ride the wrapper, or the array element ships key-less.
    const r = transform(GREEN.mapReturnKeyOnChild, 'kc.at.tsx').code
    expect(r).toContain(
      'return (<Item key={it.id} className="h-full"><a href={it.href}>{it.label}</a></Item>)',
    )
    const s = transform(GREEN.mapReturnSlotKeyOnChild, 'ks.at.tsx').code
    expect(s).toContain('return (<Tab key={it.id} panel={<Panel label={it.label} />} />)')
  })

  it('leaves the child key alone when the wrapper carries its own', () => {
    const r = transform(GREEN.returnKeyOnBoth, 'kb.at.tsx').code
    expect(r).toContain('return (<Item key={it.id}><li key={it.id}>{it.label}</li></Item>)')
  })

  it('inside-tree: chains nest tightly, siblings untouched', () => {
    const r = transform(GREEN.tree, 't.at.tsx').code
    expect(r).toContain('<Card tone="x"><Labeled text="E"><input /></Labeled></Card>')
    expect(r).toContain('<button type="button">ok</button>')
    // same-line whitespace rule: no stray text node between wrappers
    const s = transform(GREEN.treeSameLine, 's.at.tsx').code
    expect(s).toContain('<div><A><B><i /></B></A> tail</div>')
    const e = transform(GREEN.treeEmptyPair, 'e.at.tsx').code
    expect(e).toContain('<Frame><img alt="" /></Frame>')
    const x = transform(GREEN.treeExprTarget, 'x.at.tsx').code
    expect(x).toContain('<Card>{ok && <b>y</b>}</Card>')
  })

  it('target-slot: routes the decorated component into a named prop', () => {
    const r = transform(GREEN.declSlotCall, 'sc.at.tsx').code
    expect(r).toContain('function SettingsPage_base(props) {')
    expect(r).toContain(
      "return <Route path={'/settings'} element={<SettingsPage_base {...props} />} />",
    )
    const e = transform(GREEN.declSlotExpr, 'se.at.tsx').code
    expect(e).toContain('<Boundary fallback={<Oops />} render={() => <Feed_base {...props} />} />')
  })

  it('target-slot: stacks compose through and around the slot', () => {
    const s = transform(GREEN.declSlotStack, 'ss.at.tsx').code
    expect(s).toContain('<Frame content={<Card><Panel_base {...props} /></Card>} />')
    const o = transform(GREEN.declSlotStackOuter, 'so.at.tsx').code
    expect(o).toContain('(<Card><Frame content={<Tag_base {...props} />} /></Card>);')
    const p = transform(GREEN.slotPropsRef, 'sp.at.tsx').code
    expect(p).toContain('export function PR(props$) {')
    expect(p).toContain('<Frame v={props.a} content={<PR_base {...props$} />} />')
  })

  it('target-slot: an aliased import rebinds the sentinel name for the file', () => {
    const a = transform(GREEN.declSlotAlias, 'al.at.tsx').code
    expect(a).toContain('<Frame content={<Al_base {...props} />} />')
    // with the alias bound, the literal $at is an ordinary identifier again
    const i = transform(GREEN.declSlotAliasInert, 'ai.at.tsx').code
    expect(i).toContain('<Frame content={<In_base {...props} />} x={$at} />')
  })

  it('target-slot: return position slots the expression without extra braces', () => {
    const r = transform(GREEN.returnSlotJsx, 'rs.at.tsx').code
    expect(r).toContain('return (<Route element={ok ? <a href="/y">y</a> : null} />)')
    const a = transform(GREEN.returnSlotAttrsAfter, 'ra.at.tsx').code
    expect(a).toContain('return (<Frame content={<p>{n}</p>} count={n} />)')
  })

  it('target-slot: in-tree wrapper keeps its attrs in place and swallows the sibling', () => {
    const t = transform(GREEN.treeSlot, 'tt.at.tsx').code
    expect(t).toContain('<Overlay content={<input />} tone="x" />')
    expect(t).toContain('<button type="button">ok</button>')
    const x = transform(GREEN.treeSlotExpr, 'tx.at.tsx').code
    expect(x).toContain('<Card x={ok && <b>y</b>} /> tail')
  })

  it('renames the wrapper param when a directive references `props`', () => {
    const r = transform(GREEN.propsRef, 'p.at.tsx').code
    expect(r).toContain('export function P(props$) {')
    expect(r).toContain('<Card v={props.a}><P_base {...props$} /></Card>')
  })

  it('composes every placement in one pass', () => {
    const r = transform(GREEN.compose, 'c.at.tsx').code
    expect(r).toContain('function All_base() {')
    expect(r).toContain('const Local = (props) => (<Chrome><Local_base {...props} /></Chrome>);')
    expect(r).toContain('return (<Outer><div><Inner><Local /></Inner></div></Outer>)')
    expect(r).toContain('export function All(props) {')
    expect(r).toContain('<Page><All_base {...props} /></Page>')
  })
})

describe('transform — errors', () => {
  for (const [name, { src, code }] of Object.entries(ERRORS)) {
    it(`${name} throws AtBuildError ${code} with a raw position`, () => {
      let thrown: unknown
      try {
        transform(src, `${name}.at.tsx`)
      } catch (e) {
        thrown = e
      }
      expect(thrown).toBeInstanceOf(AtBuildError)
      const err = thrown as AtBuildError
      expect(err.atCode).toBe(code)
      expect(err.pos).toBeGreaterThanOrEqual(0)
      expect(err.pos).toBeLessThan(src.length)
      expect(err.message).toContain(code)
    })
  }
})
