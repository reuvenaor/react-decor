import { useTranslation } from 'react-i18next'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { SectionHeading } from '@shared/components/site/section-heading.at'

@DocTopic({ id: 'overview', 'data-section': 'overview' })
export function OverviewSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.overview.title')} intro={t('docs.overview.intro')} />
      <div className="text-muted-foreground flex max-w-3xl flex-col gap-4 text-base">
        <p>{t('docs.overview.p1')}</p>
        <p>{t('docs.overview.p2')}</p>
      </div>
    </>
  )
}
