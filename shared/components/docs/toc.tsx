import { Link } from '@shared/lib/router-link'
import { useTranslation } from 'react-i18next'
import { DOC_SECTIONS } from '@shared/content/docs-sections'

/**
 * Sticky in-page TOC for /docs (desktop only). Same-page hash anchors are literal
 * lowercase <a> elements — the browser owns the scroll; DocTopic's scroll-mt keeps
 * targets clear of the sticky header.
 */
export function TocAside() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('docs.toc.heading')}
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] flex-col gap-1 self-start overflow-y-auto lg:flex"
    >
      <p className="text-muted-foreground px-2 pb-2 text-xs font-medium tracking-wide uppercase">
        {t('docs.toc.heading')}
      </p>
      {DOC_SECTIONS.map((id) => (
        <Link
          key={id}
          to={`#${id}`}
          preventScrollReset
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md px-2 py-1 text-sm transition-colors"
        >
          {t(`docs.toc.${id}`)}
        </Link>
      ))}
    </nav>
  )
}
