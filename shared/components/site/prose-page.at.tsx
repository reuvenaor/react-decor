import { SectionShell } from '@shared/components/site/section-shell'
import type { ReactNode } from 'react'

/**
 * Narrow prose shell for the legal pages (/accessibility, /cookies): the canonical
 * container narrowed to reading width with page-level padding, rendered as a div —
 * the routes bring their own heading/landmark structure as children.
 */
@SectionShell({
  as: 'div',
  bare: true,
  'data-section': 'prose-page',
  className: 'flex max-w-3xl flex-col gap-8 pt-8 pb-20 md:pt-8 md:pb-28',
})
export function ProsePage({ children }: { children: ReactNode }) {
  return children
}
