import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export — the parity analog of the react-router app's ssr:false +
  // prerender: every route ships as real HTML in out/.
  output: 'export',

  // Raw *.at.tsx is invalid TypeScript by design (react-decor's `@` directives are
  // compiled away before any type-eraser parses them), so Next's build-time tsc
  // can never read those files. The repo's `at-tsc` (npm run typecheck) is the
  // type gate — the same model as the Vite app, whose build never type-checks.
  typescript: { ignoreBuildErrors: true },

  turbopack: {
    // shared/ (the cross-app sections) lives outside this app dir; files outside
    // the inferred project root would not be resolved.
    root: path.join(import.meta.dirname, '../..'),
    // react-decor must run BEFORE SWC parses the file — the Turbopack analog of the
    // Vite plugin's `enforce: 'pre'`. `as: '*.tsx'` re-enters the transformed
    // output into the normal TSX pipeline. Globs match by file name graph-wide,
    // so the rule also covers shared/**/*.at.tsx.
    rules: { '*.at.tsx': { loaders: ['react-decor/webpack'], as: '*.tsx' } },
  },

  // Belt-and-braces for `next dev/build --webpack`: the same loader as a
  // pre-loader, so the webpack path compiles *.at.tsx too. externalDir is the
  // webpack-path analog of turbopack.root above — without it, SWC's include is
  // scoped to this app dir and the @shared/* modules outside it are resolved
  // (tsconfig paths) but never transpiled, so `next build --webpack` dies on
  // plain TSX. Turbopack ignores the flag.
  experimental: { externalDir: true },
  webpack: (config: { module: { rules: unknown[] } }) => {
    config.module.rules.push({ test: /\.at\.tsx$/, enforce: 'pre', use: 'react-decor/webpack' })
    return config
  },
}

export default nextConfig
