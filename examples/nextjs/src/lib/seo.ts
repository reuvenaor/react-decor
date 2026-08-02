import en from '@shared/locales/en/translation.json'
import type { Metadata } from 'next'

/**
 * Build a localized page `Metadata` for a route's `export const metadata` — the
 * Next analog of the react-router app's `metaFor()`. Imports the en bundle
 * DIRECTLY (flat dotted keys, one index): this file sits on the server graph,
 * where importing the shared i18n module would drag react-i18next
 * (createContext) into a react-server context. The site ships English only,
 * matching the static `<html lang="en">` in layout.tsx.
 *
 * Keys are typed against the bundle — a typo is an at-tsc error instead of a
 * silent `title: undefined`, which OVERRIDES the layout default during Next's
 * metadata resolution and ships the page with no `<title>` element at all.
 */
export type TranslationKey = keyof typeof en

export function pageMetadata(titleKey: TranslationKey, descKey?: TranslationKey): Metadata {
  const metadata: Metadata = { title: en[titleKey] }
  if (descKey) metadata.description = en[descKey]
  return metadata
}
