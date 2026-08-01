// Code samples rendered by the docs' CodeBlock — verbatim strings, never translated.
// Kept OUT of the .at.tsx files so Prettier formats this module while the samples
// keep their exact shape (backticks and ${ } inside samples are escaped).

export const SNIPPET_HERO_INPUT = `@Card
@Labeled({ text: 'Email address' })
export function EmailInput(props: InputProps) {
  return <input type="email" {...props} />
}`

export const SNIPPET_HERO_OUTPUT = `function EmailInput_base(props: InputProps) {
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
}`

// The WhyStrip's own tile + body, quoted verbatim (the self-proof reveal).
export const SNIPPET_WHY_SOURCE = `@StaggerItem({ className: 'border-border bg-card/60 flex h-full flex-col gap-3 rounded-xl border p-5' })
const FeatureTile = ({ item }: { item: (typeof FEATURES)[number] }) => {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <>
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">
        {t(\`home.why.items.\${item.key}.title\`)}
      </h3>
      <p className="text-muted-foreground text-sm">{t(\`home.why.items.\${item.key}.body\`)}</p>
    </>
  )
}

@Stagger({ className: 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4' })
const WhyStripBody = () => FEATURES.map((item) => <FeatureTile key={item.key} item={item} />)`

export const SNIPPET_BEFORE_PYRAMID = `// Every wrapper nests the next — the leaf is buried four levels deep,
// and the section reads inside-out.
export function StatsBand() {
  const { t } = useTranslation()
  return (
    <SectionShell data-section="stats" className="border-y">
      <Region label={t('stats.region')}>
        <Stagger className="grid gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <StaggerItem key={stat.key} className="flex flex-col gap-2">
              <StatValue stat={stat} />
            </StaggerItem>
          ))}
        </Stagger>
      </Region>
    </SectionShell>
  )
}`

export const SNIPPET_AFTER_DECORATED = `// Identical output. Wrappers ride declarations; the key rides the map's
// callsite; the one hook-reading wrapper rides the return.
@StaggerItem({ className: 'flex flex-col gap-2' })
const StatTile = ({ stat }: { stat: Stat }) => <StatValue stat={stat} />

@Stagger({ className: 'grid gap-8 sm:grid-cols-4' })
const StatsBandList = () => STATS.map((stat) => <StatTile key={stat.key} stat={stat} />)

@SectionShell({ 'data-section': 'stats', className: 'border-y' })
export function StatsBand() {
  const { t } = useTranslation()
  @(<Region label={t('stats.region')} />)
  return <StatsBandList />
}`

export const SNIPPET_STEP_VITE = `// BARE specifier by design — the chain is plain CommonJS;
// a relative import would get bundled into the config.
import reactDecor from 'react-decor/vite'

export default defineConfig({
  plugins: [reactDecor(), reactRouter(), tailwindcss()],
})`

export const SNIPPET_STEP_TSCONFIG = `// The editor shows raw text; the language service sees
// valid code (use the workspace TypeScript).
"plugins": [
  { "name": "@react-router/dev" },
  { "name": "react-decor-ts-plugin" }
]`

export const SNIPPET_STEP_ESLINT = `// Virtualizing parser + full rule set on *.at.tsx;
// no-key-prop / no-t-prop apply to every React file.
import { reactDecorEslint } from 'react-decor/eslint'

export default tseslint.config(
  /* …type-aware blocks… */
  reactDecorEslint(),
  prettier,
)`

export const SNIPPET_STEP_SCRIPTS = `// package.json — at-tsc wraps tsc with raw-text code frames
"typecheck": "react-router typegen && at-tsc -p tsconfig.app.json --noEmit"

// .prettierignore — no parse possible, hand-format these
*.at.tsx`
