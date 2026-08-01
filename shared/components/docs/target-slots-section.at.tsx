import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DemoPanel } from '@shared/components/docs/demo-panel'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { DemoElementArg, DemoTargetSlot } from '@shared/components/docs/demo-widgets.at'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import {
  SNIPPET_SLOTS_AT,
  SNIPPET_SLOTS_COMPOSE,
  SNIPPET_SLOTS_ELEMENT,
} from '@shared/content/docs-snippets'
import type { ComponentType } from 'react'

// Element-valued args, the $at slot, and its composition rules — the first two
// items pair a sample with its LIVE mirror atom from demo-widgets.at.tsx.
const SLOTS: { key: string; snippet: string; Demo?: ComponentType }[] = [
  { key: 'element', snippet: SNIPPET_SLOTS_ELEMENT, Demo: DemoElementArg },
  { key: 'at', snippet: SNIPPET_SLOTS_AT, Demo: DemoTargetSlot },
  { key: 'compose', snippet: SNIPPET_SLOTS_COMPOSE },
]

@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const SlotUsagePane = ({ item }: { item: (typeof SLOTS)[number] }) => {
  const { t } = useTranslation()
  const Demo = item.Demo
  return (
    <>
      <h3 className="text-lg font-semibold tracking-tight">
        {t(`docs.targetslots.items.${item.key}.title`)}
      </h3>
      <p className="text-muted-foreground max-w-3xl text-sm">
        {t(`docs.targetslots.items.${item.key}.body`)}
      </p>
      {Demo ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <CodeBlock filename="demo-widgets.at.tsx" code={item.snippet} />
          <DemoPanel>
            <Demo />
          </DemoPanel>
        </div>
      ) : (
        <CodeBlock code={item.snippet} className="max-w-3xl" />
      )}
    </>
  )
}

@Stagger({ className: 'flex flex-col gap-10' })
const TargetSlotsSectionBody = () =>
  SLOTS.map((item) => <SlotUsagePane key={item.key} item={item} />)

@DocTopic({ id: 'target-slots', 'data-section': 'target-slots' })
export function TargetSlotsSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.targetslots.title')} intro={t('docs.targetslots.intro')} />
      <TargetSlotsSectionBody />
    </>
  )
}
