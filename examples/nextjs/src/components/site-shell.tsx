'use client'

import { useTranslation } from 'react-i18next'
import { SiteFooter } from '@shared/components/site/site-footer.at'
import { SiteHeader } from '@shared/components/site/site-header.at'
import type { ReactNode } from 'react'

/**
 * The persistent chrome — the analog of the react-router app's root `App`
 * (skip-link) + `_app.tsx` pathless layout (header / main / footer). The layout
 * keeps it mounted across navigations; every page renders into the single
 * `<main id="main">` (the skip-link target).
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <>
      <a href="#main" className="skip-link">
        {t('a11y.skip_to_content')}
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
