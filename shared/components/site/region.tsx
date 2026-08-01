import type { ComponentProps } from 'react'

type RegionProps = ComponentProps<'div'> &
  Partial<Record<`data-${string}`, string>> & {
    /** Accessible name for the landmark — already translated (callers pass t(...)). */
    label: string
  }

/**
 * Named `role="region"` landmark — an a11y composer (IS 5568 / WCAG friendly): screen
 * readers can jump to the labeled region. Renders no visual chrome at all. As a
 * react-decor decorator it shines in INNER placements (above `return` / inside the tree),
 * where the directive props can use the component's own scope — e.g.
 * `@(<Region label={t('…')} />)` — which top-level decorators cannot.
 */
export function Region({ label, children, ...rest }: RegionProps) {
  return (
    <div role="region" aria-label={label} {...rest}>
      {children}
    </div>
  )
}
