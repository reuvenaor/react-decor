/**
 * react-decor root entry — the `$at` target-slot sentinel.
 *
 * Written as (part of) a decorator-argument value, `$at` marks the prop that
 * receives the decorated target: the transform splices the target element in its
 * place and emits the wrapper self-closing instead of threading children.
 *
 *   import { $at } from 'react-decor'
 *
 *   @Route({ path: '/x', element: $at })
 *   export function Page(props) { … }
 *   // → <Route path={'/x'} element={<Page_base {...props} />} />
 *
 * Never a runtime value: the transform replaces every occurrence, so the import
 * survives only as dead code and `sideEffects: false` lets bundlers drop it.
 * The scanner resolves the sentinel from this import's LOCAL binding, so
 * aliasing is fine (`import { $at as slot }` makes `slot` the sentinel); a file
 * with no react-decor import matches the literal name `$at`.
 */
export const $at = undefined
