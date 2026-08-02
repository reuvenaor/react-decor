'use client'

/**
 * Route error boundary — mirrors the react-router app's ErrorBoundary. English
 * fallbacks on purpose: this can render before i18n is ready (or when the
 * failure IS i18n), so the copy is deliberately not routed through t(). A
 * <div>, not a <main>: it renders INSIDE SiteShell's <main id="main"> (the
 * react-router boundary replaces the whole shell instead).
 */
export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
  const title = 'Application error'
  const message = error.message || 'An unexpected error occurred.'
  return (
    <div
      role="alert"
      className="bg-background text-foreground flex min-h-screen items-center justify-center p-8"
    >
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
