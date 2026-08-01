// The comprehensive react-decor reference: eleven anchored topics beside a sticky TOC.
// Renders inside the shared _app.tsx layout; prerendered to static HTML. Routes are
// never .at.tsx (flatRoutes splits on dots) — they compose decorated sections.
import { MotionConfig } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ErrorsSection } from '@shared/components/docs/errors-section.at'
import { FootgunsSection } from '@shared/components/docs/footguns-section.at'
import { FormsSection } from '@shared/components/docs/forms-section.at'
import { KeyedTileSection } from '@shared/components/docs/keyed-tile-section.at'
import { LintSection } from '@shared/components/docs/lint-section.at'
import { OverviewSection } from '@shared/components/docs/overview-section.at'
import { PlacementsSection } from '@shared/components/docs/placements-section.at'
import { ScopingSection } from '@shared/components/docs/scoping-section.at'
import { SlotSection } from '@shared/components/docs/slot-section.at'
import { TargetSlotsSection } from '@shared/components/docs/target-slots-section.at'
import { ToolchainSection } from '@shared/components/docs/toolchain-section.at'
import { TocAside } from '@shared/components/docs/toc'
import { PageHero } from '@shared/components/site/page-hero.at'
import { SectionShell } from '@shared/components/site/section-shell'
import { metaFor } from '@/lib/seo'

export function meta() {
  return metaFor('docs.meta.title', 'docs.meta.desc')
}

export default function DocsRoute() {
  const { t } = useTranslation()
  // The reference page is anchor-navigated and dense, so it drops the scroll-reveal
  // SLIDE: reducedMotion="always" disables the transform (translateY) reveals in this
  // subtree, so headings/grids don't shift as you scroll or land on a TOC anchor.
  // (Opacity fades remain — motion keeps those under reduced motion.) The landing page
  // keeps its full animations.
  return (
    <MotionConfig reducedMotion="always">
      <PageHero
        eyebrow={t('docs.hero.eyebrow')}
        title={t('docs.hero.title')}
        intro={t('docs.hero.intro')}
        className="pb-10 md:pb-12"
      />
      <SectionShell bare data-section="docs-body" className="pt-0 pb-24 md:pt-0 md:pb-28">
        <div className="grid items-start gap-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <TocAside />
          <div className="flex min-w-0 flex-col">
            <OverviewSection />
            <FormsSection />
            <PlacementsSection />
            <ScopingSection />
            <TargetSlotsSection />
            <KeyedTileSection />
            <SlotSection />
            <FootgunsSection />
            <ToolchainSection />
            <LintSection />
            <ErrorsSection />
          </div>
        </div>
      </SectionShell>
    </MotionConfig>
  )
}
