import { motion, useReducedMotion } from 'motion/react'
import { fadeUpItem, staggerContainer } from '@shared/lib/motion'
import type { HTMLMotionProps } from 'motion/react'

type StaggerProps = HTMLMotionProps<'div'> & {
  /**
   * Play immediately on mount (`animate`) instead of when scrolled into view
   * (`whileInView`). For above-the-fold sections such as the hero, where the
   * stagger should run on load. Default keeps the scroll-triggered behaviour.
   */
  immediate?: boolean
}

/**
 * Parent that staggers the reveal of its {@link StaggerItem} children as it enters
 * view (once). Under reduced motion the stagger + offset collapse to a plain fade.
 * Pass `immediate` to run the stagger on mount instead (above-the-fold sections).
 */
export function Stagger({ immediate = false, ...props }: StaggerProps) {
  const reduce = useReducedMotion()
  const activate = immediate
    ? { animate: 'show' as const }
    : { whileInView: 'show' as const, viewport: { once: true, amount: 0.2 } }
  return (
    <motion.div variants={staggerContainer(reduce)} initial="hidden" {...activate} {...props} />
  )
}

/** Child of {@link Stagger}: fades up into place, inheriting the parent's timing. */
export function StaggerItem(props: HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion()
  return <motion.div variants={fadeUpItem(reduce)} {...props} />
}
