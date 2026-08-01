import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { Reveal } from '@shared/components/motion/reveal'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SectionShell } from '@shared/components/site/section-shell'
import { FEATURES } from '@shared/content/features'
import { SNIPPET_WHY_SOURCE } from '@shared/content/snippets'

// Each feature tile IS a StaggerItem — the wrapper rides the tile declaration; the
// map keys the tile usage (React keys the array element = the emitted wrapper).
@StaggerItem({ className: 'border-border bg-card/60 flex h-full flex-col gap-3 rounded-xl border p-5' })
const FeatureTile = ({ item }: { item: (typeof FEATURES)[number] }) => {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <>
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">
        {t(`home.why.items.${item.key}.title`)}
      </h3>
      <p className="text-muted-foreground text-sm">{t(`home.why.items.${item.key}.body`)}</p>
    </>
  )
}

@Stagger({ className: 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4' })
const WhyStripBody = () => FEATURES.map((item) => <FeatureTile key={item.key} item={item} />)

// The self-proof: this very grid's tile + body source, revealed on demand. Native
// <details> keeps it zero-JS; the snippet is quoted verbatim in snippets.ts.
@Reveal({ className: 'mt-8' })
const WhySource = () => {
  const { t } = useTranslation()
  return (
    <details>
      <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer text-sm font-medium transition-colors">
        {t('home.why.source_cta')}
      </summary>
      <CodeBlock className="mt-4" filename="why-strip.at.tsx" code={SNIPPET_WHY_SOURCE} />
    </details>
  )
}

/** Value props — and the section is its own best example: a keyed-tile body. */
@SectionShell({ bare: true, id: 'why', 'data-section': 'why', className: 'scroll-mt-8' })
export function WhyStrip() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading
        eyebrow={t('home.why.eyebrow')}
        title={t('home.why.heading')}
        intro={t('home.why.intro')}
      />
      <WhyStripBody />
      <WhySource />
    </>
  )
}
