/**
 * Shared raw-@ sources for the scan/virtualize/transform suites. Plain strings on
 * purpose — only fixtures that must be IMPORTED through the Vite transform live as
 * real .at.tsx files under __fixtures__/ (which every standard tool ignores).
 */
import ts from 'typescript'

/** Parse-diagnostic count of a TSX source (`parseDiagnostics` is internal API). */
export function parseDiagCount(code: string): number {
  const sf = ts.createSourceFile('v.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  return (sf as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics.length
}

/** Green corpus: every placement × form combination the grammar supports. */
export const GREEN: Record<string, string> = {
  declFn: `import { Card, Labeled } from './c'
@Card
@Labeled({ text: 'Email address', 'data-x': 1, ...rest })
export function EmailInput(props) {
  return <input type="email" {...props} />
}
`,
  declDefault: `@(<Card tone="brand" />)
export default function Hero() {
  return <div>hi</div>
}
`,
  declConstArrow: `@Card
export const Chip = (p) => <span {...p} />
`,
  localDecl: `export function Table({ rows }) {
  @(<Card />)
  const Row = (r) => <li>{r.id}</li>
  return <ul>{rows.map((r) => <Row key={r.id} {...r} />)}</ul>
}
`,
  returnJsx: `export function Band() {
  const x = 1
  @(<Shell tint="muted" />)
  @Inner
  return <dl>{x}</dl>
}
`,
  returnNonJsx: `export function Maybe({ ok }) {
  @(<Card />)
  return ok ? <a href="/a">a</a> : null
}
`,
  returnMulti: `export function Two({ ok }) {
  if (ok) {
    @(<Card />)
    return <b>yes</b>
  }
  @(<Frame />)
  return <i>no</i>
}
`,
  mapReturnKey: `export function List({ items }) {
  return <ul>{items.map((it) => {
    @(<Item key={it.id} className="h-full" />)
    return <a href={it.href}>{it.label}</a>
  })}</ul>
}
`,
  mapReturnKeyOnChild: `export function List({ items }) {
  return <ul>{items.map((it) => {
    @(<Item className="h-full" />)
    return <a key={it.id} href={it.href}>{it.label}</a>
  })}</ul>
}
`,
  mapReturnSlotKeyOnChild: `export function Tabs({ items }) {
  return <nav>{items.map((it) => {
    @(<Tab panel={$at} />)
    return <Panel key={it.id} label={it.label} />
  })}</nav>
}
`,
  returnKeyOnBoth: `export function Pair({ items }) {
  return <ul>{items.map((it) => {
    @(<Item key={it.id} />)
    return <li key={it.id}>{it.label}</li>
  })}</ul>
}
`,
  tree: `export function Sec() {
  return (
    <section>
      <h2>t</h2>
      @(<Card tone="x" />)
      @(<Labeled text="E" />)
      <input />
      <button type="button">ok</button>
    </section>
  )
}
`,
  treeSameLine: `export function S3() {
  return <div>@(<A />) @(<B />) <i /> tail</div>
}
`,
  treeEmptyPair: `export function S2() {
  return <div>@(<Frame></Frame>)<img alt="" /></div>
}
`,
  treeExprTarget: `export function S4({ ok }) {
  return <div>@(<Card />){ok && <b>y</b>}</div>
}
`,
  declElemArg: `import { Panel, H } from './c'
@Panel({ header: <H titled />, tone: 'x' })
export function Body(props) {
  return <p {...props} />
}
`,
  treeElemArg: `export function S5() {
  return <div>@(<Panel header={<H />} />)<input /></div>
}
`,
  propsRef: `const props = { a: 1 }
@Card({ v: props.a })
export function P() { return <i/> }
`,
  dottedName: `@UI.Card
export function D() { return <i/> }
`,
  declSlotCall: `import { $at } from 'react-decor'
@Route({ path: '/settings', element: $at })
export function SettingsPage(props) {
  return <form {...props} />
}
`,
  declSlotExpr: `@Boundary({ fallback: <Oops />, render: () => $at })
export function Feed() {
  return <ul />
}
`,
  declSlotStack: `@Frame({ content: $at })
@Card
export function Panel(props) {
  return <div {...props} />
}
`,
  declSlotStackOuter: `@Card
@Frame({ content: $at })
export const Tag = () => <b>x</b>
`,
  slotPropsRef: `const props = { a: 1 }
@Frame({ v: props.a, content: $at })
export function PR() { return <i/> }
`,
  declSlotAlias: `import { $at as slot } from 'react-decor'
@Frame({ content: slot })
export function Al(props) {
  return <u {...props} />
}
`,
  declSlotAliasInert: `import { $at as slot } from 'react-decor'
@Frame({ content: slot, x: $at })
export function In(props) { return <s /> }
`,
  returnSlotJsx: `export function Gate({ ok }) {
  @(<Route element={$at} />)
  return ok ? <a href="/y">y</a> : null
}
`,
  returnSlotAttrsAfter: `export function W() {
  const n = 1
  @(<Frame content={$at} count={n} />)
  return <p>{n}</p>
}
`,
  treeSlot: `export function T1() {
  return (
    <section>
      @(<Overlay content={$at} tone="x" />)
      <input />
      <button type="button">ok</button>
    </section>
  )
}
`,
  treeSlotExpr: `export function T2({ ok }) {
  return <div>@(<Card x={$at} />){ok && <b>y</b>} tail</div>
}
`,
  compose: `@Page
export function All() {
  @(<Chrome />)
  const Local = () => <em>x</em>
  @(<Outer />)
  return <div>@(<Inner />)<Local /></div>
}
`,
  escapeHatch: `export function Esc() {
  return <div>{'@('}</div>
}
`,
}

/** Error corpus: source → the AT code the scanner must report (first error). */
export const ERRORS: Record<string, { src: string; code: string }> = {
  at000Real: {
    src: '@Card\nexport function X() { return <div> }\n',
    code: 'AT000',
  },
  at001Prose: {
    src: 'export function X() {\n  return <div>see @(docs) more</div>\n}\n',
    code: 'AT001',
  },
  at002Children: {
    src: '@(<Card><b>no</b></Card>)\nexport function X() { return <i/> }\n',
    code: 'AT002',
  },
  at003LowerWrapper: {
    src: '@card\nexport function X() { return <i/> }\n',
    code: 'AT003',
  },
  at004LowerDecl: {
    src: '@Card\nexport function x() { return <i/> }\n',
    code: 'AT004',
  },
  at005AnonDefault: {
    src: '@Card\nexport default function () {\n  return <i/>\n}\n',
    code: 'AT005',
  },
  at006NonComponent: {
    src: '@Card\nconst x = 5\n',
    code: 'AT006',
  },
  at007DanglingTree: {
    src: 'export function X() {\n  return <div>@(<Card />)</div>\n}\n',
    code: 'AT007',
  },
  at007BareJsxHint: {
    src: '@<Card />\nexport function X() { return <i/> }\n',
    code: 'AT007',
  },
  at008CallArg: {
    src: "@Card('nope')\nexport function X() { return <i/> }\n",
    code: 'AT008',
  },
  at009Method: {
    src: '@Card({ m() { return 1 } })\nexport function X() { return <i/> }\n',
    code: 'AT009',
  },
  at011ValuelessReturn: {
    src: 'export function X() {\n  @(<Card />)\n  return\n}\n',
    code: 'AT011',
  },
  at012Fragment: {
    src: '@(<></>)\nexport function X() { return <i/> }\n',
    code: 'AT012',
  },
  at013TextTarget: {
    src: 'export function X() {\n  return <div>@(<Card />) text target</div>\n}\n',
    code: 'AT013',
  },
  at014Collision: {
    src: 'const X_base = 1\n@Card\nconst X = () => <i/>\n',
    code: 'AT014',
  },
  at015TwoSlots: {
    src: '@Frame({ a: $at, b: $at })\nexport function X() { return <i/> }\n',
    code: 'AT015',
  },
  at016SlotPropName: {
    src: '@Frame({ $at: 1 })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotShorthand: {
    src: '@Frame({ $at })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotSpread: {
    src: '@Frame({ ...$at })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotAttrName: {
    src: '@(<Frame $at={1} />)\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at017TreeChainSlot: {
    src: 'export function X() {\n  return <div>@(<A />) @(<B c={$at} />) <i /></div>\n}\n',
    code: 'AT017',
  },
  // Positions the transform cannot splice — must fail closed, never emit garbage.
  at016SlotNestedShorthand: {
    src: '@Frame({ content: { $at } })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotTypePos: {
    src: '@Frame({ render: (x: $at) => 1 })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotComputedName: {
    src: '@Frame({ a: { [$at]: 1 } })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotJsxTagName: {
    src: '@(<Frame x={<$at />} />)\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
  at016SlotBindingName: {
    src: '@Frame({ render: ($at) => 1 })\nexport function X() { return <i/> }\n',
    code: 'AT016',
  },
}
