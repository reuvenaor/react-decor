# react-decor

Compile-time `@` decorators for React function components — compiled away into **pure
nested JSX composition**. No HOCs (no function ever receives or returns a component at
runtime), no runtime library code, zero bundle impact.

```tsx
@Card
@Labeled({ text: 'Email address' })
export function EmailInput(props: InputProps) {
  return <input type="email" {...props} />
}
```

ships as exactly what you would write by hand:

```tsx
function EmailInput_base(props: InputProps) {
  return <input type="email" {...props} />
}
export function EmailInput(props) {
  return (
    <Card>
      <Labeled text={'Email address'}>
        <EmailInput_base {...props} />
      </Labeled>
    </Card>
  )
}
```

## Install

```bash
npm install -D react-decor react-decor-ts-plugin
```

`react-decor` ships the transform and every integration surface as subpath exports —
`react-decor/vite` (Vite plugin), `react-decor/webpack` (webpack/Turbopack loader),
`react-decor/eslint` (flat-config helper + rules), `react-decor/eslint-parser`, the
`at-tsc` bin, and the `$at` sentinel from the package root. `react-decor-ts-plugin` is
the companion tsserver plugin for editor support. Wiring for each tool:
[Integration](#integration).

**Compatibility.** `typescript >= 5.0` and `react >= 18` (both declared as wide,
optional peers alongside `vite >= 5` and `@typescript-eslint/parser >= 8`).
react-decor is compile-time only — nothing of it runs or ships in your bundle, the
one runtime dependency is `magic-string`, and the chain is plain CommonJS resolved
against your project's own `typescript`. Every release is CI-verified in a scratch
consumer at TS 5.0 / 5.8 / latest × React 18 / latest: transform output, AT
diagnostics, `at-tsc`, a real `react-dom` render, and the ESLint rules.

## Syntax

Decorated files use the **`*.at.tsx`** filename convention — it scopes every tool
(the Vite transform, `at-tsc`, the tsserver plugin, the ESLint parser, the Prettier
exclusion) to a small, visible surface.

**Three decorator forms** (declaration and return positions):

```tsx
@Card                                // bare — no props
@Labeled({ text: 'Email address' })  // call — one object literal, passed as props
@(<Badge tone="new" />)              // JSX — parens required (bare @<Badge /> cannot parse)
```

**Four placements** — top decorator is always the outermost wrapper:

```tsx
// 1. Top-level component declarations (function or const arrow, export/export default)
@(<SectionShell tint="muted" />)
export function StatsBand() { … }

// 2. Local component declarations inside another component — grammar-legal, but the
//    plugin's no-local-atom rule forbids it by default: a local component gets a new
//    identity every render, so React remounts its subtree on each parent re-render.
//    Hoist to module scope and pass what it closed over as props.
export function PricingTable({ plans }: Props) {
  @(<Card />)
  const PlanTile = (p: Plan) => <div>{p.name}</div>
  return plans.map((p) => <PlanTile key={p.id} {...p} />)
}

// 3. Above a return — wraps the returned tree (full function scope: hooks, t(), locals)
export function Band() {
  const { t } = useTranslation()
  @(<Labeled text={t('email')} />)
  return <input type="email" />
}

// 4. Above any JSX element inside the tree, at any depth (JSX form only here)
return (
  <section>
    @(<Card tone="muted" />)
    <input />                        // ← only this sibling gets wrapped
    <SubmitButton />
  </section>
)
```

Rules: wrappers must be **childless** (the transform threads the target into them) and
**capitalized**; decorated declarations must be capitalized; inside JSX trees only the
JSX-parens form is legal (bare `@Card` in text would be indistinguishable from prose —
render literal `@(` text as `{'@('}`). Scoping is exactly what the output implies:
top-level component decorators see module scope only; return/inside-tree/local
placements see the full function scope.

**Decorator args accept any expression — including JSX**, so a wrapper can take
hand-authored elements as ordinary props:

```tsx
@Panel({ header: <Header />, tone: 'muted' })   // → <Panel header={<Header />} tone={'muted'}>…</Panel>
```

**Target slots (`$at`).** By default the decorated target becomes the wrapper's
children. Mark a prop with the `$at` sentinel and the target is spliced **there**
instead — the wrapper emits self-closing, so components whose API takes content via a
named prop (`element`, `fallback`, `content`, render props) become decoratable without
adapters:

```tsx
import { $at } from 'react-decor'

@Route({ path: '/settings', element: $at })
export function SettingsPage(props: Props) {
  return <SettingsForm {...props} />
}
// → <Route path={'/settings'} element={<SettingsPage_base {...props} />} />
```

`$at` composes inside any expression (`render: () => $at` for render-prop APIs), works
in the call and JSX forms at every placement, and stacks compose through it — each
directive below a slotted one lands inside that slot:

```tsx
@Frame({ content: $at })
@Card
export function Panel(props: Props) { … }
// → <Frame content={<Card><Panel_base {...props} /></Card>} />
```

Slot rules: at most one `$at` per directive (AT015); never a prop name, shorthand, or
spread (AT016); an inside-tree slotted wrapper must be its chain's only link (AT017).
The sentinel name resolves **per file from the import**: every local binding of the
`$at` export of `'react-decor'` is a sentinel — `import { $at as slot }` makes `slot` the
sentinel and frees the literal `$at` to be an ordinary identifier — and a file with no
such import matches the literal name `$at`. In the virtualized text the sentinel
type-checks as a `ReactElement` against the receiving prop (a check the children slot
never had); it is never a runtime value, and the leftover import tree-shakes away
(`sideEffects: false`).

## Conventions

**Keyed-tile maps (the default for mapped wrappers).** Extract the mapped item into a
decorated tile and put the `key` on the map's callsite, where lint can see it:

```tsx
@StaggerItem({ className: 'h-full' })
const InsightTile = ({ item }: { item: InsightItem }) => <InsightCard item={item} />

export function InsightsGrid() {
  return INSIGHTS.map((item) => <InsightTile key={item.slug} item={item} />)
}
```

Never declare `key` as a tile prop — React reserves it: the value arrives `undefined`
and dev builds log a console error on access. The fallback for maps that resist
extraction is a block-bodied map with a return-position directive: write the `key`
on the **returned element** — exactly where `react/jsx-key` looks — and the
transform hoists it onto the emitted outermost wrapper, the actual array element.
A `key` written on the wrapper directive itself also works verbatim (and wins over
a hoisted one); either way, no `eslint-disable` is ever needed.

At section scale this becomes the **full-strip shape**: module-scope tiles (stable
identity across re-renders), the mapped grid on a decl-`@Stagger` Body atom
(`<Section>Body`), and the section component reduced to pure composition
(heading + Body + optional Cta atom). Rip stacks all the way down: one wrapper per
atom with the decl form maximized — a return-position directive carries only what
reads hooks/props, riding the consuming component's own return (never a pass-through
atom); the sole irreducible stack is `@(<Button asChild/>)` over its literal Link.

