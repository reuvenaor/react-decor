'use client'

import { BeforeAfter } from '@shared/components/home/before-after.at'
import { ConventionsTeaser } from '@shared/components/home/conventions-teaser.at'
import { CtaBand } from '@shared/components/home/cta-band.at'
import { HeroSection } from '@shared/components/home/hero-section.at'
import { QuickStart } from '@shared/components/home/quick-start.at'
import { WhyStrip } from '@shared/components/home/why-strip.at'

// Home — the same composition as the react-router app's _app._index.tsx route:
// hero, why grid, before/after comparison, quick start, convention teasers, CTA.
export function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyStrip />
      <BeforeAfter />
      <QuickStart />
      <ConventionsTeaser />
      <CtaBand />
    </>
  )
}
