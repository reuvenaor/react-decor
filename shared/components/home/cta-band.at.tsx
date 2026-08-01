import { ArrowRight } from 'lucide-react'
import { Link } from '@shared/lib/router-link'
import { Trans, useTranslation } from 'react-i18next'
import { GradientText } from '@shared/components/motion/gradient-text'
import { Reveal } from '@shared/components/motion/reveal'
import { SectionShell } from '@shared/components/site/section-shell'
import { Button } from '@/components/ui/button'

// The Buttons are asChild: their Link/anchor children must stay literal elements in
// the SAME return (Radix Slot clones the child) — the irreducible pair.
@Reveal({
  className:
    'border-border bg-card relative overflow-hidden rounded-2xl border px-6 py-16 text-center shadow-sm sm:px-12',
})
const CtaBandBody = () => {
  const { t } = useTranslation()
  return (
    <>
      <div
        aria-hidden="true"
        className="bg-primary/10 pointer-events-none absolute inset-x-0 -top-24 mx-auto size-64 rounded-full blur-3xl"
      />
      <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        <Trans i18nKey="home.cta.heading" components={{ hl: <GradientText /> }} />
      </h2>
      <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">{t('home.cta.subhead')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        @(<Button asChild size="lg" />)
        <Link to="/docs" viewTransition>
          {t('home.cta.primary')}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
        @(<Button asChild size="lg" variant="outline" />)
        <a href="#quick-start">{t('home.cta.secondary')}</a>
      </div>
    </>
  )
}

/** Closing call-to-action band. */
@SectionShell({ bare: true, 'data-section': 'cta', className: 'py-24 md:py-32' })
export function CtaBand() {
  return <CtaBandBody />
}
