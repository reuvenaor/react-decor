import { ArrowRight } from 'lucide-react'
import { Link } from '@shared/lib/router-link'
import { useTranslation } from 'react-i18next'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SectionShell } from '@shared/components/site/section-shell'
import { TEASERS } from '@shared/content/teasers'

// The card link reads item.to — a prop — so the Link wrapper rides the RETURN
// position (decl args are module-scope only; there is no props channel into them).
const TeaserCard = ({ item }: { item: (typeof TEASERS)[number] }) => {
  const { t } = useTranslation()
  const Icon = item.icon
  @(<Link
    to={item.to}
    viewTransition
    className="border-border bg-card hover:border-primary/40 focus-visible:ring-ring group flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors focus-visible:ring-1 focus-visible:outline-none"
  />)
  return (
    <>
      <Icon className="text-primary size-5" aria-hidden="true" />
      <h3 className="text-base font-semibold tracking-tight">
        {t(`home.conventions.items.${item.key}.title`)}
      </h3>
      <p className="text-muted-foreground text-sm">{t(`home.conventions.items.${item.key}.body`)}</p>
      <span className="text-primary mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium">
        {t('home.conventions.read')}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
          aria-hidden="true"
        />
      </span>
    </>
  )
}

// The tile carries the grid wrapper; the map keys the tile usage.
@StaggerItem({ className: 'h-full' })
const TeaserTile = ({ item }: { item: (typeof TEASERS)[number] }) => <TeaserCard item={item} />

@Stagger({ className: 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3' })
const ConventionsTeaserBody = () =>
  TEASERS.map((item) => <TeaserTile key={item.key} item={item} />)

/** The three load-bearing conventions, each linking into its /docs treatment. */
@SectionShell({ bare: true, 'data-section': 'conventions', className: 'scroll-mt-8' })
export function ConventionsTeaser() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading
        eyebrow={t('home.conventions.eyebrow')}
        title={t('home.conventions.heading')}
        intro={t('home.conventions.intro')}
      />
      <ConventionsTeaserBody />
    </>
  )
}
