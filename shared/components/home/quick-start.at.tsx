import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SectionShell } from '@shared/components/site/section-shell'
import { QUICKSTART } from '@shared/content/quickstart'

// Each step tile IS a StaggerItem; the map keys the tile usage. The number chip is
// data (index), not copy — interpolated through i18n for the accessible ordering.
@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const QuickStartStep = ({
  step,
  index,
}: {
  step: (typeof QUICKSTART)[number]
  index: number
}) => {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
        >
          {index + 1}
        </span>
        <h3 className="text-base font-semibold tracking-tight">
          {t(`home.quickstart.steps.${step.key}.title`)}
        </h3>
      </div>
      <p className="text-muted-foreground text-sm">{t(`home.quickstart.steps.${step.key}.body`)}</p>
      <CodeBlock className="mt-auto lg:h-72" filename={step.filename} code={step.snippet} />
    </>
  )
}

@Stagger({ className: 'mt-12 grid gap-6 lg:grid-cols-2' })
const QuickStartBody = () =>
  QUICKSTART.map((step, index) => <QuickStartStep key={step.key} step={step} index={index} />)

/** Integration in four files — each step with the exact config it touches. */
@SectionShell({
  bare: true,
  id: 'quick-start',
  'data-section': 'quick-start',
  className: 'scroll-mt-8',
})
export function QuickStart() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading
        eyebrow={t('home.quickstart.eyebrow')}
        title={t('home.quickstart.heading')}
        intro={t('home.quickstart.intro')}
      />
      <QuickStartBody />
    </>
  )
}
