'use strict'

/**
 * react-decor virtualizer — same-length, position-preserving text swaps that turn every
 * directive into valid, type-checkable TypeScript. Shared by the three shims (at-tsc,
 * the tsserver plugin, the ESLint parser); the build transform never uses it.
 *
 * Swaps (all strictly 1:1 characters, so every diagnostic/completion position in the
 * virtual text aligns with the raw file):
 * - declaration/return, bare + jsx forms: `@` → `;`   (`;Frame` / `;(<Card/>)` —
 *   expression statements; component references and JSX literals are never thenable)
 * - declaration/return, call form: `@` → `!`   (`!Card({ tone })` — still type-checks
 *   the props object against the component, and the negation consumes the value so
 *   composers whose CALL signature returns React 19's ReactNode — which includes
 *   Promise — never trip no-floating-promises. `!` must not be used on the jsx form:
 *   negating a JSX literal is tsc's TS2872 "always truthy". `!` is ASI-safe at
 *   statement starts)
 * - inside-tree: `@` → `{`, `(` → space, matching `)` → `}`   (`@(<Card/>)` →
 *   `{ <Card/>}`, a JSXExpressionContainer whose element is fully type-checked)
 *
 * Idempotent: virtualized text contains no directives, so a second pass is a no-op.
 */

const { scan } = require('./scan.cjs')

/**
 * Apply the swaps for an existing scan result (lets callers reuse a single parse).
 * Best-effort: recognized directives are swapped even when the scan also recorded
 * errors, so editors get near-valid text while the AT error surfaces separately.
 * @param {string} code
 * @param {import('./scan.d.cts').ScanResult} result
 * @returns {{ code: string, changed: boolean }}
 */
function virtualizeFromScan(code, result) {
  if (result.groups.length === 0) return { code, changed: false }
  const chars = code.split('')
  for (const g of result.groups) {
    if (g.placement === 'jsx-child') {
      for (const d of g.directives) {
        chars[d.atPos] = '{'
        chars[d.parenOpen] = ' '
        chars[d.parenClose] = '}'
      }
    } else {
      for (const d of g.directives) chars[d.atPos] = d.form === 'call' ? '!' : ';'
    }
  }
  return { code: chars.join(''), changed: true }
}

/**
 * Scan + swap in one call.
 * @param {string} code
 * @param {string} [fileName]
 * @returns {{ code: string, changed: boolean, errors: import('./scan.d.cts').AtError[], hasDirectives: boolean }}
 */
function virtualize(code, fileName) {
  const result = scan(code, fileName)
  const swapped = virtualizeFromScan(code, result)
  return { ...swapped, errors: result.errors, hasDirectives: result.hasDirectives }
}

module.exports = { virtualize, virtualizeFromScan }
