import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DemoPanel } from '@shared/components/docs/demo-panel'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { DemoBareNote, DemoEmailField, DemoVersionBadge } from '@shared/components/docs/demo-widgets.at'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SNIPPET_FORM_BARE, SNIPPET_FORM_CALL, SNIPPET_FORM_JSX } from '@shared/content/docs-snippets'
import type { ComponentType } from 'react'

// Fixed-length local tuple driving the map (the data-module pattern in miniature).
// Each entry pairs a sample with its LIVE mirror atom from demo-widgets.at.tsx.
const FORMS: { key: string; snippet: string; Demo: ComponentType }[] = [
  { key: 'bare', snippet: SNIPPET_FORM_BARE, Demo: DemoBareNote },
  { key: 'call', snippet: SNIPPET_FORM_CALL, Demo: DemoEmailField },
  { key: 'jsx', snippet: SNIPPET_FORM_JSX, Demo: DemoVersionBadge },
]

@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const FormPane = ({ form }: { form: (typeof FORMS)[number] }) => {
  const { t } = useTranslation()
  const Demo = form.Demo
  return (
    <>
      <h3 className="text-lg font-semibold tracking-tight">{t(`docs.forms.${form.key}.title`)}</h3>
      <p className="text-muted-foreground max-w-3xl text-sm">{t(`docs.forms.${form.key}.body`)}</p>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <CodeBlock filename="demo-widgets.at.tsx" code={form.snippet} />
        <DemoPanel>
          <Demo />
        </DemoPanel>
      </div>
    </>
  )
}

@Stagger({ className: 'flex flex-col gap-10' })
const FormsSectionBody = () => FORMS.map((form) => <FormPane key={form.key} form={form} />)

@DocTopic({ id: 'forms', 'data-section': 'forms' })
export function FormsSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.forms.title')} intro={t('docs.forms.intro')} />
      <FormsSectionBody />
    </>
  )
}
