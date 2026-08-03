# react-decor

[![CI](https://github.com/reuvenaor/react-decor/actions/workflows/ci.yml/badge.svg)](https://github.com/reuvenaor/react-decor/actions/workflows/ci.yml)
[![npm: react-decor](https://img.shields.io/npm/v/react-decor?label=react-decor)](https://www.npmjs.com/package/react-decor)
[![npm: react-decor-ts-plugin](https://img.shields.io/npm/v/react-decor-ts-plugin?label=react-decor-ts-plugin)](https://www.npmjs.com/package/react-decor-ts-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Compile-time `@` decorators for React function components — compiled away into **pure
nested JSX**. No HOCs, no runtime library code, zero bundle impact.

```tsx
@Card
@Labeled({ text: 'Email address' })
export function EmailInput(props: InputProps) {
  return <input type="email" {...props} />
}
```

ships as exactly what you would write by hand:

```tsx
function EmailInput_base(props: InputProps) {
  return <input type="email" {...props} />
}
export function EmailInput(props) {
  return (
    <Card>
      <Labeled text={'Email address'}>
        <EmailInput_base {...props} />
      </Labeled>
    </Card>
  )
}
```

The decorators only exist in your source: a build-time transform rewrites each
`*.at.tsx` file into the nested JSX above before your bundler's own TSX pipeline runs.

> **Status:** v0.3.0, MIT — `npm install -D react-decor react-decor-ts-plugin`.
> This repo itself installs the library from its committed [vendor/](vendor) tarballs
> (offline-first); CI verifies them byte-identical to `lib/` source on every run.

## Why

- **Less code, flatter components.** Wrappers move out of the tree and onto
  declarations — components read top-down instead of inside-out, and the wrapper
  pyramid disappears.
- **Zero runtime.** No function ever receives or returns a component at runtime.
  Nothing ships in the bundle beyond the JSX you would have written yourself.
- **The toolchain stays green.** `at-tsc` (a `tsc` wrapper), a tsserver plugin, and an
  ESLint parser all see valid TypeScript — hover, go-to-definition, and completions
  keep working inside decorator expressions.
- **Composition conventions are enforced, not suggested.** Eight ESLint rules turn the
  library's composition conventions into hard errors, and every malformed directive is
  a precise `AT`-coded diagnostic (AT000–AT017) surfaced identically in the build, the
  type gate, the IDE, and lint. Reviews argue about design, not discipline — and code
  generators (human or AI) get a deterministic feedback loop instead of style policing.

## Syntax at a glance

Three decorator forms, four placements — full grammar in the
[library reference](lib/react-decor/README.md):

```tsx
@Card                                // bare — no props
@Labeled({ text: 'Email address' })  // call — one object literal, passed as props
@(<Badge tone="new" />)              // JSX — parens required
```

Decorators go on component declarations, above a `return` (full function scope), or
above any element inside a JSX tree. Args accept any expression — including JSX
(`@Panel({ header: <Header /> })`).

**Target slots (`$at`).** By default the decorated target becomes the wrapper's
children. Mark a prop with the `$at` sentinel and the target is spliced there instead —
so components that take content via a named prop (`element`, `fallback`, render props)
are decoratable without adapters:

```tsx
import { $at } from 'react-decor'

@Route({ path: '/settings', element: $at })
export function SettingsPage(props: Props) {
  return <SettingsForm {...props} />
}
// → <Route path={'/settings'} element={<SettingsPage_base {...props} />} />
```

## Install

Two packages: `react-decor` (transform, Vite plugin, webpack loader, `at-tsc`, ESLint
parser + rules) and `react-decor-ts-plugin` (the tsserver plugin for editor support).

```bash
npm install -D react-decor react-decor-ts-plugin
```

Peer dependencies: `typescript >= 5.0` (required), `react >= 18`, `vite >= 5`, and
`@typescript-eslint/parser >= 8` (all optional, wide ranges — react-decor never
constrains the rest of your dependency tree).

### Compatibility

- **React ≥ 18.** react-decor is compile-time only — no react-decor code runs or
  ships in your bundle. The emitted JSX is compiled by _your_ toolchain against
  _your_ React, and the `$at` typings are validated against `@types/react` 18 and
  19 with `skipLibCheck` off.
- **TypeScript ≥ 5.0.** Proven empirically, not assumed: a consumer-matrix CI job
  ([scripts/compat-check.mjs](scripts/compat-check.mjs)) installs the packed
  tarballs into a scratch project at TS 5.0 / 5.8 / latest × React 18 / latest and
  drives the transform, the AT diagnostics, `at-tsc` (green _and_ red), a real
  `react-dom` render of the transformed output, and the ESLint rules.
- **Coexists with anything.** One runtime dependency (`magic-string` — npm nests
  it privately on conflict); everything else is an optional peer. The whole chain
  is plain CommonJS with no build step, resolved against whatever `typescript`
  your project has installed.

### Vite

```ts
// vite.config.ts — enforce:'pre', runs before the framework's TSX transforms
import reactDecor from 'react-decor/vite'
export default defineConfig({ plugins: [reactDecor(), react()] })
```

### Next.js (Turbopack) / webpack

```ts
// next.config.ts — the rule transforms *.at.tsx, `as` re-enters the TSX pipeline
const nextConfig: NextConfig = {
  turbopack: {
    rules: { '*.at.tsx': { loaders: ['react-decor/webpack'], as: '*.tsx' } },
  },
  // at-tsc is the type gate (Next's own tsc cannot parse raw .at.tsx):
  typescript: { ignoreBuildErrors: true },
}
```

```js
// plain webpack — register as a pre-loader
module.rules.push({ test: /\.at\.tsx$/, enforce: 'pre', use: 'react-decor/webpack' })
```

Monorepo note: when `*.at.tsx` sources live OUTSIDE the Next app dir (like this
repo's `shared/`), the Turbopack path needs `turbopack.root` and the webpack
path needs `experimental: { externalDir: true }` — otherwise SWC never
transpiles the out-of-dir modules (see
[examples/nextjs/next.config.ts](examples/nextjs/next.config.ts)).

### Editor + type checking

```jsonc
// tsconfig.json — editor support (use the WORKSPACE TypeScript in your editor)
"compilerOptions": { "plugins": [{ "name": "react-decor-ts-plugin" }] }
```

```jsonc
// package.json — at-tsc replaces tsc for projects with *.at.tsx files
"typecheck": "at-tsc -p tsconfig.json --noEmit"
```

### ESLint + Prettier

```js
// eslint.config.js — scopes the virtualizing parser + all eight rules to *.at.tsx
import { reactDecorEslint } from 'react-decor/eslint'
export default tseslint.config(/* … */, reactDecorEslint())
```

Prettier cannot parse `*.at.tsx` — add the pattern to `.prettierignore` and keep long
class strings in formatted composer components.

## Examples

Two example apps ship in this repo and compose the **same shared sections** — every
user-visible section of the docs site is written with react-decor:

- [examples/react-router](examples/react-router) — React Router 8 (framework mode,
  SPA + prerender) on Vite 8, compiled by `react-decor/vite`. The docs site.
- [examples/nextjs](examples/nextjs) — Next 16 (App Router, Turbopack,
  `output: 'export'`), compiled by the `react-decor/webpack` loader.

One Playwright suite runs against **both** apps (27 tests × 2). Because both compose
byte-identical `*.at.tsx` sources through two different bundler integrations, a green
suite proves the transform produces identical, framework-independent DOM.

```bash
npm install         # tarballs are committed in vendor/ — offline-first
npm run dev         # docs site on :5173 (npm run dev:next → :3000)
npm run test        # the library's vitest suite (230 cases)
npm run test:e2e    # the 27-test Playwright suite × both apps
```

## Documentation

- [lib/react-decor/README.md](lib/react-decor/README.md) — the full reference: grammar,
  placements, scoping, `$at` target slots, the Slot (`asChild`) boundary, conventions,
  toolchain virtualization, and the AT000–AT017 error catalog.
- [lib/react-decor/ts-plugin/README.md](lib/react-decor/ts-plugin/README.md) — editor
  integration.
- [.claude/rules/keyed-tile-convention.md](.claude/rules/keyed-tile-convention.md) —
  the keyed-tile / full-strip authoring convention the examples follow (and the eight
  lint rules enforce).
- The docs site itself (`/` pitch, `/docs` reference with live demos) — run
  `npm run dev`.

## Repository layout

```
lib/react-decor/         the library (+ ts-plugin/) — the canonical source
shared/                  sections + content + styles both example apps compose
examples/react-router/   Vite example app (the docs site)
examples/nextjs/         Next.js example app (build-only)
e2e/                     one Playwright suite, run against both apps
vendor/                  committed tarballs the repo installs (file: deps)
```

## Contributing

Development setup, the monorepo sharing contract, the tarball workflow, and the commit
conventions live in [CONTRIBUTING.md](CONTRIBUTING.md). Community standards:
[Code of Conduct](CODE_OF_CONDUCT.md) · [Security policy](SECURITY.md) ·
[Support](SUPPORT.md) · [Changelog](CHANGELOG.md).

## License

[MIT](LICENSE)
