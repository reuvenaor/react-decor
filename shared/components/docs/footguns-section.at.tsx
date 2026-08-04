import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import { FOOTGUNS } from '@shared/content/footguns'

// Each footgun tile IS a StaggerItem — wrapper on the declaration, key on the map's
// callsite. The rule chip is a verbatim identifier, rendered mono.
@StaggerItem({
  className: 'border-border bg-card/60 flex h-full min-w-0 flex-col gap-3 rounded-xl border p-5',
})
const FootgunTile = ({ item }: { item: (typeof FOOTGUNS)[number] }) => {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight">
          {t(`docs.footguns.items.${item.key}.title`)}
        </h3>
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px] flex-1">
          {item.rule}
        </code>
      </div>
      <p className="text-muted-foreground text-sm">{t(`docs.footguns.items.${item.key}.body`)}</p>
      <CodeBlock className="mt-auto lg:h-68" code={item.snippet} />
    </>
  )
}

@Stagger({ className: 'grid gap-5 lg:grid-cols-2' })
const FootgunsSectionBody = () => FOOTGUNS.map((item) => <FootgunTile key={item.key} item={item} />)

@DocTopic({ id: 'footguns', 'data-section': 'footguns' })
export function FootgunsSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.footguns.title')} intro={t('docs.footguns.intro')} />
      <FootgunsSectionBody />
    </>
  )
}
