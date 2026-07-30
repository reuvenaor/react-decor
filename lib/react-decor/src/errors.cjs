'use strict'

/**
 * react-decor error catalog. Every scan/transform failure is an AT-coded error with a
 * precise source span, shared verbatim by the Vite plugin (code-frame), at-tsc
 * (diagnostic), the tsserver plugin (squiggle), and the ESLint parser (fatal parse
 * error) — one catalog, four surfaces.
 */

const CATALOG = {
  AT000: (d) => `unrecognized syntax error: ${d}`,
  AT001: () =>
    'malformed inside-tree directive — expected `@(<Wrapper />)` immediately before a JSX element; to render literal "@(" text, write {\'@(\'}',
  AT002: (d) =>
    `wrapper <${d}> must be childless (self-closing or an empty pair) — the transform threads the decorated target into it (children, or the $at slot)`,
  AT003: (d) => `wrapper "${d}" must be a capitalized component reference`,
  AT004: (d) => `decorated declaration "${d}" must be capitalized (React component convention)`,
  AT005: () => 'decorated default export must be named — anonymous components cannot be wrapped',
  AT006: () =>
    'decorators are only supported on function components (a named function declaration, or a single const/let with an arrow-function or function-expression initializer)',
  AT007: (d) =>
    `dangling decorator(s) — expected a component declaration, a return statement, or a JSX element to follow${d}`,
  AT008: () =>
    "call-form decorator takes exactly one object-literal argument, e.g. @Card({ tone: 'brand' })",
  AT009: (d) =>
    `unsupported property ${d} in call-form decorator — only plain \`name: value\`, shorthand, spread, and valid JSX-attribute string keys are allowed`,
  AT011: () => 'decorator above a valueless `return` — there is nothing to wrap',
  AT012: (d) =>
    `decorator expression ${d} is not a component reference, a component call, or a parenthesized JSX element (fragments cannot be wrappers)`,
  AT013: () => 'inside-tree directive target must be a JSX element or a {expression} container',
  AT014: (d) =>
    `generated name "${d}" collides with an existing declaration in the same scope — rename one of them`,
  AT015: () =>
    'more than one $at sentinel in a single directive — the decorated target can fill exactly one slot',
  AT016: (d) =>
    `invalid $at position (${d}) — $at is the target-slot sentinel and may only appear as (part of) a property value or attribute expression`,
  AT017: () =>
    'an inside-tree directive chain cannot include a $at slot directive — a slotted wrapper must be the only directive above its target',
}

/**
 * Build an AT-coded error object.
 * @param {keyof typeof CATALOG} code
 * @param {{ start: number, end: number }} span
 * @param {string} [detail]
 * @returns {{ code: string, message: string, span: { start: number, end: number } }}
 */
function atError(code, span, detail) {
  return { code, message: CATALOG[code](detail ?? ''), span: { start: span.start, end: span.end } }
}

module.exports = { atError, AT_CODES: Object.keys(CATALOG) }
