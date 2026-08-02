/**
 * 404 — mirrors the react-router ErrorBoundary's route-error branch
 * (`${status} ${statusText}`). English on purpose, like error.tsx. A <div>, not
 * a <main>: this renders as layout children INSIDE SiteShell's <main id="main">
 * (unlike the react-router boundary, which replaces the whole shell and owns
 * the page's single main landmark).
 */
export default function NotFound() {
  const title = '404 Not Found'
  const message = 'The page you are looking for does not exist.'
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
