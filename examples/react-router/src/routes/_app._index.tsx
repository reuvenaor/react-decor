// Home — the react-decor pitch: hero (the before/after in miniature), the why grid
// (its own keyed-tile proof), the full pyramid-vs-decorated comparison, the
// four-file quick start, convention teasers into /docs, and the closing CTA.
// Renders inside the shared _app.tsx layout; prerendered to static HTML.
import { BeforeAfter } from '@shared/components/home/before-after.at'
import { ConventionsTeaser } from '@shared/components/home/conventions-teaser.at'
import { CtaBand } from '@shared/components/home/cta-band.at'
import { HeroSection } from '@shared/components/home/hero-section.at'
import { QuickStart } from '@shared/components/home/quick-start.at'
import { WhyStrip } from '@shared/components/home/why-strip.at'
import { metaFor } from '@/lib/seo'

export function meta() {
  return metaFor('home.meta.title', 'home.meta.desc')
}

export default function Index() {
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
