// slot-decl.at.tsx — RED lint fixture (lint-only: not in the project tsconfig
// include, so at-tsc/tsserver fixtures are unaffected). Preserves the hand-written
// insights-teasers sketch that motivated react-decor/no-aschild-decl-decorator: the
// decl-position asChild stack is the ONE violation; every other block is the
// conventional shape and must stay silent. Imports never resolve — the rules are
// syntactic.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { Reveal } from './motion/reveal'
import { Stagger, StaggerItem } from './motion/stagger'
import { InsightCard } from './insight-card.at'
import { SectionHeading } from './section-heading.at'

interface InsightItem {
  slug: string
}
declare const FEATURED_INSIGHTS: InsightItem[]

const InsightsSectionHeading = () => {
  const { t } = useTranslation()
  return <SectionHeading title={t('landing.insights.heading')} />
}

@StaggerItem({ className: 'h-full' })
const InsightTile = ({ item }: { item: InsightItem }) => <InsightCard item={item} />

@Stagger({ className: 'mt-12 grid gap-6 md:grid-cols-3' })
const InsightTitleList = () => {
  return FEATURED_INSIGHTS.map((item) => <InsightTile key={item.slug} item={item} />)
}

@Reveal({ className: 'mt-10' })
@Button({ asChild: true, variant: 'outline' })
const InsightsBackLink = () => {
  const { t } = useTranslation()
  return (
    <Link to="/insights" viewTransition>
      {t('landing.insights.cta')}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}

export function InsightsTeasers() {
  return (
    <>
      <InsightsSectionHeading />
      <InsightTitleList />
      <InsightsBackLink />
    </>
  )
}
