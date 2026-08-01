import type { Config } from '@react-router/dev/config'

// Static routes prerendered to HTML at build. Any other path falls back to the
// Worker's SPA not_found_handling (see wrangler.toml), not a public/_redirects file.
const STATIC_PATHS = ['/', '/docs', '/accessibility']

export default {
  appDirectory: 'src',
  ssr: false,
  prerender: STATIC_PATHS,
} satisfies Config
