'use strict'

/**
 * react-decor build transform — magic-string edits that compile `@` directives into pure
 * nested JSX. The output is consumed exclusively by bundler type-erasers (Vite/rolldown,
 * Vitest); it is never type-checked. All type checking runs on the VIRTUALIZED source
 * (see virtualize.cjs), where the component keeps its original name, signature, and
 * generics — so importers' types are exactly the un-decorated component's.
 *
 * CommonJS by design (like the rest of the core): Vite's config loader externalizes
 * bare specifiers to a native Node load, and native CJS is the one flavor every Node
 * can run with zero build/type-stripping — bundling this chain instead breaks on the
 * `require('typescript')` inside externalized-to-file-URL config bundles.
 *
 * Universal whitespace rule: directive scaffolding is removed as full spans (previous
 * kept token end → next kept token start). JSX preserves whitespace-only text WITHOUT a
 * newline as a real text node, so a same-line `@(<A/>) <X/>` must not leave a stray
 * space between kept tokens — full-span removal makes output tight and layout-independent.
 */

const MagicString = require('magic-string')
const { scan } = require('./scan.cjs')

/** Build error carrying the raw-file position of the offending directive. */
class AtBuildError extends Error {
  /** @param {import('./scan.d.cts').AtError} err */
  constructor(err) {
    super(`[react-decor] ${err.code}: ${err.message}`)
    this.name = 'AtBuildError'
    this.atCode = err.code
    this.pos = err.span.start
    this.end = err.span.end
  }
}

const openOf = (g) => g.directives.map((d) => d.openTag).join('')
const closeOf = (g) =>
  [...g.directives]
    .reverse()
    .map((d) => d.closeTag)
    .join('')

function applyDeclaration(s, g) {
  const t = g.target
  s.remove(g.removeSpan.start, g.removeSpan.end)
  if (t.exportRemoveSpan) s.remove(t.exportRemoveSpan.start, t.exportRemoveSpan.end)
  s.overwrite(t.nameStart, t.nameEnd, `${t.name}_base`)
  const p = t.usesProps ? 'props$' : 'props'
  const body = `${openOf(g)}<${t.name}_base {...${p}} />${closeOf(g)}`
  const exportPrefix = t.isDefault ? 'export default ' : t.exported ? 'export ' : ''
  const wrapper =
    t.kind === 'function-decl'
      ? `\n${exportPrefix}function ${t.name}(${p}) {\n  return ${body}\n}`
      : `\n${exportPrefix}const ${t.name} = (${p}) => (${body});`
  s.appendRight(t.stmtEnd, wrapper)
}

function applyReturn(s, g) {
  s.remove(g.removeSpan.start, g.removeSpan.end)
  // A non-JSX expression needs {} only in a CHILDREN position; when the innermost
  // directive is slotted, the expression already sits inside the attr's braces.
  const braces = !g.exprIsJsx && !g.directives[g.directives.length - 1].slotted
  // Key hoist: the emitted OUTERMOST wrapper is the actual array element, so a
  // `key` the author wrote on the returned element (where the virtualized
  // react/jsx-key lint sees it) moves onto the wrapper's open tag. When the
  // wrapper carries its own key it wins and the child key stays (harmless on a
  // single non-array child).
  let open = openOf(g)
  if (g.exprKey && !g.directives[0].hasKeyAttr) {
    const key = g.exprKey
    s.remove(key.start, key.end)
    // function replacement — `$` in the key text must stay literal
    open = open.replace(/^<([A-Za-z_$][\w$.]*)/, (_, tag) => `<${tag} ${key.text}`)
  }
  s.appendLeft(g.exprStart, `(${open}${braces ? '{' : ''}`)
  s.appendRight(g.exprEnd, `${braces ? '}' : ''}${closeOf(g)})`)
}

