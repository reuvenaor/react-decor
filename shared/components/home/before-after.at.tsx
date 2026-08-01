import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SectionShell } from '@shared/components/site/section-shell'
import { SNIPPET_AFTER_DECORATED, SNIPPET_BEFORE_PYRAMID } from '@shared/content/snippets'

const CAPTION = 'text-muted-foreground text-xs font-medium tracking-wide uppercase'

// Two fully static panes instead of one parameterized pane atom — decl args have no
// props channel, so per-instance decl wrappers are expressed by full static
// specialization (the BackLink pattern from the conventions).
@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const BeforePane = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 className={CAPTION}>{t('home.before.caption_before')}</h3>
      <CodeBlock filename="stats-band.tsx" code={SNIPPET_BEFORE_PYRAMID} />
    </>
  )
}

@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const AfterPane = () => {
  const { t } = useTranslation()
  return (
    <>
      <h3 className={CAPTION}>{t('home.before.caption_after')}</h3>
      <CodeBlock filename="stats-band.at.tsx" code={SNIPPET_AFTER_DECORATED} />
    </>
  )
}

@Stagger({ className: 'mt-12 grid items-start gap-6 lg:grid-cols-2' })
const BeforeAfterBody = () => (
  <>
    <BeforePane />
    <AfterPane />
  </>
)

/** A real section written both ways — the pyramid, then the strip. */
@SectionShell({
  id: 'before-after',
  'data-section': 'before-after',
  className: 'border-border bg-card/40 scroll-mt-8 border-y',
})
export function BeforeAfter() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading
        eyebrow={t('home.before.eyebrow')}
        title={t('home.before.heading')}
        intro={t('home.before.intro')}
      />
      <BeforeAfterBody />
      <p className="text-muted-foreground mt-6 text-sm">{t('home.before.note')}</p>
    </>
  )
}