**Picking a form for atoms.** All-static attrs → the decl call form. Any attr that
reads props, hooks, or locals (`onClick`, `to={expr}`, `t()` in an attr, a className
merge, `{...props}` forwarding) → the return-position JSX form inside the component,
where the full function scope applies. There is **no props channel into decl-form
args** — a selector like `to: ({ to }) => to` passes that function itself to the
wrapper as the prop. When the decl form is wanted for a per-instance wrapper, express
it by **full static specialization** instead: several zero-prop atoms, each pinning
its own values (`WorkBackLink` / `InsightsBackLink` rather than `BackLink to=…`).

**Bake universal wrappers into the declaration.** When every usage of a component
pairs it with the same wrapper (each `<SectionHeading …/>` sat under its own
`@(<Reveal />)`), decorate the component's declaration once instead (`@Reveal` on
`SectionHeading`) and delete the per-callsite directives — the pairing becomes part
of the component's definition.

**The Slot boundary — `asChild` children stay literal, unless the atom forwards.** A
Radix `asChild` wrapper clones its child element to inject className/handlers/aria. A
decorated atom compiles to `X = props => <Wrapper…><X_base {...props}/></Wrapper>`, so
Slot's injected props land on `X_base`'s props — and are silently dropped when the
body ignores them. The escape is **props forwarding**: an atom that spreads its props
onto its root element (`(p) => <Link {...p} …>`) passes the injected
className/handlers/ref straight through the boundary, so the **innermost**
decl-position `asChild` is sound there and `no-aschild-decl-decorator` exempts it.
The exemption is checked mechanically and fails closed: the atom must forward on
**every** return path (a branch may return `null`), must not clobber an injected
prop (`className`/`style`/`ref`/`on*`) with a named attribute placed **after** the
spread — merge instead (`className={cn('x', p.className)}`) — and a destructured
injected key must be re-applied from its local. One runtime caveat rides the wide
react peer: the injected **ref** travels through the spread only on React 19
(ref-as-prop); on React 18 it is dropped with the function-component ref warning
(the compat matrix pins both behaviors). Non-forwarding atoms keep the original rule:
the `asChild` wrapper may be a directive (`@(<SheetTrigger asChild />)`), but its
direct child must remain a literal element. The `$at` slot does **not** change the
cloning semantics — routing the target into any prop still passes the generated
`<X_base/>` element, never the literal child.

