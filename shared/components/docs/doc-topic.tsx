import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type DocTopicProps = ComponentProps<'section'> & Partial<Record<`data-${string}`, string>>

/**
 * One anchored topic on the /docs reference page: a bordered rhythm band with the
 * scroll margin for the sticky header. A react-decor composer — each topic section
 * decl-decorates itself with `@DocTopic({ id: '…', 'data-section': '…' })`, and the
 * TOC + header/footer hash links target the id.
 */
export function DocTopic({ className, children, ...rest }: DocTopicProps) {
  return (
    <section
      className={cn(
        'border-border flex scroll-mt-24 flex-col gap-8 border-b py-14 first:pt-0 last:border-b-0 last:pb-0',
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  )
}
