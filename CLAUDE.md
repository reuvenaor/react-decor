# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What This Is

The **canonical home of react-decor** — compile-time `@` decorators on React function
components, compiled away into pure nested JSX. The library source lives in
`lib/react-decor/` (+ `ts-plugin/`); the documentation/demo site ships as **two example
apps** composing the **same shared sections** from `shared/`:

- **`examples/react-router`** — React Router 8 SPA (`ssr: false`, prerender
  `['/', '/docs', '/accessibility']`) on Vite 8, compiled by `react-decor/vite`. Deploys as a
  **Cloudflare Worker serving static assets** (its `wrangler.toml` `[assets]`) — not Pages.
- **`examples/nextjs`** — Next 16 App Router on Turbopack, `output: 'export'`, compiled by
  the `react-decor/webpack` loader via `turbopack.rules['*.at.tsx']` (+ a webpack pre-loader
  fallback). Build-only example — no deploy wiring by design.

Both on Tailwind v4 + TypeScript 6 + shadcn/ui, kept deliberately lean: English-only
i18n, six shadcn primitives, three radix deps.

Everything user-visible is dogfooded react-decor: sections are `*.at.tsx` files in the
full-strip / keyed-tile convention, and the `/docs` demos are LIVE mirrors of the code
samples beside them.

Public-facing docs: [README.md](README.md) (the library landing page) ·
[lib/react-decor/README.md](lib/react-decor/README.md) (the full reference — also the
npm package page) · [CONTRIBUTING.md](CONTRIBUTING.md) (dev setup + workflows).

## Monorepo Shape (the sharing contract)

npm workspaces (`examples/*`) exist **purely as the install/hoisting mechanism** — one
lockfile, one physical React (bare imports inside `shared/` resolve file-relatively up to
the hoisted root `node_modules`). `shared/` is a plain aliased dir, NOT a package:

- **`@shared/*` → `shared/*`** — mapped identically in both apps (tsconfig `paths`; the
  Vite app also aliases it in `vite.config.ts`). Sections, content, locales, styles, and
  the framework-agnostic lib (i18n / providers / brand / motion / highlight) live here.
- **`@/*` → each app's own `src/*`** — deliberately app-local. Shared sections import
  `@/components/ui/*` and `@/lib/utils`, so each app resolves its OWN shadcn copy — the
  ui primitives are **per-app by design** (`npm run setup` in either app re-installs them).
- **Navigation seam** — `shared/lib/router-link.tsx`: shared code imports `Link` from
  there (react-router prop shape: `to`/`viewTransition`/`preventScrollReset`); each app
  mounts `RouterLinkProvider` with its router's implementation (react-router passes its
  `Link` verbatim in `root.tsx`; the Next app wires a `next/link` shim in
  `src/components/router-link.tsx` that drops the two RR-only props).
- **Server/client split (Next only)** — pages/layout are server files exporting
  `metadata`; each page renders a thin `'use client'` composer under
  `src/components/*-page.tsx` that composes the shared sections (the client boundary lives
  in the APP — shared files stay directive-free). The metadata helper
  (`src/lib/seo.ts`) reads the flat locale map DIRECTLY — importing the shared i18n module
  server-side would drag react-i18next's `createContext` into a react-server context.

## Common Commands

```bash
npm install          # workspaces install; vendor/ tarballs are committed
npm run dev          # react-router dev :5173 (alias dev:rr) · dev:next → next dev :3000
npm run build        # rr prerender → examples/react-router/build/client/ + next export → examples/nextjs/out/
npm run typecheck    # per-app typegen + at-tsc (rr, next) + at-tsc lib + tsc (node, e2e)
npm run lint / lint:fix
npm run test         # vitest — react-decor lib suite (230 cases, lib/react-decor/test)
npm run test:e2e     # playwright: 28 tests × BOTH apps (react-router + nextjs projects)
npm run lib:pack     # after editing lib/react-decor source: re-pack + refresh all installs
npx wrangler deploy --config examples/react-router/wrangler.toml   # deploy the rr build
```

## Architecture

- **Routing** — react-router: `flatRoutes()`; `_app.tsx` is the pathless shell (SiteHeader
  / `<main id="main">` / SiteFooter); routes are **never** `.at.tsx` (flatRoutes splits on
  dots) — they compose decorated sections. Next: `src/app/` server pages + the client
  composers, with `SiteShell` as the same chrome. Home sections:
  `shared/components/home/*.at.tsx`; docs topics: `shared/components/docs/*-section.at.tsx`,
  each decl-decorated with `@DocTopic({ id })` (the id is the TOC/hash anchor); shared
  primitives: `shared/components/site/` (SectionShell, SectionHeading, PageHero, ProsePage,
  Region, BrandMark, chrome) and `shared/components/motion/` (Reveal, Stagger/StaggerItem,
  GradientText).
