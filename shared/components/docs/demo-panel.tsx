import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Live-result container pairing with a CodeBlock: a dashed surface holding the
 * ACTUAL rendered output of the sample beside it, flagged by the "live" chip. A
 * multi-child content wrapper, so callsites compose it literally (never as a
 * directive — in-tree directives wrap exactly one element).
 */
export function DemoPanel({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      data-demo-panel=""
      className={cn(
        'border-border bg-background relative flex min-w-0 flex-col items-start gap-4 rounded-xl border border-dashed p-5 pt-9',
        className,
      )}
    >
      <span className="text-muted-foreground absolute start-4 top-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
        <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
        {t('docs.demo.live')}
      </span>
      {children}
    </div>
  )
}
