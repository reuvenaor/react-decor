import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { highlightTsx } from '@shared/lib/highlight'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  /** The sample source (from src/content/snippets.ts) — verbatim, never translated. */
  code: string
  /** Optional filename chip — a code identifier, rendered as an expression. */
  filename?: string
  className?: string
}

const PRE_CLASS = 'min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed'

function CopyButton({ code }: { code: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  function onCopy() {
    void navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard unavailable (permissions / insecure context) — the sample text
        // itself is still selectable, so silently doing nothing is fine.
      })
  }

  const Icon = copied ? Check : Copy
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground size-7"
      aria-label={copied ? t('code.copied') : t('code.copy')}
      onClick={onCopy}
    >
      <Icon aria-hidden="true" className="size-3.5" />
    </Button>
  )
}

/**
 * Syntax-highlighted code sample. The `dark` class on the figure forces the dark
 * token values inside regardless of the page theme (custom properties re-resolve on
 * the subtree), so code reads as a classic dark surface in light mode and blends in
 * dark mode — with zero palette literals.
 *
 * The figure is a flex column and the pre flexes + scrolls, so callers may size it
 * (`h-*` via className, or stretched in a flex/grid cell): the header chrome keeps
 * its height, extra space fills as dark surface, overflow scrolls instead of
 * clipping. Unconstrained, it sizes to its content exactly as before.
 */
export function CodeBlock({ code, filename, className }: CodeBlockProps) {
  const { t } = useTranslation()
  const label = filename ?? t('code.sample_aria')
  return (
    <figure
      className={cn(
        'dark border-border bg-card flex min-w-0 flex-col overflow-hidden rounded-xl border text-start shadow-sm',
        className,
      )}
    >
      <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-1.5">
        <figcaption className="text-muted-foreground font-mono text-xs">{filename}</figcaption>
        <CopyButton code={code} />
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- axe scrollable-region-focusable: keyboard users must be able to focus and scroll the code overflow */}
      <pre role="region" aria-label={label} tabIndex={0} className={PRE_CLASS}>
        <code className="text-foreground">{highlightTsx(code)}</code>
      </pre>
    </figure>
  )
}