**Stays literal by design:** lowercase tags (AT003 — hash/social `<a>`, `motion.*`),
multi-child content wrappers (an in-tree directive wraps exactly one element), and
vendored `ui/` primitives.

**Enforced by lint.** The `react-decor` ESLint plugin (exported as `reactDecorPlugin` from
`react-decor/eslint`; the `reactDecorEslint()` helper enables the full set on `*.at.tsx`)
turns the mechanical halves of these conventions into errors:
`no-aschild-decl-decorator` (the Slot boundary at declaration position; innermost
directives over a props-forwarding atom are exempt),
`no-props-selector-decl` (no props channel into decl args),
`no-static-return-directive` (scope analysis proves a return-position wrapper reads
no props/hooks/locals — it belongs on a declaration; asChild exempt),
`no-local-atom` (decorated declarations inside function bodies remount their subtree
every parent render — hoist to module scope),
`no-passthrough-atom` (an undecorated component rendering one bare atom is
indirection to delete),
`no-stray-at-sentinel` (`$at` outside directive arguments is a real identifier whose
runtime value is undefined), and — worth applying to ALL React files, decorated or
not — `no-key-prop` and `no-t-prop`. Banning disables of `react/jsx-key` outright is
also recommended: a keyed tile, a ternary return, or a key on the returned element
(hoisted onto the emitted wrapper) always removes the need.

## How the toolchain stays green

Raw `@` on functions is invalid TypeScript (TS1206 is checker-level and hard-coded;
no tsconfig flag exists). But TS's _parser_ accepts it with the decorators intact, and
a **same-length, position-preserving swap** turns every directive into valid,
type-checkable code: declarations/returns become expression statements (`@` → `;`, or
`@` → `!` for the call form — `!Card({ tone })` type-checks the props object against
the component while the negation keeps ReactNode-returning call results out of
no-floating-promises), and inside trees `@(`…`)` → `{ `…`}`. Three shims virtualize
exactly that:

