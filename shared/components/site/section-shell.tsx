import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** The canonical landing-section container (shared by every long-scroll section). */
const CONTAINER = 'mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8'

type SectionShellProps = ComponentProps<'section'> & {
  /** Merged over the canonical container classes (tailwind-merge resolves conflicts). */
  innerClassName?: string
  /** Single-element variant: the `<section>` itself carries the container classes. */
  bare?: boolean
  /**
   * Semantic element for the band — footer/aside for landmark shells, div for
   * non-landmark wrappers (all four share the section attribute set).
   */
  as?: 'section' | 'footer' | 'aside' | 'div'
  // Explicit data-* passthrough: react-decor call-form decorators type-check props as a
  // plain object literal, which (unlike TSX attributes) gets excess-property checks —
  // hyphenated test hooks like data-section must be declared to pass through.
} & Partial<Record<`data-${string}`, string>>

/**
 * Landing-section chrome: a `<section>` band wrapping the canonical centered
 * container. Built as a react-decor composer (childless wrapper — the decorated target
 * becomes its children) but it is an ordinary component and composes normally too.
 * Carries no copy: translated strings always arrive from callers as children.
 */
export function SectionShell({
  className,
  innerClassName,
  bare,
  as,
  children,
  ...rest
}: SectionShellProps) {
  // All four tags share the section attribute set; only 'div' narrows the JSX ref
  // slot to HTMLDivElement, so a union tag trips RefObject invariance. The cast keeps
  // the polymorphic tag on the shared ComponentProps<'section'> contract.
  const Tag = (as ?? 'section') as 'section'
  if (bare) {
    return (
      <Tag className={cn(CONTAINER, className)} {...rest}>
        {children}
      </Tag>
    )
  }
  return (
    <Tag className={className} {...rest}>
      <div className={cn(CONTAINER, innerClassName)}>{children}</div>
    </Tag>
  )
}