function applyJsxChild(s, code, g) {
  const dirs = g.directives
  if (dirs.length === 1 && dirs[0].slotted) {
    // Slotted in-tree wrapper (scan guarantees it is the chain's only link): the
    // element stays intact — attributes keep their exact original offsets — while
    // the target MOVES into the `$at` splice point. Expression-container targets
    // contribute only their inner expression; the attr's own braces already wrap it.
    const d = dirs[0]
    s.remove(d.atPos, d.wrapperStart)
    s.remove(d.wrapperEnd, g.target.start)
    let from = g.target.start
    let to = g.target.end
    if (g.targetExpr) {
      s.remove(g.target.start, g.targetExpr.start)
      s.remove(g.targetExpr.end, g.target.end)
      from = g.targetExpr.start
      to = g.targetExpr.end
    }
    s.move(from, to, d.sentinelStart)
    s.remove(d.sentinelStart, d.sentinelEnd)
    return
  }
  for (let i = 0; i < dirs.length; i++) {
    const d = dirs[i]
    // '@(' + any whitespace inside the parens, up to the wrapper element
    s.remove(d.atPos, d.wrapperStart)
    if (d.selfClosing) {
      // `<Card … />` → `<Card …>` (attributes keep their exact original offsets);
      // also swallow the whitespace before the slash so the open tag stays tight.
      let cut = code.lastIndexOf('/', d.wrapperEnd - 1)
      while (/[ \t\r\n]/.test(code[cut - 1])) cut--
      s.overwrite(cut, d.wrapperEnd, '>')
    } else {
      // `<Card></Card>` → `<Card>`
      s.remove(d.openingEnd, d.wrapperEnd)
    }
    // ')' + whitespace + the next '@(' (chains) or everything up to the target
    const nextStart = i + 1 < dirs.length ? dirs[i + 1].atPos : g.target.start
    s.remove(d.wrapperEnd, nextStart)
  }
  s.appendLeft(g.target.end, closeOf(g))
}

/** Apply every directive group's edits — the one loop both entry points share. */
function applyGroups(s, code, groups) {
  for (const g of groups) {
    if (g.placement === 'declaration') applyDeclaration(s, g)
    else if (g.placement === 'return') applyReturn(s, g)
    else applyJsxChild(s, code, g)
  }
}

/**
 * Compile `@` directives in `code` to nested JSX. Throws {@link AtBuildError} on the
 * first scan error (malformed directive, grammar violations, or an unrecognized syntax
 * error passed through from the TypeScript parser).
 * @param {string} code
 * @param {string} id
 * @returns {{ code: string, map: unknown, changed: boolean }}
 */
function transform(code, id) {
  const result = scan(code, id)
  if (result.errors.length > 0) throw new AtBuildError(result.errors[0])
  const s = new MagicString(code)
  applyGroups(s, code, result.groups)
  return {
    code: s.toString(),
    map: s.generateMap({ source: id, hires: 'boundary', includeContent: true }),
    changed: result.groups.length > 0,
  }
}

/**
 * Transform plus the DECODED sourcemap and the scan groups — for consumers that
 * map generated positions back to the raw file themselves (at-tsc's second
 * pass, which type-checks the real spliced output). Output is byte-identical
 * to {@link transform}: both run {@link applyGroups} over the same MagicString.
 * @param {string} code
 * @param {string} id
 * @returns {{ code: string, decodedMap: { mappings: number[][][] }, groups: import('./scan.d.cts').DirectiveGroup[], changed: boolean }}
 */
function transformWithDecodedMap(code, id) {
  const result = scan(code, id)
  if (result.errors.length > 0) throw new AtBuildError(result.errors[0])
  const s = new MagicString(code)
  applyGroups(s, code, result.groups)
  return {
    code: s.toString(),
    decodedMap: s.generateDecodedMap({ source: id, hires: 'boundary' }),
    groups: result.groups,
    changed: result.groups.length > 0,
  }
}

module.exports = { transform, transformWithDecodedMap, AtBuildError }
