'use strict'

/**
 * react-decor scanner — ONE raw TypeScript parse (`ts.createSourceFile`, no checker, no
 * program) that turns a `.at.tsx` source into the directive model every other module
 * consumes: the transform (build output), the virtualizer (same-length shim text for
 * at-tsc / tsserver / ESLint), and the error surfaces.
 *
 * Measured parser facts this relies on (TypeScript 6.0.3):
 * - `@Card` / `@Card({...})` / `@(<Card/>)` above function/const statements (top-level
 *   AND nested in blocks) parse with ZERO parse diagnostics; the decorators land in the
 *   statement's `modifiers` array before the export keyword.
 * - Above a `return`, the decorators survive as `MissingDeclaration[Decorator]` nodes
 *   immediately preceding the ReturnStatement (parse diagnostic 1146 is consumed here).
 * - Inside JSX children, `@(<Card/>)` parses clean as [JsxText "@("] [JsxElement]
 *   [JsxText ")"] — the wrapper element is a real, type-checked reference.
 */

const ts = require('typescript')
const { atError } = require('./errors.cjs')

/**
 * @param {string} code
 * @param {string} [fileName]
 * @returns {import('./scan.d.cts').ScanResult}
 */
function scan(code, fileName = 'file.at.tsx') {
  /** @type {import('./scan.d.cts').DirectiveGroup[]} */
  const groups = []
  /** @type {import('./scan.d.cts').AtError[]} */
  const errors = []
  if (!code.includes('@')) return { groups, errors, hasDirectives: false }

  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  /**
   * Spans whose parse diagnostics belong to recognized directives (consumed, not
   * surfaced). `codes` restricts consumption to specific diagnostic codes — a
   * recognized return-position directive only ever produces 1146 "Declaration
   * expected", and consuming anything broader would mask REAL syntax errors inside
   * the statement. Entries without `codes` consume everything in their span (used
   * where the scanner already emitted its own AT error for the construct).
   */
  const consumedSpans = []

  const err = (c, span, detail) => {
    errors.push(atError(c, span, detail))
  }
  const start = (n) => n.getStart(sf)
  const skipWs = (p) => {
    while (p < code.length && /\s/.test(code[p])) p++
    return p
  }
  const lastSegment = (text) => text.split('.').pop() ?? text
  const isCapitalized = (name) => /^[A-Z]/.test(name)
  const nodeSpan = (n) => ({ start: start(n), end: n.end })

  /**
   * The file's target-slot sentinel names: every local binding of the `$at`
   * export of 'react-decor' (so `import { $at as slot }` makes `slot` the sentinel),
   * falling back to the literal name `$at` when no such import exists.
   */
  const sentinelNames = (() => {
    /** @type {Set<string>} */
    const names = new Set()
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st)) continue
      if (!ts.isStringLiteral(st.moduleSpecifier) || st.moduleSpecifier.text !== 'react-decor') {
        continue
      }
      const b = st.importClause && st.importClause.namedBindings
      if (!b || !ts.isNamedImports(b)) continue
      for (const spec of b.elements) {
        if ((spec.propertyName ?? spec.name).text === '$at') names.add(spec.name.text)
      }
    }
    if (names.size === 0) names.add('$at')
    return names
  })()

  /**
   * Collect target-slot sentinels in VALUE position inside an expression subtree
   * (any name in {@link sentinelNames}). Property/attribute NAMES and
   * member-access names never count; top-level shorthand and spread misuses are
   * rejected by the callers. Sentinels in positions the transform cannot splice —
   * type positions, nested shorthand values, computed property names, JSX tag
   * names, binding names — are returned as `invalid` (first one wins) so callers
   * fail closed with AT016 instead of emitting syntactically broken output.
   * @param {import('typescript').Node} root
   * @returns {{ sents: import('typescript').Identifier[], invalid: { node: import('typescript').Identifier, reason: string } | null }}
   */
  function collectSentinels(root) {
    /** @type {import('typescript').Identifier[]} */
    const found = []
    /** @type {{ node: import('typescript').Identifier, reason: string } | null} */
    let invalid = null
    const bad = (n, reason) => {
      if (!invalid) invalid = { node: n, reason }
    }
    const visit = (n, inType) => {
      const t = inType || ts.isTypeNode(n)
      if (ts.isIdentifier(n) && sentinelNames.has(n.text)) {
        const p = n.parent
        const isName =
          (ts.isPropertyAccessExpression(p) && p.name === n) ||
          (ts.isPropertyAssignment(p) && p.name === n) ||
          (ts.isJsxAttribute(p) && p.name === n) ||
          (ts.isBindingElement(p) && p.propertyName === n)
        if (isName) return
        if (t) bad(n, 'a type position')
        else if (ts.isShorthandPropertyAssignment(p)) bad(n, 'a shorthand property')
        else if (ts.isComputedPropertyName(p)) bad(n, 'a computed property name')
        else if (
          (ts.isJsxSelfClosingElement(p) ||
            ts.isJsxOpeningElement(p) ||
            ts.isJsxClosingElement(p)) &&
          p.tagName === n
        ) {
          bad(n, 'a JSX tag name')
        } else if (
          (ts.isParameter(p) || ts.isVariableDeclaration(p) || ts.isBindingElement(p)) &&
          p.name === n
        ) {
          bad(n, 'a binding name')
        } else found.push(n)
        return
      }
      ts.forEachChild(n, (c) => visit(c, t))
    }
    visit(root, false)
    return { sents: found, invalid }
  }

  /**
   * Validate a JSX wrapper element (childless, capitalized, not a fragment) and derive
   * its open/close tags plus in-place-conversion geometry.
   */
  function fromJsxWrapper(node) {
    if (ts.isJsxFragment(node)) {
      err('AT012', nodeSpan(node), 'a fragment')
      return null
    }
    let tagName, attrsNode, selfClosing, openingEnd
    if (ts.isJsxSelfClosingElement(node)) {
      tagName = node.tagName
      attrsNode = node.attributes
      selfClosing = true
      openingEnd = node.end
    } else if (ts.isJsxElement(node)) {
      const hasContent = node.children.some(
        (c) => !(ts.isJsxText(c) && code.slice(c.pos, c.end).trim() === ''),
      )
      if (hasContent) {
        err('AT002', nodeSpan(node), node.openingElement.tagName.getText(sf))
        return null
      }
      tagName = node.openingElement.tagName
      attrsNode = node.openingElement.attributes
      selfClosing = false
      openingEnd = node.openingElement.end
    } else {
      err('AT012', nodeSpan(node), node.getText(sf).slice(0, 40))
      return null
    }
    const name = tagName.getText(sf)
    if (!isCapitalized(lastSegment(name))) {
      err('AT003', nodeSpan(tagName), name)
      return null
    }
    const base = {
      name,
      wrapperStart: start(node),
      wrapperEnd: node.end,
      openingEnd,
      selfClosing,
      hasKeyAttr: attrsNode.properties.some(
        (a) => ts.isJsxAttribute(a) && ts.isIdentifier(a.name) && a.name.text === 'key',
      ),
    }
    /** @type {import('typescript').Identifier[]} */
    const sents = []
    for (const a of attrsNode.properties) {
      if (ts.isJsxAttribute(a)) {
        if (ts.isIdentifier(a.name) && sentinelNames.has(a.name.text)) {
          err('AT016', nodeSpan(a.name), 'an attribute name')
          return null
        }
        if (a.initializer && ts.isJsxExpression(a.initializer) && a.initializer.expression) {
          const found = collectSentinels(a.initializer.expression)
          if (found.invalid) {
            err('AT016', nodeSpan(found.invalid.node), found.invalid.reason)
            return null
          }
          sents.push(...found.sents)
        }
      } else if (ts.isJsxSpreadAttribute(a)) {
        const inSpread = collectSentinels(a.expression)
        const first = inSpread.sents[0] ?? inSpread.invalid?.node
        if (first) {
          err('AT016', nodeSpan(first), 'inside a spread')
          return null
        }
      }
    }
    if (sents.length > 1) {
      err('AT015', nodeSpan(sents[1]))
      return null
    }
    if (sents.length === 1) {
      const sent = sents[0]
      return {
        ...base,
        openTag: `<${name} ${code.slice(attrsNode.pos, sent.getStart(sf)).trimStart()}`,
        closeTag: `${code.slice(sent.end, attrsNode.end).trimEnd()} />`,
        slotted: true,
        sentinelStart: sent.getStart(sf),
        sentinelEnd: sent.end,
      }
    }
    const attrsText = code.slice(attrsNode.pos, attrsNode.end).trim()
    return {
      ...base,
      openTag: attrsText ? `<${name} ${attrsText}>` : `<${name}>`,
      closeTag: `</${name}>`,
    }
  }

  /**
   * Classify a decorator in a declaration/return position into a Directive.
   * @param {import('typescript').Decorator} dec
   */
  function classifyDecorator(dec) {
    const e = dec.expression
    const atPos = start(dec)
    if (ts.isIdentifier(e) || ts.isPropertyAccessExpression(e)) {
      const name = e.getText(sf)
      if (!isCapitalized(lastSegment(name))) {
        err('AT003', nodeSpan(dec), name)
        return null
      }
      return {
        form: 'bare',
        atPos,
        end: dec.end,
        name,
        openTag: `<${name}>`,
        closeTag: `</${name}>`,
      }
    }
    if (ts.isCallExpression(e)) {
      const callee = e.expression
      if (!(ts.isIdentifier(callee) || ts.isPropertyAccessExpression(callee))) {
        err('AT012', nodeSpan(dec), e.getText(sf).slice(0, 40))
        return null
      }
      const name = callee.getText(sf)
      if (!isCapitalized(lastSegment(name))) {
        err('AT003', nodeSpan(dec), name)
        return null
      }
      const arg = e.arguments.length === 1 ? e.arguments[0] : undefined
      if (!arg || !ts.isObjectLiteralExpression(arg)) {
        err('AT008', nodeSpan(dec))
        return null
      }
      const attrs = []
      /** @type {{ pre: string, post: string, sent: import('typescript').Identifier } | null} */
      let slot = null
      let slotAt = -1
      for (const p of arg.properties) {
        if (ts.isPropertyAssignment(p)) {
          let attrName = null
          if (ts.isIdentifier(p.name)) attrName = p.name.text
          else if (ts.isStringLiteral(p.name) && /^[A-Za-z_][\w-]*$/.test(p.name.text)) {
            attrName = p.name.text
          }
          if (attrName == null) {
            err('AT009', nodeSpan(p), `"${p.name.getText(sf)}"`)
            return null
          }
          if (sentinelNames.has(attrName)) {
            err('AT016', nodeSpan(p.name), 'a property name')
            return null
          }
          const found = collectSentinels(p.initializer)
          if (found.invalid) {
            err('AT016', nodeSpan(found.invalid.node), found.invalid.reason)
            return null
          }
          const sents = found.sents
          if (sents.length > 0) {
            if (slot || sents.length > 1) {
              err('AT015', nodeSpan(slot ? sents[0] : sents[1]))
              return null
            }
            slot = {
              pre: `${attrName}={${code.slice(p.initializer.getStart(sf), sents[0].getStart(sf))}`,
              post: `${code.slice(sents[0].end, p.initializer.end)}}`,
              sent: sents[0],
            }
            slotAt = attrs.length
          } else {
            attrs.push(`${attrName}={${p.initializer.getText(sf)}}`)
          }
        } else if (ts.isShorthandPropertyAssignment(p)) {
          if (sentinelNames.has(p.name.text)) {
            err('AT016', nodeSpan(p), 'a shorthand property')
            return null
          }
          attrs.push(`${p.name.text}={${p.name.text}}`)
        } else if (ts.isSpreadAssignment(p)) {
          const inSpread = collectSentinels(p.expression)
          const first = inSpread.sents[0] ?? inSpread.invalid?.node
          if (first) {
            err('AT016', nodeSpan(first), 'inside a spread')
            return null
          }
          attrs.push(`{...${p.expression.getText(sf)}}`)
        } else {
          err('AT009', nodeSpan(p), `"${p.getText(sf).slice(0, 40)}"`)
          return null
        }
      }
      const hasKeyAttr = arg.properties.some(
        (p) =>
          (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'key') ||
          (ts.isShorthandPropertyAssignment(p) && p.name.text === 'key'),
      )
      if (slot) {
        const before = attrs.slice(0, slotAt).join(' ')
        const after = attrs.slice(slotAt).join(' ')
        return {
          form: 'call',
          atPos,
          end: dec.end,
          name,
          openTag: `<${name}${before ? ` ${before}` : ''} ${slot.pre}`,
          closeTag: `${slot.post}${after ? ` ${after}` : ''} />`,
          slotted: true,
          sentinelStart: slot.sent.getStart(sf),
          sentinelEnd: slot.sent.end,
          hasKeyAttr,
        }
      }
      return {
        form: 'call',
        atPos,
        end: dec.end,
        name,
        openTag: attrs.length ? `<${name} ${attrs.join(' ')}>` : `<${name}>`,
        closeTag: `</${name}>`,
        hasKeyAttr,
      }
    }
    if (ts.isParenthesizedExpression(e)) {
      const info = fromJsxWrapper(e.expression)
      if (!info) return null
      return { form: 'jsx', atPos, end: dec.end, ...info }
    }
    err('AT012', nodeSpan(dec), e.getText(sf).slice(0, 40))
    return null
  }

  /** Map decorators to directives; null when any classification failed (errors recorded). */
  function mapDirectives(decs) {
    const out = []
    for (const d of decs) {
      const dir = classifyDecorator(d)
      if (!dir) return null
      out.push(dir)
    }
    return out
  }

  /**
   * @param {import('typescript').Statement} st
   * @param {import('typescript').Decorator[]} decs
   * @param {readonly import('typescript').ModifierLike[]} mods
   * @param {Set<string>} localNames
   */
  function handleDecoratedDeclaration(st, decs, mods, localNames) {
    // No diagnostic consumption here: decorated declarations parse with ZERO
    // diagnostics (measured), so any parse error in this span is a real one.
    const exportKw = mods.find((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    const defaultKw = mods.find((m) => m.kind === ts.SyntaxKind.DefaultKeyword)

    let kind, name, nameStart, nameEnd
    if (ts.isFunctionDeclaration(st)) {
      if (!st.name) {
        err('AT005', nodeSpan(st))
        return
      }
      if (!st.body) {
        err('AT006', nodeSpan(st))
        return
      }
      kind = 'function-decl'
      name = st.name.text
      nameStart = start(st.name)
      nameEnd = st.name.end
    } else if (ts.isVariableStatement(st)) {
      const decls = st.declarationList.declarations
      const d = decls.length === 1 ? decls[0] : undefined
      if (
        !d ||
        !ts.isIdentifier(d.name) ||
        !d.initializer ||
        !(ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))
      ) {
        err('AT006', nodeSpan(st))
        return
      }
      kind = 'const-arrow'
      name = d.name.text
      nameStart = start(d.name)
      nameEnd = d.name.end
    } else {
      err('AT006', nodeSpan(st))
      return
    }
    if (!isCapitalized(name)) {
      err('AT004', nodeSpan(st), name)
      return
    }
    if (localNames.has(`${name}_base`)) {
      err('AT014', nodeSpan(st), `${name}_base`)
      return
    }
    const directives = mapDirectives(decs)
    if (!directives) return

    let usesProps = false
    const checkProps = (n) => {
      if (ts.isIdentifier(n) && n.text === 'props') usesProps = true
      ts.forEachChild(n, checkProps)
    }
    for (const dec of decs) checkProps(dec.expression)

    groups.push({
      placement: 'declaration',
      directives,
      removeSpan: { start: start(decs[0]), end: skipWs(decs[decs.length - 1].end) },
      target: {
        kind,
        name,
        nameStart,
        nameEnd,
        stmtEnd: st.end,
        exported: !!exportKw,
        isDefault: !!defaultKw,
        exportRemoveSpan: exportKw
          ? { start: start(exportKw), end: skipWs((defaultKw ?? exportKw).end) }
          : undefined,
        usesProps,
      },
    })
  }

  /**
   * @param {readonly import('typescript').Statement[]} statements
   * @param {number} containerEnd
   */
  function visitStatements(statements, containerEnd) {
    const localNames = new Set()
    for (const st of statements) {
      if (ts.isFunctionDeclaration(st) && st.name) localNames.add(st.name.text)
      else if (ts.isClassDeclaration(st) && st.name) localNames.add(st.name.text)
      else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name)) localNames.add(d.name.text)
        }
      }
    }

    /** @type {import('typescript').Decorator[]} */
    let pending = []
    let pendingStart = -1
    for (const st of statements) {
      const mods = /** @type {readonly import('typescript').ModifierLike[] | undefined} */ (
        /** @type {*} */ (st).modifiers
      )
      const decs = mods ? mods.filter(ts.isDecorator) : []

      if (st.kind === ts.SyntaxKind.MissingDeclaration && decs.length > 0) {
        if (pending.length === 0) pendingStart = start(decs[0])
        pending.push(...decs)
        continue
      }

      if (pending.length > 0) {
        const pendingEnd = pending[pending.length - 1].end
        if (ts.isReturnStatement(st)) {
          consumedSpans.push({ start: pendingStart, end: st.end, codes: [1146] })
          if (!st.expression) {
            err('AT011', { start: pendingStart, end: pendingEnd })
          } else {
            const directives = mapDirectives(pending)
            if (directives) {
              const expr = st.expression
              // Key hoist: a top-level `key` on the returned element (the natural
              // map-callback shape, and where the virtualized react/jsx-key lint
              // sees it) belongs on the emitted OUTERMOST wrapper — the actual
              // array element. Recorded here (the scanner owns the AST); the
              // transform skips the hoist when the outermost wrapper carries its
              // own key. Parens are unwrapped for DETECTION only — exprIsJsx and
              // the brace logic keep judging the raw expression.
              let exprKey
              let inner = expr
              while (ts.isParenthesizedExpression(inner)) inner = inner.expression
              const opening = ts.isJsxElement(inner)
                ? inner.openingElement
                : ts.isJsxSelfClosingElement(inner)
                  ? inner
                  : undefined
              if (opening) {
                const k = opening.attributes.properties.find(
                  (a) => ts.isJsxAttribute(a) && ts.isIdentifier(a.name) && a.name.text === 'key',
                )
                // span starts at pos (previous token end) so the removal also
                // swallows the whitespace before the attribute
                if (k)
                  exprKey = { start: k.pos, end: k.end, text: code.slice(k.getStart(sf), k.end) }
              }
              groups.push({
                placement: 'return',
                directives,
                removeSpan: { start: pendingStart, end: start(st) },
                exprStart: start(expr),
                exprEnd: expr.end,
                exprIsJsx:
                  ts.isJsxElement(expr) ||
                  ts.isJsxSelfClosingElement(expr) ||
                  ts.isJsxFragment(expr),
                exprKey,
              })
            }
          }
        } else {
          consumedSpans.push({ start: pendingStart, end: start(st) + 1 })
          err('AT007', { start: pendingStart, end: pendingEnd }, at007Hint(pendingStart))
        }
        pending = []
        pendingStart = -1
      }

      if (decs.length > 0 && st.kind !== ts.SyntaxKind.MissingDeclaration) {
        handleDecoratedDeclaration(st, decs, mods ?? [], localNames)
      }
    }
    if (pending.length > 0) {
      consumedSpans.push({ start: pendingStart, end: containerEnd })
      err(
        'AT007',
        { start: pendingStart, end: pending[pending.length - 1].end },
        at007Hint(pendingStart),
      )
    }
  }

  /** Bare `@<Card />` lands here via the MissingDeclaration route — point at the fix. */
  function at007Hint(atPos) {
    return code[atPos + 1] === '<' ? ' (JSX decorators need parentheses — write @(<Card />))' : ''
  }

  /**
   * Parse a directive chain inside JSX children starting at children[i] (a JsxText
   * containing '@('); returns the child index to continue scanning from.
   */
  function parseChain(children, i) {
    const dirs = []
    const first = children[i]
    const firstText = code.slice(first.pos, first.end)
    const atIdx = firstText.indexOf('@(')
    if (firstText.slice(atIdx + 2).trim() !== '' || firstText.slice(0, atIdx).includes('@(')) {
      err('AT001', { start: first.pos + atIdx, end: first.pos + atIdx + 2 })
      return i + 1
    }
    let atPos = first.pos + atIdx
    let idx = i + 1
    for (;;) {
      const w = children[idx]
      if (!w || !(ts.isJsxElement(w) || ts.isJsxSelfClosingElement(w))) {
        err('AT001', { start: atPos, end: atPos + 2 })
        return idx
      }
      const info = fromJsxWrapper(w)
      if (!info) return idx + 1
      const t = children[idx + 1]
      const tText = t && ts.isJsxText(t) ? code.slice(t.pos, t.end) : null
      const wsLen = tText === null ? 0 : (tText.match(/^\s*/)?.[0].length ?? 0)
      if (tText === null || tText[wsLen] !== ')') {
        err('AT001', { start: atPos, end: w.end })
        return idx + 1
      }
      const parenClose = t.pos + wsLen
      dirs.push({
        form: 'jsx',
        atPos,
        end: parenClose + 1,
        parenOpen: atPos + 1,
        parenClose,
        ...info,
      })
      const restBase = wsLen + 1
      const rest = tText.slice(restBase)
      const nextAt = rest.indexOf('@(')
      if (nextAt !== -1) {
        if (rest.slice(nextAt + 2).trim() !== '' || rest.slice(0, nextAt).trim() !== '') {
          err('AT001', { start: t.pos + restBase + nextAt, end: t.pos + restBase + nextAt + 2 })
          return idx + 2
        }
        atPos = t.pos + restBase + nextAt
        idx += 2
        continue
      }
      if (rest.trim() !== '') {
        err('AT013', { start: t.pos + restBase, end: t.end })
        return idx + 2
      }
      idx += 2
      break
    }
    // v1 restriction: a slotted wrapper relocates its target INSIDE its own attrs, so
    // it cannot share an in-tree chain (the in-place open/close conversion of the
    // other links would land outside the attribute). decl/return stacks compose fine.
    const slottedDirs = dirs.filter((d) => d.slotted)
    if (slottedDirs.length > 0 && dirs.length > 1) {
      err('AT017', { start: slottedDirs[0].atPos, end: slottedDirs[0].end })
      return idx
    }
    const isBlankText = (c) => ts.isJsxText(c) && code.slice(c.pos, c.end).trim() === ''
    const isEmptyExpr = (c) => ts.isJsxExpression(c) && c.expression === undefined
    while (idx < children.length && (isBlankText(children[idx]) || isEmptyExpr(children[idx])))
      idx++
    const target = children[idx]
    if (!target) {
      err('AT007', { start: dirs[0].atPos, end: dirs[dirs.length - 1].end })
      return idx
    }
    if (ts.isJsxText(target)) {
      err('AT013', { start: target.pos, end: target.end })
      return idx + 1
    }
    groups.push({
      placement: 'jsx-child',
      directives: dirs,
      target: { start: target.getStart(sf), end: target.end },
      targetExpr:
        ts.isJsxExpression(target) && target.expression
          ? { start: target.expression.getStart(sf), end: target.expression.end }
          : undefined,
    })
    return idx + 1
  }

  function processJsxChildren(children) {
    let i = 0
    while (i < children.length) {
      const c = children[i]
      if (!ts.isJsxText(c) || !code.slice(c.pos, c.end).includes('@(')) {
        i++
        continue
      }
      i = parseChain(children, i)
    }
  }

  /** @param {import('typescript').Node} node */
  function walk(node) {
    if (ts.isSourceFile(node) || ts.isBlock(node) || ts.isModuleBlock(node)) {
      visitStatements(node.statements, node.end)
    } else if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
      visitStatements(node.statements, node.end)
    } else if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      processJsxChildren(node.children)
    }
    ts.forEachChild(node, walk)
  }
  walk(sf)

  for (const d of sf.parseDiagnostics) {
    if (typeof d.start !== 'number') continue
    const consumed = consumedSpans.some(
      (s) => d.start >= s.start && d.start <= s.end && (!s.codes || s.codes.includes(d.code)),
    )
    if (consumed) continue
    let msg = ts.flattenDiagnosticMessageText(d.messageText, ' ')
    if (/@</.test(code.slice(Math.max(0, d.start - 8), d.start + 8))) {
      msg += ' (react-decor: JSX decorators need parentheses — write @(<Card />))'
    }
    errors.push(atError('AT000', { start: d.start, end: d.start + (d.length || 1) }, msg))
  }

  return { groups, errors, hasDirectives: groups.length > 0 }
}

module.exports = { scan }
