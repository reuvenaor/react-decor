import i18n from '@shared/lib/i18n'
import type en from '@shared/locales/en/translation.json'

// A react-router MetaDescriptor is either a document <title> or a <meta name/content>
// pair. Typed structurally so this helper doesn't depend on the router's type export.
type Descriptor = { title: string } | { name: string; content: string }

/**
 * Locale keys typed against the en bundle (a type-only import — nothing added
 * to the client graph) — a typo is an at-tsc error instead of a page whose
 * <title> is the raw key string.
 */
export type TranslationKey = keyof typeof en

/**
 * Build a localized `<title>` (+ optional description) for a route's `meta()`.
 * Resolves the language from the `<html lang>` the shell already set — falling back
 * to 'en' during the SSR-less prerender — so titles are correct in the static HTML
 * and update on client navigation.
 */
export function metaFor(titleKey: TranslationKey, descKey?: TranslationKey): Descriptor[] {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en'
  const out: Descriptor[] = [{ title: i18n.t(titleKey, { lng: lang }) }]
  if (descKey) out.push({ name: 'description', content: i18n.t(descKey, { lng: lang }) })
  return out
}
