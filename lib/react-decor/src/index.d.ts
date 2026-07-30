import type { ReactElement } from 'react'

/**
 * The target-slot sentinel. Typed as a ReactElement, which fully type-checks
 * DECLARATION-position slots — the transform always splices
 * `<X_base {...props} />` there. Return-position and in-tree slots splice an
 * ARBITRARY expression: the virtualized view checks that expression detached
 * from the slot, and at-tsc's second pass type-checks the real transformed
 * splice (the tsserver plugin still sees only this stand-in — its residual
 * gap). Wrap it in an arrow (`render: () => $at`) when the wrapper wants a
 * render prop. Compile-time only — never read it at runtime. Aliasing is
 * supported: the scanner resolves the sentinel from this import's local
 * binding (`import { $at as slot }` makes `slot` the sentinel).
 */
export declare const $at: ReactElement
