import en from './en/translation.json'

/**
 * Bundled translations — a plain JSON import both bundlers handle natively (this
 * replaced the Vite-only `virtual:locales` module). The locale FILES stay the
 * single source of truth; add a language by dropping `<lng>/translation.json`
 * beside `en/` and listing it here — `SUPPORTED_LANGUAGES` in lib/i18n.ts derives
 * from this map, so the switcher and `supportedLngs` follow automatically.
 */
const locales: Record<string, Record<string, unknown>> = { en }

export default locales
