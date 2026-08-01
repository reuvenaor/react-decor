/**
 * Demo wrappers + the live sample-mirror atoms used across /docs.
 *
 * TintCard and Labeled are ordinary childless composers (a decorator target becomes
 * their children). The Demo* atoms are the EXACT code shown in the samples beside
 * them (src/content/docs-snippets.ts) — keep both sides in lockstep. Their visible
 * strings are verbatim sample text, not UI copy, so they render as expressions
 * (outside the i18n surface on purpose, like any quoted code).
 */
import { $at } from 'react-decor'
import type { ReactElement, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function TintCard({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('border-border bg-primary/5 w-full rounded-lg border p-4 text-sm', className)}>
      {children}
    </div>
  )
}

export function Labeled({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <label className="flex w-full max-w-sm flex-col gap-2 text-sm font-medium">
      {text}
      {children}
    </label>
  )
}

// ── the three syntax-form mirrors ────────────────────────────────────────────

@TintCard
export const DemoBareNote = () => <p>{'Wrapped in a card.'}</p>

@Labeled({ text: 'Email address' })
export const DemoEmailField = () => <Input type="email" name="email" placeholder="you@example.com" />

@(<Badge variant="secondary" />)
export const DemoVersionBadge = () => <>{'v0.1.0'}</>

// ── the target-slot ($at) mirrors ────────────────────────────────────────────

/** A wrapper whose content rides NAMED element props — the target-slot surface. */
export function SlotPane({
  header,
  body,
  children,
}: {
  header?: ReactElement
  body?: ReactElement
  children?: ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-2 text-sm">
      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {header}
      </div>
      <div className="border-border bg-card w-full rounded-lg border p-3">{body ?? children}</div>
    </div>
  )
}

@SlotPane({ header: <em>{'From a decorator arg.'}</em> })
export const DemoElementArg = () => <p>{'The body is still children.'}</p>

@SlotPane({ header: <em>{'A named slot.'}</em>, body: $at })
export const DemoTargetSlot = () => <p>{'Spliced into body={…}.'}</p>

// ── the in-tree placement mirror ─────────────────────────────────────────────

export function DemoInTreeWrap() {
  return (
    <section data-demo="in-tree" className="flex w-full flex-col gap-2 text-sm">
      @(<TintCard />)
      <p>{'Only this sibling is wrapped.'}</p>
      <p className="text-muted-foreground">{'This one is not.'}</p>
    </section>
  )
}
