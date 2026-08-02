import { BRAND } from '@shared/lib/brand'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import { SiteShell } from '@/components/site-shell'
import './globals.css'

/**
 * Server root — the analog of the react-router app's root.tsx Layout. `metadata`
 * sets the default document title (each page overrides via its own metadata);
 * lang/dir are static because the site ships English only (the react-router app
 * derives them from i18n, which always resolves 'en' for the same reason).
 * suppressHydrationWarning is for next-themes' class swap on <html>.
 */
export const metadata: Metadata = { title: BRAND }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
