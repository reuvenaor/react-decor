import { Link } from '@shared/lib/router-link'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@shared/components/site/brand-mark'
import { SectionShell } from '@shared/components/site/section-shell'
import { BRAND } from '@shared/lib/brand'
import { fadeUpInView } from '@shared/lib/motion'

/**
 * Footer for the react-decor documentation site.
 *
 * Rendered on a prerendered, ssr:false SPA route, so there is NO DOM during render —
 * all browser work lives in motion's post-mount `whileInView`. Styling uses theme
 * token utilities only. Internal links use react-router <Link> (view-transition-
 * aware); hash targets render literal lowercase <a> anchors, which can never be
 * directives. All visible copy flows through i18n.
 *
 * The contentinfo band + centered container come from the SectionShell decorator
 * (as: footer); the inner motion.div keeps its own fadeUpInView spread — it is NOT
 * <Reveal> (different offset, viewport margin, and ease), so it stays literal.
 *
 * The brand link is a decorated atom (FooterBrand @Link decl); nav links ride a
 * return-position @Link inside FooterNavLink. The column <nav> elements are
 * lowercase leaves, so the map keys them directly — no tile needed.
 */

const FOOTER_LINK = 'text-muted-foreground transition-colors hover:text-foreground'

interface FooterLink {
  key: string
  to: string
}
interface FooterColumn {
  key: string
  links: FooterLink[]
}

// Columns wired to the docs surface. Labels come from i18n (footer.col.*.heading,
// footer.link.*). Hash entries render as literal <a> anchors.
const linkColumns: FooterColumn[] = [
  {
    key: 'docs',
    links: [
      { key: 'overview', to: '/docs' },
      { key: 'keyed_tile', to: '/docs#keyed-tile' },
      { key: 'toolchain', to: '/docs#toolchain' },
      { key: 'errors', to: '/docs#errors' },
    ],
  },
  {
    key: 'project',
    links: [
      { key: 'home', to: '/' },
      { key: 'quickstart', to: '/#quick-start' },
      { key: 'accessibility', to: '/accessibility' },
    ],
  },
]

@Link({ to: '/', viewTransition: true, className: 'inline-flex items-center gap-2' })
const FooterBrand = () => (
  <>
    <BrandMark />
    <span className="text-base font-semibold tracking-tight">{BRAND}</span>
  </>
)

const FooterNavLink = ({ link }: { link: FooterLink }) => {
  const { t } = useTranslation()
  if (link.to.includes('#')) {
    return (
      <a href={link.to} className={`text-sm ${FOOTER_LINK}`}>
        {t(`footer.link.${link.key}`)}
      </a>
    )
  }
  @(<Link to={link.to} viewTransition className={`text-sm ${FOOTER_LINK}`} />)
  return <>{t(`footer.link.${link.key}`)}</>
}

@SectionShell({
  as: 'footer',
  id: 'footer',
  className: 'border-border bg-card/40 border-t',
  innerClassName: 'py-12 md:py-14',
})
export function SiteFooter() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  const reveal = fadeUpInView(reduceMotion)

  return (
    <motion.div {...reveal}>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand + tagline */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <FooterBrand />
          <p className="text-muted-foreground max-w-xs text-sm">{t('footer.tagline')}</p>
        </div>

        {/* Link columns */}
        {linkColumns.map((column) => (
          <nav
            key={column.key}
            aria-label={t(`footer.col.${column.key}.heading`)}
            className="flex flex-col gap-3"
          >
            <h3 className="text-sm font-semibold">{t(`footer.col.${column.key}.heading`)}</h3>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.key}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-border mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-muted-foreground text-sm">{t('footer.copyright')}</p>
        <p className="text-muted-foreground text-sm">{t('footer.note')}</p>
      </div>
    </motion.div>
  )
}
