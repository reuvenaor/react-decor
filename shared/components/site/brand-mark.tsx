import { cn } from '@/lib/utils'

/**
 * The square brand tile holding the logo mark — shared by the header and footer so
 * both stay in visual lockstep (one asset, `/logo.svg`, served from each app's own
 * public/ dir). Purely decorative, so it's `aria-hidden`; the adjacent brand
 * wordmark carries the accessible name.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-7 overflow-hidden rounded-lg shadow-sm', className)}
    >
      <img src="/logo.svg" alt="" className="size-full" decoding="async" />
    </span>
  )
}
