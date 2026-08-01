import { ThemeProvider } from 'next-themes'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  )
}
