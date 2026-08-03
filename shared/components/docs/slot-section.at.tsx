import { ArrowRight } from 'lucide-react'
import { Link } from '@shared/lib/router-link'
import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DemoPanel } from '@shared/components/docs/demo-panel'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SNIPPET_SLOT_BAD, SNIPPET_SLOT_GOOD } from '@shared/content/docs-snippets'
import { Button } from '@/components/ui/button'

// The live pair: the asChild Button directive and its LITERAL Link child share one
// return — the one irreducible stack.
const SlotDemo = () => {
  const { t } = useTranslation()
  return (
    <DemoPanel>
      @(<Button asChild className="h-auto min-w-0 whitespace-normal" />)
      <Link to="/" viewTransition>
        {t('docs.slot.demo_label')}
        <ArrowRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
    </DemoPanel>
  )
}

@DocTopic({ id: 'slot', 'data-section': 'slot' })
export function SlotSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.slot.title')} intro={t('docs.slot.intro')} />
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.slot.p1')}</p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeBlock code={SNIPPET_SLOT_BAD} />
        <CodeBlock code={SNIPPET_SLOT_GOOD} />
      </div>
      <SlotDemo />
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.slot.p2')}</p>
    </>
  )
}
