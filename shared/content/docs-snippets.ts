// Code samples for the /docs reference page — verbatim strings, never translated.
// Several are mirrored by LIVE demo atoms (src/components/docs/demo-widgets.at.tsx);
// keep sample and mirror in lockstep when editing either side.

// ── Three forms ──────────────────────────────────────────────────────────────

export const SNIPPET_FORM_BARE = `// bare — no props; the wrapper takes the target as children
@TintCard
export const DemoBareNote = () => <p>{'Wrapped in a card.'}</p>`

export const SNIPPET_FORM_CALL = `// call — ONE object literal, type-checked against the wrapper's props
@Labeled({ text: 'Email address' })
export const DemoEmailField = () => <Input type="email" name="email" placeholder="you@example.com" />`

export const SNIPPET_FORM_JSX = `// JSX — parens required (bare @<Badge /> cannot parse)
@(<Badge variant="secondary" />)
export const DemoVersionBadge = () => <>{'v0.1.0'}</>`

// ── Four placements ──────────────────────────────────────────────────────────

export const SNIPPET_PLACE_DECL = `// 1 — top-level declaration: the wrapper rides the component itself
@SectionShell({ bare: true, id: 'why' })
export function WhyStrip() {
  return <WhyStripBody />
}`

export const SNIPPET_PLACE_LOCAL = `// 2 — local declaration: grammar-legal, forbidden by no-local-atom —
// a local component gets a NEW identity every render, so React
// remounts its whole subtree. Hoist it to module scope.
export function PricingTable({ plans }: Props) {
  @(<Card />)
  const PlanTile = (plan: Plan) => <div>{plan.name}</div>
  return plans.map((plan) => <PlanTile key={plan.id} {...plan} />)
}`

export const SNIPPET_PLACE_RETURN = `// 3 — above a return: full function scope (hooks, props, locals)
export function StatsBand() {
  const { t } = useTranslation()
  @(<Region label={t('stats.region')} />)
  return <StatsBandList />
}`

export const SNIPPET_PLACE_TREE = `// 4 — inside the tree: wraps EXACTLY the next sibling (JSX form only)
return (
  <section>
    @(<TintCard />)
    <p>{'Only this sibling is wrapped.'}</p>
    <p>{'This one is not.'}</p>
  </section>
)`

// ── Scoping ──────────────────────────────────────────────────────────────────

export const SNIPPET_SCOPING_ESCAPE = `// a literal "@(" in JSX copy must be an expression, or it parses
// as a directive (AT001 flags the malformed remainder)
<p>{'Use @( to open a JSX-form directive.'}</p>`

// ── Target slots ($at) ───────────────────────────────────────────────────────

export const SNIPPET_SLOTS_ELEMENT = `// decorator args take ANY expression — including elements
@SlotPane({ header: <em>{'From a decorator arg.'}</em> })
export const DemoElementArg = () => <p>{'The body is still children.'}</p>`

export const SNIPPET_SLOTS_AT = `// $at routes the decorated target into a NAMED prop — the wrapper
// emits self-closing, and the slot prop is type-checked
import { $at } from 'react-decor'

@SlotPane({ header: <em>{'A named slot.'}</em>, body: $at })
export const DemoTargetSlot = () => <p>{'Spliced into body={…}.'}</p>`

export const SNIPPET_SLOTS_COMPOSE = `// composes inside expressions (render props) and through stacks
@Boundary({ fallback: <Oops />, render: () => $at })
export function Feed(props: Props) { … }
// → <Boundary fallback={<Oops />} render={() => <Feed_base {...props} />} />

@Frame({ content: $at })
@Card
export function Panel(props: Props) { … }
// → <Frame content={<Card><Panel_base {...props} /></Card>} />`

// ── Keyed-tile convention ────────────────────────────────────────────────────

export const SNIPPET_FULL_STRIP = `// tiles at module scope — stable identity across re-renders
@StaggerItem({ className: 'flex h-full flex-col gap-3 rounded-xl border p-5' })
const FeatureTile = ({ item }: { item: (typeof FEATURES)[number] }) => {
  const { t } = useTranslation()
  return (
    <>
      <h3>{t(\`home.why.items.\${item.key}.title\`)}</h3>
      <p>{t(\`home.why.items.\${item.key}.body\`)}</p>
    </>
  )
}

// the mapped grid rides a decl-@Stagger Body atom; key on the callsite
@Stagger({ className: 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4' })
const WhyStripBody = () => FEATURES.map((item) => <FeatureTile key={item.key} item={item} />)

// the section is pure composition
@SectionShell({ bare: true, id: 'why' })
export function WhyStrip() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading eyebrow={t('…')} title={t('…')} />
      <WhyStripBody />
    </>
  )
}`

