import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { SNIPPET_SCOPING_ESCAPE } from '@shared/content/docs-snippets'

@DocTopic({ id: 'scoping', 'data-section': 'scoping' })
export function ScopingSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.scoping.title')} intro={t('docs.scoping.intro')} />
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.scoping.p1')}</p>
      <ul className="text-muted-foreground flex max-w-3xl list-disc flex-col gap-2 ps-5 text-base">
        <li>{t('docs.scoping.rule_childless')}</li>
        <li>{t('docs.scoping.rule_capitalized')}</li>
        <li>{t('docs.scoping.rule_top')}</li>
      </ul>
      <p className="text-muted-foreground max-w-3xl text-base">{t('docs.scoping.p2')}</p>
      <CodeBlock code={SNIPPET_SCOPING_ESCAPE} className="max-w-3xl" />
    </>
  )
}
