import path from 'node:path'
import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
// BARE specifier by design: Vite's config loader externalizes bare ids to a native
// Node import, and react-decor's whole chain is plain CommonJS every Node runs with no
// build step. A relative import would get BUNDLED into the config, which breaks: the
// bundle rewrites require('typescript') to a file:// URL require() can't load.
import reactDecor from 'react-decor/vite'

// Dev-only convenience: proxy a relative `/api/*` to a local backend and strip the
// `/api` prefix (backend routes live at the root). Inert here — the docs site makes
// no API calls — but it costs nothing and lets a local API experiment stay
// single-origin. VITE_BACKEND_PORT overrides the target; 3939 is the fallback.
const backendPort = process.env.VITE_BACKEND_PORT ?? '3939'

export default defineConfig({
  // Build-time base path override for hosting the built site under a sub-path;
  // defaults to '/' (the Cloudflare Worker serves from the root).
  base: process.env.VITE_BASE_PATH ?? '/',
  // reactDecor() is enforce:'pre' (TSX→TSX before react-router's transforms); it only
  // touches *.at.tsx files — including the shared/ sections outside this app dir —
  // so every other module keeps a byte-identical pipeline.
  plugins: [reactDecor(), reactRouter(), tailwindcss()],
  // Vite's cold-start esbuild dep scanner can't traverse this app's real module graph — the
  // React Router virtual route entry + the *.at.tsx sections (the `@` decorator syntax the raw
  // scanner can't parse) — so it under-optimizes on a cold start and re-optimizes + full-reloads
  // on the first page load (a transient dev-only 504 "Outdated Optimize Dep" that briefly blanks
  // the page). Pre-declaring the runtime deps makes the optimizer bundle them up front. The
  // @radix-ui/* + cva deps are reachable ONLY through .at.tsx → @/components/ui/*, so the scanner
  // never sees them. Dev-only (the prerender build uses Rollup, not this optimizer). Add a dep
  // here if it's imported only through a .at.tsx file.
  optimizeDeps: {
    include: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'i18next',
      'i18next-browser-languagedetector',
      'lucide-react',
      'motion/react',
      'next-themes',
      // the $at sentinel import in demo-widgets.at.tsx — the transform replaces
      // its USES but never removes the import statement, so the bare specifier
      // ships in dev and only .at.tsx files (scanner-invisible) reach it
      'react-decor',
      'react-i18next',
      'tailwind-merge',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // The cross-app shared source dir (sections/content/lib/styles/locales) —
      // keep in sync with tsconfig.app.json "paths".
      '@shared': path.resolve(import.meta.dirname, '../../shared'),
    },
  },
  // No `server.port` / `strictPort`: `npm run dev` uses Vite's default port
  // search, and the Playwright webServer passes an explicit `--port`.
  server: {
    // VITE_FS_ALLOW (colon-separated roots) relaxes Vite's strict fs.allow for
    // setups that serve through symlinked node_modules; unset — the normal case —
    // Vite's default fs.allow applies (the npm-workspaces root, which already
    // covers shared/), no relaxation.
    ...(process.env.VITE_FS_ALLOW
      ? { fs: { allow: process.env.VITE_FS_ALLOW.split(':').filter(Boolean) } }
      : {}),
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
