import type { Variants } from 'motion/react'

// Shared fade-up motion language for the landing sections. Each helper takes the
// component's `useReducedMotion()` result and collapses to an INSTANT (zero-duration)
// state change when motion is reduced, so the reduced-motion gating lives in exactly
// one place instead of being re-implemented per section. The initial/hidden styles
// must stay identical with and without reduce: the prerendered HTML carries them
// (the server renders un-reduced), and a reduce-gated client that renders different
// props would leave the server's opacity-0 inline style unmatched — React 19 keeps
// mismatched attributes, permanently hiding the content for reduced-motion visitors.

const EASE_OUT = 'easeOut' as const

/** Cubic-bezier ease-out-expo for scroll reveals (the research-recommended curve). */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Parent variant: stagger the fade-up of its children (e.g. the hero copy column). */
export function staggerContainer(reduce: boolean | null): Variants {
  return {
    hidden: {},
    show: {
      transition: reduce ? {} : { staggerChildren: 0.12, delayChildren: 0.08 },
    },
  }
}

/** Child variant used under {@link staggerContainer}: fade up into place. */
export function fadeUpItem(reduce: boolean | null): Variants {
  return {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.55, ease: EASE_OUT },
    },
  }
}

/**
 * One-shot reveal as the element scrolls into view. Spread onto a motion element:
 * `<motion.div {...fadeUpInView(reduce)} />`. Instant (zero-duration) under reduce.
 */
export function fadeUpInView(reduce: boolean | null) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: reduce ? 0 : 0.5, ease: EASE_OUT },
  }
}
