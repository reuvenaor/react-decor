import { Reveal } from '@shared/components/motion/reveal'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  /** Already-translated strings (the caller resolves them via t()). */
  eyebrow?: string
  title: string
  intro?: string
  align?: 'start' | 'center'
  className?: string
}

/**
 * Shared eyebrow + h2 + intro block used at the top of most landing sections. Purely
 * presentational — callers pass translated strings. The Reveal motion is baked into
 * the declaration (every landing usage paired the two), so callsites never add their
 * own @(<Reveal />) above this component.
 */
@Reveal
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'start',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <p className="text-primary text-sm font-medium">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
      {intro ? <p className="text-muted-foreground max-w-2xl text-lg">{intro}</p> : null}
    </div>
  )
}
