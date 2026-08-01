/**
 * Hero for the react-decor docs home. Owns the page's single <h1>. Pairs a staggered
 * copy column (badge, headline with the gradient keyword, subhead, CTAs) with the
 * library's elevator pitch as code: the decorated source above the exact JSX it
 * compiles to. The code column is real content (not aria-hidden chrome) — each
 * sample is a labeled, focusable scroll region.
 *
 * Full-strip shape: the static wrappers peel into module-scope @StaggerItem atoms and
 * the grid rides a decl @Stagger body ran on mount (`immediate` — the hero is above the
 * fold). The <h1>/<p> stay literal motion tags (single nodes) so the DOM is unchanged.
 * The CTA Buttons ride in-tree @ directives over literal Links (the Slot boundary —
 * asChild children must stay literal). Prerender-safe: no window/document during render.
 */
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, AtSign } from 'lucide-react'
import { Link } from '@shared/lib/router-link'
import { Trans, useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { GradientText } from '@shared/components/motion/gradient-text'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SNIPPET_HERO_INPUT, SNIPPET_HERO_OUTPUT } from '@shared/content/snippets'
import { fadeUpItem } from '@shared/lib/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Each fade-up wrapper IS a StaggerItem; the atom reads its own t.
@StaggerItem
const HeroBadge = () => {
  const { t } = useTranslation()
  return (
    <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
      <AtSign className="size-3.5" aria-hidden="true" />
      {t('home.hero.badge')}
    </Badge>
  )
}

// The Buttons are asChild: their Link children must stay literal in the SAME return
// (Radix Slot clones the child) — the irreducible in-tree pair.
@StaggerItem({ className: 'mt-8 flex flex-wrap items-center gap-3' })
const HeroCtaRow = () => {
  const { t } = useTranslation()
  return (
    <>
      @(<Button asChild size="lg" />)
      <Link to="/docs" viewTransition>
        {t('home.hero.cta_primary')}
        <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
      @(<Button asChild size="lg" variant="outline" />)
      <Link to="/docs#keyed-tile" viewTransition>
        {t('home.hero.cta_secondary')}
      </Link>
    </>
  )
}

// The pitch, as code: the decorated source above the exact JSX it compiles to.
@StaggerItem({ className: 'relative flex min-w-0 flex-col gap-3' })
const HeroCodeColumn = () => {
  const { t } = useTranslation()
  return (
    <>
      <div className="bg-primary/20 pointer-events-none absolute -inset-6 -z-10 blur-3xl" />
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {t('home.hero.you_write')}
      </p>
      <CodeBlock filename="email-input.at.tsx" code={SNIPPET_HERO_INPUT} />
      <p className="text-muted-foreground mt-2 text-xs font-medium tracking-wide uppercase">
        {t('home.hero.ships_as')}
      </p>
      <CodeBlock code={SNIPPET_HERO_OUTPUT} />
    </>
  )
}

// The two-column stagger. `immediate` runs it on mount (the hero is above the fold);
// the <h1>/<p> stay literal motion tags so the heading DOM is a single node each.
@Stagger({ immediate: true, className: 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16' })
const HeroBody = () => {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  return (
    <>
      {/* Copy column */}
      <div className="flex flex-col items-start">
        <HeroBadge />
        <motion.h1
          variants={fadeUpItem(reduce)}
          className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          <Trans i18nKey="home.hero.headline" components={{ hl: <GradientText /> }} />
        </motion.h1>
        <motion.p variants={fadeUpItem(reduce)} className="text-muted-foreground mt-6 max-w-2xl text-lg">
          {t('home.hero.subhead')}
        </motion.p>
        <HeroCtaRow />
      </div>

      {/* Code column — the pitch, as code. */}
      <HeroCodeColumn />
    </>
  )
}

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Ambient top glow — decorative. */}
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[36rem] max-w-5xl blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <HeroBody />
      </div>
    </section>
  )
}
