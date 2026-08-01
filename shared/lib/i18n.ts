import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import locales from '@shared/locales'

// The shipped languages ARE the keys of the shared locales map (a plain JSON
// import both bundlers understand — see shared/locales/index.ts): a single source
// of truth shared by the switcher, `supportedLngs`, and the bundled `resources`
// below. Add a locale file + list it there and everything follows — no hardcoded
// list to drift out of sync. RTL-ness can't be inferred from a language code, so
// it stays an explicit set.
export const SUPPORTED_LANGUAGES = Object.keys(locales)
export type SupportedLanguage = string
const RTL_LANGUAGES: ReadonlySet<string> = new Set(['he', 'ar'])

// Translations are BUNDLED (not fetched at runtime) so t() resolves synchronously
// during build-time prerendering — the react-router ssr:false prerender AND the
// Next.js static export alike. With an http-backend the bundles load asynchronously
// on the client, so prerendered HTML would carry raw keys ("home.hero.headline") —
// bad for SEO and a flash before hydration. Bundling fixes that, makes language
// switching instant (no network), and is tiny here (one namespace × one locale).
// The JSON under shared/locales/ stays the single source of truth.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(locales).map(([lng, translation]) => [lng, { translation }] as const),
    ),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  })

export function isRtl(lng: string | undefined): boolean {
  return !!lng && RTL_LANGUAGES.has(lng)
}

export default i18n
