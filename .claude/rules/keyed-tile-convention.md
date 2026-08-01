# Rule: adopt the keyed-tile convention everywhere

**Every mapped wrapper site uses a keyed tile: extract the mapped item into a decorated
atom and put the `key` on the map's callsite element, where lint can see it. Never
declare `key` (or `t`) as a component prop. Static attrs ride the decl call form;
anything reading props/hooks/locals rides a return-position directive. The direct
child of an `asChild` wrapper stays a literal element. Disabling `react/jsx-key` is
banned outright.**

## The shape

```tsx
@StaggerItem({ className: 'h-full' })
const InsightTile = ({ item }: { item: InsightItem }) => <InsightCard item={item} />

@Stagger({ className: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' })
export function InsightsGrid() {
  return INSIGHTS.map((item) => <InsightTile key={item.slug} item={item} />)
}
```

Tiles are local, non-exported `const` arrows named for what they render (`InsightTile`,
`WorkTile`, `ValueTile`) — exported only when consumed cross-file. Atoms that need
translation call `useTranslation()` inside; zero-prop callsites are the point.

**The full-strip section shape** (the `why-strip.at.tsx` exemplar, condensed): tiles
live at MODULE scope (stable identity — no remount when the section re-renders), the
mapped grid rides a decl-`@Stagger` **Body atom** (`<Section>Body`), and
the section component is pure composition — heading inline (SectionHeading self-reveals
via its baked `@Reveal`) plus the Body (plus a `<Section>Cta` atom where the strip has
one):

```tsx
@StaggerItem({ className: 'flex h-full flex-col gap-3 rounded-xl border p-5' })
const FeatureTile = ({ item }: { item: (typeof FEATURES)[number] }) => {
  const { t } = useTranslation()
  return <>…</>
}

@Stagger({ className: 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4' })
const WhyStripBody = () => FEATURES.map((item) => <FeatureTile key={item.key} item={item} />)

@SectionShell({ bare: true, id: 'why', 'data-section': 'why', className: 'scroll-mt-8' })
export function WhyStrip() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading eyebrow={t('…')} title={t('…')} intro={t('…')} />
      <WhyStripBody />
    </>
  )
}
```

Two refinements complete the shape:

- **One wrapper per atom, decl form maximized.** A return-position stack is unbundled:
  every static wrapper peels off into its own decl atom (`@Stagger` → the `<X>Body`
  grid atom, `@Reveal` → a `<X>Cta` layer); a return-position directive carries ONLY
  the wrapper that genuinely needs function scope (a `Region` label reading `t()`, a
  dialog reading store state). The one
  irreducible pair is `@(<Button asChild/>)` over its literal Link — Slot requires
  them in the same return.
- **No pass-through atoms.** An atom must CARRY a wrapper (or be the Slot pair). A
  component that only renders another atom is indirection to delete — the hook-reading
  wrapper rides the consuming component's own return instead
  (`StatsBand() { @(<Region label={t(…)}/>)  return <StatsBandList /> }`).

Lists of lowercase leaves (`<p>`, `<details>`) key the leaf directly inside the Body —
no tile (there is no wrapper to ride).

## The footguns this exists to prevent

1. **`key` as a tile prop** — React reserves `key`: it arrives `undefined` and dev
   builds log a console error on access, tripping the smoke suite's zero-console gate.
   The map-side `key={item.slug}` is the only key React uses.
2. **Props selectors in decl args** (`to: ({ to }) => to`) — decl-decorator args are
   module-scope only; the function itself is passed to the wrapper AS the prop. Use a
   return-position directive (full scope), or fully-static specialized atoms
   (`WorkBackLink` / `InsightsBackLink` each pinning their own `to`).
3. **`asChild` in a declaration-position decorator** — Radix Slot clones the emitted
   `<X_base {...props}/>` and the injected button className/handlers are silently
   dropped (compile-green, renders an unstyled control). The wrapper stack rides a
   return-position pair inside the atom so the `<Link>`/child stays the literal Slot
   child. Empirical proof: the RED fixture
   [lib/react-decor/test/\_\_fixtures\_\_/project/slot-decl.at.tsx](../../lib/react-decor/test/__fixtures__/project/slot-decl.at.tsx).
   The one sanctioned exception: an atom that **forwards** —
   spreads its props onto its root element (`(p) => <Link {...p} …>`) — passes the
   injection through, and the lint rule exempts the innermost decl directive there.
   Site atoms stay zero-prop by convention, so the return-position pair remains the
   default shape here.
4. **Threading `t` through props** — i18next context exists so `t` is never
   prop-drilled; every atom reads its own.

Also: when EVERY usage of a component pairs it with the same wrapper, bake the wrapper
into the component's own declaration (`@Reveal` on `SectionHeading`) instead of
repeating per-callsite directives.

## Stays literal by design

Lowercase tags (AT003 — hash/social `<a>`, `motion.*`), multi-child content wrappers
(an in-tree directive wraps exactly one element), the vendored per-app
`examples/*/src/components/ui/**`,
and the direct children of `asChild` wrappers. Route files are never `.at.tsx`
(flatRoutes splits on dots) — they import atoms.

## Enforcement

| Layer                                                                                                                | Catches                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-decor/no-key-prop` + `react-decor/no-t-prop` (repo-wide, all jsx/tsx)                                         | footguns 1 and 4                                                                                                                                                    |
| `react-decor/no-aschild-decl-decorator` + `react-decor/no-props-selector-decl` (`*.at.tsx` via `reactDecorEslint()`) | footguns 2 and 3                                                                                                                                                    |
| `react-decor/no-static-return-directive` (`*.at.tsx`) — scope-analysis: attrs reading no props/hooks/locals          | static wrappers left at return position (the rip's decl-maximization)                                                                                               |
| `react-decor/no-passthrough-atom` (`*.at.tsx`)                                                                       | undecorated components that only render one bare atom (pass-through layers)                                                                                         |
| `react-decor/no-local-atom` (`*.at.tsx`)                                                                             | decorated declarations inside function bodies — identity churn, subtree remounts every parent render                                                                 |
| `@eslint-community/eslint-comments/no-restricted-disable: react/jsx-key`                                             | the disable escape — a keyed tile, a ternary return, or a key on the returned element (the transform hoists it onto the emitted wrapper) always removes the need    |
| at-tsc / the scanner                                                                                                 | module-scope `t(...)` (TS2304), decorating a bare JSX expression (AT007)                                                                                            |
| behavioral (this file)                                                                                               | tile naming/visibility, hooks-inside, the bake-into-declaration call                                                                                                |

Full grammar + conventions: [lib/react-decor/README.md](../../lib/react-decor/README.md)
("Conventions" and "The Slot boundary").