| Tool           | Shim                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit` | the `at-tsc` bin (wraps the CompilerHost; recurses solution configs; code frames from raw text)                                                                                 |
| the IDE        | `react-decor-ts-plugin` in tsconfig `plugins` (editor shows raw text, language service sees virtual — hover/go-to-def/completions work inside decorators; use the workspace TS) |
| ESLint         | `react-decor/eslint` flat-config helper (parser wrapper scoped to `**/*.at.tsx`; also disables `no-unused-expressions` there)                                                   |
| Prettier       | no parse possible — add `*.at.tsx` to `.prettierignore` (keep long class strings in composer components, which stay formatted)                                                  |

**The `$at` slot type boundary.** The virtualized view types the sentinel as a bare
`ReactElement`, which fully checks **declaration**-position slots (the splice there
is always `<X_base {...props} />`). Return-position and in-tree slots splice an
arbitrary expression, so `at-tsc` runs a **second pass** for files containing them:
one extra Program type-checks the real transformed output, maps diagnostics back
through the transform's sourcemap, and dedups against the first pass — a
`element={ok ? <a/> : null}` against a non-null prop is caught at the gate. The
tsserver plugin still sees only the stand-in (a known limitation: the IDE won't
squiggle a slot-type mismatch that `at-tsc` and CI will reject).

## Integration

```ts
// vite.config.ts — BARE specifier by design: Vite's config loader externalizes bare
// ids to a native Node import, and react-decor's whole chain is plain CommonJS (no build
// step, no type stripping). A relative import would get bundled into the config and
// break on require('typescript') being rewritten to a file:// URL.
import reactDecor from 'react-decor/vite'
export default defineConfig({ plugins: [reactDecor(), reactRouter(), …] })
```

```jsonc
// tsconfig.app.json
"plugins": [{ "name": "@react-router/dev" }, { "name": "react-decor-ts-plugin" }]
```

```js
// eslint.config.js
import { reactDecorEslint } from 'react-decor/eslint'
export default tseslint.config(…, reactDecorEslint(), prettier)
```

```jsonc
// package.json
"typecheck": "react-router typegen && at-tsc -p tsconfig.app.json --noEmit && …"
```

### Next.js / webpack

The `react-decor/webpack` loader wraps the same core `transform` for loader-runner
consumers. It must run BEFORE the TS/JSX compiler parses the file (raw `@`
directives are not valid input for SWC/tsc) — the webpack analog of the Vite
plugin's `enforce: 'pre'`.

```ts
// next.config.ts (Turbopack — the default bundler): the rule transforms
// *.at.tsx and `as` re-enters the normal TSX pipeline.
const nextConfig: NextConfig = {
  turbopack: {
    rules: { '*.at.tsx': { loaders: ['react-decor/webpack'], as: '*.tsx' } },
  },
  // at-tsc is the type gate (Next's own tsc cannot parse raw .at.tsx):
  typescript: { ignoreBuildErrors: true },
}
```

```js
// plain webpack — register as a pre-loader
module.rules.push({ test: /\.at\.tsx$/, enforce: 'pre', use: 'react-decor/webpack' })
```

Monorepo note: when `*.at.tsx` sources live outside the Next app dir, set
`turbopack.root` (Turbopack) and `experimental: { externalDir: true }`
(webpack path) — otherwise SWC never transpiles the out-of-dir modules.

## Error catalog

| Code  | Meaning                                                                     |
| ----- | --------------------------------------------------------------------------- |
| AT000 | unrecognized syntax error (TypeScript parse error passed through)           |
| AT001 | malformed inside-tree directive (escape hatch for literal text: `{'@('}`)   |
| AT002 | wrapper element has children — must be self-closing or an empty pair        |
| AT003 | wrapper is not a capitalized component reference                            |
| AT004 | decorated declaration is not capitalized                                    |
| AT005 | decorated anonymous default export                                          |
| AT006 | decorator on a non-component statement                                      |
| AT007 | dangling decorators (nothing wrappable follows)                             |
| AT008 | call form takes exactly one object-literal argument                         |
| AT009 | unsupported property form in a call-form object                             |
| AT011 | decorator above a valueless `return`                                        |
| AT012 | decorator expression is not a component ref/call/JSX element (no fragments) |
| AT013 | inside-tree target is not a JSX element or `{expression}`                   |
| AT014 | generated `<Name>_base` collides with an existing declaration               |
| AT015 | more than one `$at` sentinel in a single directive                          |
| AT016 | `$at` in an invalid position (prop name, shorthand, or spread)              |
| AT017 | inside-tree chain includes a `$at` slot directive (must be the only link)   |

Every error carries a precise raw-file span and surfaces identically in the Vite build
(code frame), `at-tsc`, the IDE (squiggle), and ESLint (fatal parse error at commit).

## License

[MIT](LICENSE)
