import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT_EXPO } from '@shared/lib/motion'
import type { HTMLMotionProps } from 'motion/react'

type RevealProps = HTMLMotionProps<'div'> & {
  /** Extra delay (seconds) before the reveal starts. */
  delay?: number
}

/**
 * One-shot fade + slide-up as the element scrolls into view (plays once). Under
 * reduced motion the SAME initial/whileInView pipeline runs with a zero-duration
 * transition — an instant appearance, no motion. Rendering identical props on both
 * sides keeps the client in sync with the prerendered markup: a reduce-gated bare
 * motion.div would leave the server's inline opacity-0 style unmatched (React 19
 * keeps mismatched attributes), permanently hiding the content for reduced-motion
 * visitors. Keeping the gate here means callers never re-implement reduced-motion.
 */
export function Reveal({ delay = 0, ...props }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, delay, ease: EASE_OUT_EXPO }}
      {...props}
    />
  )
}
