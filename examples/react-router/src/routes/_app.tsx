import { Outlet } from 'react-router'
import { SiteHeader } from '@shared/components/site/site-header.at'
import { SiteFooter } from '@shared/components/site/site-footer.at'

/**
 * Pathless layout for the whole site. The header (banner) and footer (contentinfo)
 * stay mounted across client navigations — so route changes don't re-animate the
 * chrome and View Transitions stay clean — and every page renders into the single
 * `<main id="main">` (the skip-link target set in root.tsx). Child routes provide
 * only their own sections.
 */
export default function AppLayout() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