export const SNIPPET_SPECIALIZATION = `// no props channel into decl args — specialize statically instead
@Link({ to: '/work', viewTransition: true, className: BACK_LINK })
export const WorkBackLink = () => <BackLinkLabel />

@Link({ to: '/insights', viewTransition: true, className: BACK_LINK })
export const InsightsBackLink = () => <BackLinkLabel />`

export const SNIPPET_BAKED = `// every callsite paired SectionHeading with @(<Reveal />) — bake it
// into the declaration once and delete the per-callsite directives
@Reveal
export function SectionHeading(props: SectionHeadingProps) {
  return <HeadingBlock {...props} />
}`

export const SNIPPET_LOCAL_ATOM_BAD = `// ✗ the tiles would remount on EVERY parent render — counters reset
export function IdentityDemo() {
  @Button({ variant: 'outline' })          // react-decor/no-local-atom
  const ClickTile = ({ id }: { id: string }) => <TileBody id={id} />
  return TILE_IDS.map((id) => <ClickTile key={id} id={id} />)
}`

// ── The Slot boundary ────────────────────────────────────────────────────────

export const SNIPPET_SLOT_BAD = `// ✗ compiles green, renders broken: Slot clones <CtaLink_base />, so
// the Button's className/handlers land on the LABEL, not the wrapper
@(<Button asChild size="lg" />)          // react-decor/no-aschild-decl-decorator
const CtaLink = () => <Link to="/docs">{'Read the docs'}</Link>`

export const SNIPPET_SLOT_GOOD = `// ✓ the pair stays in one return — the Link remains Slot's literal child
const DocsCta = () => {
  const { t } = useTranslation()
  @(<Button asChild size="lg" />)
  return <Link to="/docs">{t('cta.docs')}</Link>
}`

// ── Footguns ─────────────────────────────────────────────────────────────────

export const SNIPPET_FG_KEY_PROP = `// ✗ React reserves key — it arrives undefined (dev logs an error)
const Tile = ({ key, item }: TileProps) => <ItemCard item={item} />

// ✓ the key rides the map's callsite element
ITEMS.map((item) => <Tile key={item.slug} item={item} />)`

export const SNIPPET_FG_T_PROP = `// ✗ threading t through props — context already provides it
const Tile = ({ t, item }: { t: TFunction; item: Item }) => …

// ✓ every atom reads its own
const Tile = ({ item }: { item: Item }) => {
  const { t } = useTranslation()
  return <p>{t(\`items.\${item.key}.title\`)}</p>
}`

export const SNIPPET_FG_PROPS_SELECTOR = `// ✗ decl args are module-scope: this passes the FUNCTION itself
// as the prop value — it never sees the component's props
@Link({ to: ({ to }) => to })            // react-decor/no-props-selector-decl
const NavLink = ({ to }: { to: string }) => <NavLabel />`

export const SNIPPET_FG_STATIC_RETURN = `// ✗ reads nothing from scope — it belongs on the declaration
const Cta = () => {
  @(<Reveal className="mt-10" />)        // react-decor/no-static-return-directive
  return <CtaButton />
}

// ✓ @Reveal({ className: 'mt-10' }) above the declaration instead`

export const SNIPPET_FG_LOCAL_ATOM = `// ✗ new identity every render — the subtree remounts each time
export function Grid({ items }: Props) {
  @(<Card />)                            // react-decor/no-local-atom
  const Tile = (item: Item) => <span>{item.name}</span>
  return items.map((item) => <Tile key={item.id} {...item} />)
}`

export const SNIPPET_FG_JSX_KEY = `// ✗ banned outright by the repo config
// eslint-disable-next-line react/jsx-key
return items.map((item) => <Tile item={item} />)

// ✓ a keyed tile — or key the returned element: the transform
//   hoists it onto the emitted wrapper (the array element)`

// ── Toolchain ────────────────────────────────────────────────────────────────

export const SNIPPET_VIRTUALIZED = `// raw source               what the type-checker sees   (same length, same spans)
@Labeled({ text })          !Labeled({ text })           // call: props type-checked
@Card                       ;Card                        // bare
@(<Badge tone="new" />)     ;(<Badge tone="new" />)      // JSX form
  @(<TintCard />)             { <TintCard />}            // inside a tree`
