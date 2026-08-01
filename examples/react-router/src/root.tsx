import {
  Link as RouterLink,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router'
import { useTranslation } from 'react-i18next'
import './index.css'
import { Providers } from '@shared/lib/providers'
import { RouterLinkProvider } from '@shared/lib/router-link'
import { isRtl } from '@shared/lib/i18n'
import { BRAND } from '@shared/lib/brand'
import type { ReactNode } from 'react'
import type { Route } from './+types/root'

export function links(): Route.LinkDescriptors {
  return [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
}

/**
 * Default document <title>, rendered into the SPA shell <head> at first paint.
 * In `ssr: false` mode only the root route is matched server-side, so a child
 * route's title is applied client-side after hydration — leaving a title-less
 * window an axe `document-title` (WCAG 2.1 AA) scan fails on. This root-level
 * default guarantees a non-empty title from the first byte; every leaf route's
 * own `meta` still overrides it (the leaf title wins).
 */
export function meta(): Route.MetaDescriptors {
  return [{ title: BRAND }]
}

export function Layout({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  const dir = isRtl(lang) ? 'rtl' : 'ltr'
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          {/* react-router's Link is passed verbatim — RouterLinkProps is a strict
              subset of its LinkProps (to/viewTransition/preventScrollReset). */}
          <RouterLinkProvider link={RouterLink}>{children}</RouterLinkProvider>
        </Providers>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { t } = useTranslation()
  return (
    <>
      <a href="#main" className="skip-link">
        {t('a11y.skip_to_content')}
      </a>
      <Outlet />
    </>
  )
}

export function HydrateFallback() {
  const { t } = useTranslation()
  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">{t('loading')}</p>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // English fallbacks: the ErrorBoundary can render before i18n is ready (or when the
  // failure IS i18n), so these are deliberately not routed through t().
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Application error'
  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : JSON.stringify(error.data)
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'
  return (
    <main
      role="alert"
      className="bg-background text-foreground flex min-h-screen items-center justify-center p-8"
    >
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </main>
  )
}
