'use client'

import { Providers as SharedProviders } from '@shared/lib/providers'
import { RouterLinkProvider } from '@shared/lib/router-link'
import { NextRouterLink } from './router-link'
import type { ReactNode } from 'react'

/**
 * The app's client boundary: everything under here (the shared sections, the
 * shadcn primitives, next-themes, i18next) runs as client components — the
 * shared package stays directive-free, mirroring how the react-router app is a
 * client SPA. Server files above (layout/pages) keep the Metadata API.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SharedProviders>
      <RouterLinkProvider link={NextRouterLink}>{children}</RouterLinkProvider>
    </SharedProviders>
  )
}
