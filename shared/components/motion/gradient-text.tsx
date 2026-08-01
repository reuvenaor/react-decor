import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Token-gradient text (primary emerald → chart-2 blue) with a slow animated shine.
 * The shine is disabled under reduced motion (see the `.gradient-text-animated` rule
 * in index.css). Use sparingly — one focal accent. Both stops hold ≥3:1 contrast on
 * the page background in both themes (this palette's `accent` is a near-neutral
 * surface tone, unusable as a text stop).
 */
export function GradientText({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'gradient-text-animated from-primary to-chart-2 bg-gradient-to-r bg-clip-text text-transparent',
        className,
      )}
      {...props}
    />
  )
}
