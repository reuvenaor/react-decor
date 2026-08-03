# Changelog

All notable changes to `react-decor` and `react-decor-ts-plugin` are documented
here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the packages adhere to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-08-03

First public release of `react-decor` and `react-decor-ts-plugin`.

### Added

- **The compile-away transform** — three decorator forms (bare `@Card`, call
  `@Labeled({ text })`, JSX `@(<Badge />)`) across four placements (component
  declarations, above a `return` with full function scope, and above any
  element inside a JSX tree), compiled into the exact nested JSX you would
  write by hand: no HOCs, no runtime code, zero bundle impact.
- **`$at` target slots** — route the decorated target into a named prop
  (`element`, `fallback`, render props) instead of `children`; composes
  through stacks and inside arbitrary expressions; alias-aware
  (`import { $at as slot }`). Decorator args accept any expression, including
  elements (`@Panel({ header: <Header /> })`).
- **Bundler integrations** — the Vite plugin (`react-decor/vite`) and the
  webpack/Turbopack loader (`react-decor/webpack`) for Next.js.
- **`at-tsc`** — a `tsc --noEmit` wrapper that type-checks `*.at.tsx` through
  same-length virtualization, plus a second pass that type-checks the real
  transformed output of return-position and in-tree slots (diagnostics mapped
  back through the transform's sourcemap).
- **`react-decor-ts-plugin`** — the tsserver plugin: the editor shows the raw
  `@` syntax while hover, go-to-definition, and completions keep working
  inside decorator expressions.
- **ESLint integration** — a virtualizing parser plus eight composition rules
  (keyed tiles, no local atoms, no pass-through atoms, the Slot/`asChild`
  boundary with its props-forwarding escape, `$at` placement).
- **The AT error catalog** — AT000–AT017, precise raw-file spans surfaced
  identically in the build, the type gate, the IDE, and lint.
- **Return-position key hoist** — a top-level `key` on the returned element
  moves onto the emitted outermost wrapper (the actual array element), so the
  natural map-callback shape is also the correct runtime shape.
- **Consumer compatibility matrix** — CI installs the packed tarballs into a
  scratch project at TypeScript 5.0 / 5.8 / latest × React 18 / latest and
  drives every surface, including a real `react-dom` render of transformed
  output.

[Unreleased]: https://github.com/reuvenaor/react-decor/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/reuvenaor/react-decor/releases/tag/v0.3.0
