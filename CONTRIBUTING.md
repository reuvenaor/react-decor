# Contributing to react-decor

Ground rules first: participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md); security issues go through the
[security policy](SECURITY.md) (never a public issue); and by contributing you
agree your contributions are licensed under the repo's [MIT license](LICENSE).

This repo is the canonical home of the `react-decor` library (`lib/react-decor/` + its
`ts-plugin/`) **and** its documentation site — two example apps that compose the same
shared sections, every one written with react-decor itself. The site doubles as the
library's proving ground: one Playwright suite runs against both apps, so a green suite
proves the transform produces identical DOM through two different bundler integrations.

## Setup

```bash
npm install    # workspaces install; vendor/ tarballs are committed — offline-first
```

Editor: select the **workspace TypeScript** (`.vscode/settings.json` points at it) or
every `*.at.tsx` shows phantom ts(1206) squiggles — `react-decor-ts-plugin` only loads
in the workspace tsserver.

## Commands

```bash
npm run dev          # react-router dev on :5173  (alias: dev:rr)
npm run dev:next     # next dev on :3000
npm run build        # rr prerender → examples/react-router/build/client/
                     # + next export → examples/nextjs/out/
npm run typecheck    # per-app typegen + at-tsc (rr, next) + at-tsc lib + tsc (node, e2e)
npm run lint         # eslint (react-decor + @next/next rules included); lint:fix to autofix
npm run test         # vitest — the react-decor library suite (230 cases)
npm run test:e2e     # playwright: the 28-test suite × BOTH apps (56 runs)
npm run lib:pack     # after editing lib/react-decor: re-pack tarballs + refresh installs
```

## Monorepo shape (the sharing contract)

npm workspaces (`examples/*`) exist purely as the install/hoisting mechanism — one
lockfile, one physical React. `shared/` is a plain aliased dir, **not** a package:

- **`@shared/*` → `shared/*`** — mapped identically in both apps (tsconfig `paths`;
  the Vite app also aliases it in `vite.config.ts`). Sections, content, locales,
  styles, and the framework-agnostic lib live here.
- **`@/*` → each app's own `src/*`** — deliberately app-local. Shared sections import
  `@/components/ui/*` and `@/lib/utils`, so each app resolves its **own** shadcn copy —
  the ui primitives are per-app by design.
- **Navigation seam** — `shared/lib/router-link.tsx`: shared code imports `Link` from
  there; each app mounts `RouterLinkProvider` with its router's implementation
  (react-router passes its `Link` verbatim; the Next app wires a `next/link` shim).

## The library and the tarball workflow

`lib/react-decor/` is the canonical library source. The repo consumes it through
committed tarballs in `vendor/`, installed as `file:` devDependencies (root + both
apps) — which keeps installs offline-first and pins exactly what the examples run.

After editing lib source (or bumping a package version):

```bash
npm run lib:pack     # scripts/lib-pack.mjs — pack both packages into vendor/,
                     # re-point the six file: pins + the ts-plugin dep range to the
                     # current versions, prune stale tarballs/installed copies,
                     # refresh all installs + the lockfile
```

CI runs `npm run verify:vendor` (scripts/verify-vendor.mjs), which packs from lib
source and content-diffs against the committed tarballs — a lib edit committed
without `lib:pack` fails the build instead of silently testing stale vendor code.

Gotcha: npm caches `file:` tarballs aggressively. `lib:pack` prunes the installed
copies so a same-version repack re-extracts; if an install still serves stale
content (check `node_modules/react-decor/package.json`), verify the `integrity`
fields in `package-lock.json` match the actual tarball hashes, then `npm ci`.

## Authoring conventions

- **Keyed-tile / full-strip** — the composition convention every `*.at.tsx` section
  follows: [.claude/rules/keyed-tile-convention.md](.claude/rules/keyed-tile-convention.md).
  Grammar and the AT error catalog: [lib/react-decor/README.md](lib/react-decor/README.md).
- **`*.at.tsx` files are hand-formatted** (Prettier can't parse them —
  `.prettierignore`); long class strings live in formatted composer components.
  Caution: eslint `--fix` for `import/order` can splice an import INTO a decorator
  when the fix crosses the import-block boundary in a `.at.tsx` file — reorder those
  imports by hand.
- **Docs content model** — UI copy lives in `shared/locales/en/translation.json`
  (every visible string through `t()`, lint-enforced); structure in
  `shared/content/*.ts`; code samples are verbatim strings in
  `shared/content/{snippets,docs-snippets}.ts`. The `Demo*` atoms in
  `shared/components/docs/demo-widgets.at.tsx` are the EXACT code shown in the samples
  beside them — edit both sides together.
- **Theming is one static file** — `shared/styles/theme.app.css`. Semantic tokens
  only; no palette literals (lint-enforced).

## Testing

Consumer compatibility is part of the contract: `node scripts/compat-check.mjs
--ts 5.0.4 --react 18` packs the tarballs from lib source and proves every surface
in a scratch project pinned to that pair (CI runs the matrix — the floors, a
midpoint, and latest/latest). Run it locally when touching the transform, the
peers, or anything `typescript`-API-facing.

The e2e suite is the regression net **and** the parity proof: the same specs run as
two Playwright projects (`react-router` against its dev server, `nextjs` against the
real static export). `e2e/decorators.spec.ts` asserts composed DOM structure and the
live demos; `e2e/smoke.spec.ts` asserts per-route h1, zero console errors, and axe
accessibility in light and dark. Keep the `@(` directive opener out of prose copy —
show it in code samples only (a spec enforces this).

## Deploying the docs site

The react-router app deploys as a Cloudflare **Worker serving static assets**
([examples/react-router/wrangler.toml](examples/react-router/wrangler.toml)):

```bash
npm run build -w examples/react-router
npx wrangler deploy --config examples/react-router/wrangler.toml
```

Cloudflare Workers Builds settings (workspaces need the ROOT lockfile): root directory
at the repo root, build command `npm ci && npm run build -w examples/react-router`,
deploy command as above. Regenerate `package-lock.json` with node 22.16.0 / npm 10.9.2
if Cloudflare CI runs the build. The Next app is build-only by design — no deploy
wiring.

## Commits

Conventional Commits, enforced by husky (pre-commit lint-staged, commit-msg
commitlint). Subject ≤ 50 chars, header ≤ 72, present tense. Commit when a change is
done and `npm run lint` + `npm run typecheck` pass. Never `--no-verify`.

## Pull requests

Fork (or branch), keep the PR to one logical change, and fill in the PR template's
checklist — CI runs the same battery (lint, typecheck, the 230-case unit suite, both
builds, the 54-run Playwright parity suite), so running it locally first saves a
round-trip. User-facing changes add a line to [CHANGELOG.md](CHANGELOG.md) under
**Unreleased**. Releases are cut by the maintainers via the tag-triggered
[release workflow](.github/workflows/release.yml) (npm publish with provenance).
