import { useTranslation } from 'react-i18next'
import { CodeBlock } from '@shared/components/docs/code-block'
import { DemoPanel } from '@shared/components/docs/demo-panel'
import { DocTopic } from '@shared/components/docs/doc-topic'
import { DemoInTreeWrap } from '@shared/components/docs/demo-widgets.at'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { SectionHeading } from '@shared/components/site/section-heading.at'
import {
  SNIPPET_PLACE_DECL,
  SNIPPET_PLACE_LOCAL,
  SNIPPET_PLACE_RETURN,
  SNIPPET_PLACE_TREE,
} from '@shared/content/docs-snippets'
import type { ComponentType } from 'react'

// The four placements, in grammar order. Only the in-tree one carries a live mirror
// (wrapping exactly one sibling is best seen, not read).
const PLACEMENTS: { key: string; snippet: string; Demo?: ComponentType }[] = [
  { key: 'decl', snippet: SNIPPET_PLACE_DECL },
  { key: 'local', snippet: SNIPPET_PLACE_LOCAL },
  { key: 'return', snippet: SNIPPET_PLACE_RETURN },
  { key: 'tree', snippet: SNIPPET_PLACE_TREE, Demo: DemoInTreeWrap },
]

@StaggerItem({ className: 'flex min-w-0 flex-col gap-3' })
const PlacementPane = ({
  placement,
  index,
}: {
  placement: (typeof PLACEMENTS)[number]
  index: number
}) => {
  const { t } = useTranslation()
  const Demo = placement.Demo
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
        >
          {index + 1}
        </span>
        <h3 className="text-lg font-semibold tracking-tight">
          {t(`docs.placements.items.${placement.key}.title`)}
        </h3>
      </div>
      <p className="text-muted-foreground max-w-3xl text-sm">
        {t(`docs.placements.items.${placement.key}.body`)}
      </p>
      {Demo ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <CodeBlock code={placement.snippet} />
          <DemoPanel>
            <Demo />
          </DemoPanel>
        </div>
      ) : (
        <CodeBlock code={placement.snippet} />
      )}
    </>
  )
}

@Stagger({ className: 'flex flex-col gap-10' })
const PlacementsSectionBody = () =>
  PLACEMENTS.map((placement, index) => (
    <PlacementPane key={placement.key} placement={placement} index={index} />
  ))

@DocTopic({ id: 'placements', 'data-section': 'placements' })
export function PlacementsSection() {
  const { t } = useTranslation()
  return (
    <>
      <SectionHeading title={t('docs.placements.title')} intro={t('docs.placements.intro')} />
      <PlacementsSectionBody />
    </>
  )
}