- **react-decor consumption** — `lib/react-decor` + `lib/react-decor/ts-plugin` are packed to
  committed `vendor/*.tgz` and installed as `file:` devDeps (root + both apps). Consumers:
  bare `'react-decor/vite'` in the rr vite config + root vitest config (bare specifier is
  load-bearing — never make it relative), `'react-decor/webpack'` in the Next
  `turbopack.rules` (+ webpack fallback), `'react-decor/eslint'` in eslint.config.js, the
  `at-tsc` bin in every `typecheck`, and `react-decor-ts-plugin` in each app tsconfig's
  plugins (requires the workspace TypeScript in the editor). After editing lib source run
  `npm run lib:pack`.
- **Docs content model** — UI copy lives in `shared/locales/en/translation.json` (flat
  dotted keys; every visible string through `t()`, lint-enforced), bundled by a direct
  JSON import (`shared/locales/index.ts`) so BOTH prerenders emit real text — no virtual
  module, no runtime fetch. Structure lives in `shared/content/*.ts` (typed arrays,
  `key`/`icon`/`snippet` fields — never copy). Code samples are verbatim strings in
  `shared/content/{snippets,docs-snippets}.ts`, rendered by `CodeBlock` (in-house
  tokenizer `shared/lib/highlight.tsx` on chart tokens — no highlighter dependency).
- **Sample-mirror lockstep** — the `Demo*` atoms in
  `shared/components/docs/demo-widgets.at.tsx` are the EXACT code shown in the samples
  beside them; edit both sides together. Their visible strings are quoted code rendered as
  expressions — deliberately outside the i18n surface.
- **Code surfaces are forced-dark** — CodeBlock's `<figure>` carries the `dark` class, so
  the dark token set re-resolves on that subtree in both page themes. Tokens only; no
  palette literals anywhere (lint-enforced, same PALETTE_RE / PHYSICAL_DIR_RE regimes).

## Key Conventions

- **Adopt the keyed-tile convention everywhere** — the full rule:
  [.claude/rules/keyed-tile-convention.md](.claude/rules/keyed-tile-convention.md); grammar,
  placements, and the AT error catalog: [lib/react-decor/README.md](lib/react-decor/README.md).
  Module-scope tiles, `key` on the map's callsite, decl form maximized, return-position
  directives only for what reads hooks/props, `asChild` children literal, no pass-through
  atoms, no local atoms, `t`/`key` never props, disabling `react/jsx-key` banned.
- **`*.at.tsx` files are hand-formatted** (Prettier can't parse them — `.prettierignore`);
  long class strings live in formatted composer components (`section-shell.tsx`,
  `code-block.tsx`, `demo-panel.tsx`, `doc-topic.tsx`, …). Caution: eslint `--fix` for
  `import/order` can splice an import INTO a decorator when the fix crosses the import
  block boundary in a `.at.tsx` file — reorder those imports by hand.
- **Theming is one static file** — [shared/styles/theme.app.css](shared/styles/theme.app.css)
  (supabase). Light `--primary`/`--ring` are deepened 0.83 L → 0.53 L for AA text contrast
  (axe-verified); don't revert to the upstream values. `GradientText` stops are
  `from-primary to-chart-2` — this palette's `accent` is a near-neutral surface tone,
  unusable as a text stop. Each app's css entry imports `shared/styles/index.css` (which
  `@source`-registers `shared/` for Tailwind scanning).
- **The e2e suite is the regression net — and the parity proof** — the SAME specs run as
  two Playwright projects (`react-router` against its dev server, `nextjs` against the
  real static export via `serve`). `e2e/decorators.spec.ts` asserts composed DOM
  structure, the live demos (identity survival across parent re-renders, Slot class
  injection, in-tree wrap-exactly-one-sibling), and that `@(` never appears outside
  `<figure>` code blocks — keep the directive opener out of prose copy; show it in samples
  only. `e2e/smoke.spec.ts`: per-route h1 + zero console errors + axe (light and dark).
- **Commit on completion** — when a change is done and `npm run lint` + `npm run typecheck`
  pass, commit it. Conventional Commits; this repo's husky pre-commit (lint-staged) +
  commit-msg (commitlint) hooks run on every commit. Never `--no-verify`.

## lib/react-decor (canonical home)

`lib/react-decor/` here IS the canonical react-decor library — this repo is its sole home.
After editing lib source, re-pack with `npm run lib:pack` (which refreshes every
workspace's lockfile tarball integrity hashes via `--workspaces
--include-workspace-root`).

## Environment Variables

All optional, standalone-safe defaults:

| Var                 | Effect                                                             |
| ------------------- | ------------------------------------------------------------------ |
| `VITE_BASE_PATH`    | rr build-time asset base path (default `/`).                       |
| `VITE_BACKEND_PORT` | rr dev `/api` proxy target (default `3939`); inert — no API calls. |
| `VITE_FS_ALLOW`     | Colon-separated extra Vite `fs.allow` roots (symlinked setups).    |
| `PW_PORT`           | Playwright rr dev-server port (default `5173`) for parallel runs.  |
| `PW_NEXT_PORT`      | Playwright Next static-server port (default `3000`).               |
| `PLAYWRIGHT_JSON`   | JSON report path (default `test-results/report.json`).             |
