import { AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The square brand tile holding the logo glyph — shared by the header and footer so
 * both stay in visual lockstep (one glyph, one set of tokens). Purely decorative, so
 * it's `aria-hidden`; the adjacent brand wordmark carries the accessible name.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-sm',
        className,
      )}
    >
      <AtSign className="size-4" />
    </span>
  )
}
