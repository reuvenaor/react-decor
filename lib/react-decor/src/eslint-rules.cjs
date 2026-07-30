'use strict'

/**
 * react-decor ESLint rules — the decorator footguns neither the grammar (scan AT errors)
 * nor the type system (at-tsc) can catch. They run on the VIRTUALIZED AST the react-decor
 * parser produces: decl/return directives are `!X({...})` (call form) or `;(<X />)`
 * (JSX form) expression statements immediately preceding their target, so directive
 * position is recovered by walking statement bodies — a chain landing on a declaration
 * is declaration-position; on a return statement, return-position.
 *
 * Two rules are decorator-specific (declaration-position semantics); two are general
 * React hygiene that also apply to plain .tsx (key/t threaded through props).
 */

const CAP = /^[A-Z]/

/** Last segment of a callee ('Ui.Card' → 'Card'), or null. */
function calleeLast(node) {
  if (node.type === 'Identifier') return node.name
  if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }
  return null
}

/** Non-computed property name of an ObjectExpression Property, or null. */
function propName(p) {
  if (p.type !== 'Property' || p.computed) return null
  if (p.key.type === 'Identifier') return p.key.name
  if (p.key.type === 'Literal' && typeof p.key.value === 'string') return p.key.value
  return null
}

/**
 * Classify a statement as a virtualized directive:
 * `!Card({ … })` → call form; `(<Card … />)` → JSX form; `Card` → bare form.
 */
function asDirective(stmt) {
  if (stmt.type !== 'ExpressionStatement') return null
  const e = stmt.expression
  if (
    e.type === 'UnaryExpression' &&
    e.operator === '!' &&
    e.argument.type === 'CallExpression' &&
    e.argument.arguments.length === 1 &&
    e.argument.arguments[0].type === 'ObjectExpression'
  ) {
    const name = calleeLast(e.argument.callee)
    if (name && CAP.test(name)) return { kind: 'call', object: e.argument.arguments[0] }
  }
  if (e.type === 'JSXElement') {
    const tag = e.openingElement.name
    const name =
      tag.type === 'JSXIdentifier'
        ? tag.name
        : tag.type === 'JSXMemberExpression'
          ? tag.property.name
          : null
    if (name && CAP.test(name)) return { kind: 'jsx', element: e }
  }
  if (e.type === 'Identifier' && CAP.test(e.name)) return { kind: 'bare' }
  return null
}

/** Does this statement declare something a decl-position decorator can target? */
function isDeclarationTarget(stmt) {
  if (!stmt) return false
  switch (stmt.type) {
    case 'FunctionDeclaration':
    case 'VariableDeclaration':
    case 'ClassDeclaration':
      return true
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      return isDeclarationTarget(stmt.declaration)
    default:
      return false
  }
}

/**
 * Visit every directive chain in a statement body. cb(directives, position, target)
 * with position 'declaration' | 'return' | null (unknown / dangling — AT007 case).
 */
function walkChains(body, cb) {
  let pending = []
  for (const stmt of body) {
    if (stmt.type === 'EmptyStatement') continue
    const d = asDirective(stmt)
    if (d) {
      pending.push(d)
      continue
    }
    if (pending.length > 0) {
      const position = isDeclarationTarget(stmt)
        ? 'declaration'
        : stmt.type === 'ReturnStatement'
          ? 'return'
          : null
      cb(pending, position, stmt)
      pending = []
    }
  }
  if (pending.length > 0) cb(pending, null, null)
}

/** Body-walking visitor set shared by the directive rules. `local` marks non-module
 * containers (function bodies etc.) for rules that care where a chain lives. The
 * scanner's walk also enters namespace bodies (ts.isModuleBlock), so the ESTree
 * side must too — without TSModuleBlock, a valid directive inside a `namespace`
 * was invisible to every directive rule and no-stray-at-sentinel (fail-closed)
 * false-positived on its $at. A namespace body evaluates once at module load,
 * so it is NOT `local` — namespace-level atoms have stable identity. */
function chainVisitors(run) {
  return {
    Program: (n) => run(n.body, false),
    TSModuleBlock: (n) => run(n.body, false),
    BlockStatement: (n) => run(n.body, true),
    SwitchCase: (n) => run(n.consequent, true),
  }
}

/** Is this a function-valued node whose first param destructures an object? */
function isPropsSelectorShape(v) {
  return (
    (v.type === 'ArrowFunctionExpression' || v.type === 'FunctionExpression') &&
    v.params.length > 0 &&
    v.params[0].type === 'ObjectPattern'
  )
}

/**
 * The Program's target-slot sentinel names: every local binding of the `$at`
 * export of 'react-decor' (aliases included), falling back to the literal `$at`
 * when no such import exists — mirrors the scanner's resolution.
 */
function sentinelNamesOf(programBody) {
  const names = new Set()
  for (const st of programBody) {
    if (st.type !== 'ImportDeclaration' || st.source.value !== 'react-decor') continue
    for (const s of st.specifiers) {
      if (s.type !== 'ImportSpecifier') continue
      const imported = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value
      if (imported === '$at') names.add(s.local.name)
    }
  }
  if (names.size === 0) names.add('$at')
  return names
}

/** Does an expression subtree reference one of the target-slot sentinel names? */
function containsSentinel(node, names) {
  return referenceIdentifiers(node, [], null).some((id) => names.has(id.name))
}

/**
 * Resolve a node to a component function: a capitalized FunctionDeclaration, or a
 * capitalized const initialized with an arrow / function expression.
 */
function componentOf(node) {
  if (node.type === 'FunctionDeclaration' && node.id && CAP.test(node.id.name)) return node
  if (
    node.type === 'VariableDeclarator' &&
    node.id.type === 'Identifier' &&
    CAP.test(node.id.name) &&
    node.init &&
    (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
  ) {
    return node.init
  }
  return null
}

/**
 * Report banned prop names on a component's first parameter — both the destructuring
 * pattern and an inline type literal. `alsoTypeRef` additionally flags any member
 * whose type annotation references that type name (e.g. TFunction), whatever the
 * member is called.
 */
function checkBannedProp(context, fn, banned, messageId, alsoTypeRef) {
  const p0 = fn.params[0]
  if (!p0) return
  const seen = new Set()
  if (p0.type === 'ObjectPattern') {
    for (const prop of p0.properties) {
      const name = propName(prop)
      if (name === banned) {
        seen.add(name)
        context.report({ node: prop, messageId })
      }
    }
  }
  const ann = p0.typeAnnotation && p0.typeAnnotation.typeAnnotation
  if (ann && ann.type === 'TSTypeLiteral') {
    for (const m of ann.members) {
      if (m.type !== 'TSPropertySignature' || m.computed) continue
      const name = m.key.type === 'Identifier' ? m.key.name : null
      if (name && seen.has(name)) continue
      const mt = m.typeAnnotation && m.typeAnnotation.typeAnnotation
      const isTypeRef =
        alsoTypeRef &&
        mt &&
        mt.type === 'TSTypeReference' &&
        mt.typeName.type === 'Identifier' &&
        mt.typeName.name === alsoTypeRef
      if (name === banned || isTypeRef) context.report({ node: m, messageId })
    }
  }
}

/** Props Radix Slot injects through the clone — a post-spread clobber drops them. */
function isSlotInjected(name) {
  return name === 'className' || name === 'style' || name === 'ref' || /^on[A-Z]/.test(name)
}

/** Does any non-TS subtree node satisfy pred? (reference-position walk helper) */
function subtreeSome(node, pred) {
  if (!node || typeof node.type !== 'string') return false
  if (node.type.startsWith('TS')) return false
  if (pred(node)) return true
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue
    const v = node[key]
    if (Array.isArray(v)) {
      for (const c of v) if (subtreeSome(c, pred)) return true
    } else if (v && typeof v.type === 'string' && subtreeSome(v, pred)) {
      return true
    }
  }
  return false
}

/**
 * The props-forwarding escape for the Slot boundary: does this component spread
 * its first param (whole, or the ObjectPattern rest) onto the root element of
 * EVERY return? A forwarding base passes Slot's injected className / style /
 * handlers / ref through to its root, so the clone boundary is sound. (ref
 * rides the props spread only on React 19's ref-as-prop — on React 18 the
 * injected ref is dropped; see the rule message.)
 *
 * Fail-closed refinements (each closed a silent-breakage bypass):
 * - a named attr AFTER the spread whose name Slot injects clobbers the
 *   injection — exempt only when its value re-reads that prop from the param
 *   (the `className={cn('x', p.className)}` merge shape); trailing extra
 *   spreads stay exempt;
 * - every return statement (deep walk, nested functions excluded) must be a
 *   forwarding root or a bare `null`/`undefined` — a branch return can't hide;
 * - a destructured Slot-injected key never reaches the rest spread — it must
 *   be re-read somewhere in the root's attributes (the re-apply merge).
 */
function forwardsPropsToRoot(fn) {
  const p0 = fn.params[0]
  if (!p0) return false
  let name = null
  /** @type {{ key: string, local: string | null }[]} */
  const destructuredInjected = []
  if (p0.type === 'Identifier') name = p0.name
  else if (p0.type === 'ObjectPattern') {
    const rest = p0.properties.find((x) => x.type === 'RestElement')
    if (rest && rest.argument.type === 'Identifier') name = rest.argument.name
    for (const prop of p0.properties) {
      if (prop.type !== 'Property') continue
      const key = propName(prop)
      if (key && isSlotInjected(key)) {
        destructuredInjected.push({
          key,
          local: prop.value.type === 'Identifier' ? prop.value.name : null,
        })
      }
    }
  }
  if (!name) return false

  const readsParamProp = (node, key) => {
    const local = destructuredInjected.find((d) => d.key === key)?.local ?? null
    return subtreeSome(node, (n) => {
      if (
        n.type === 'MemberExpression' &&
        !n.computed &&
        n.object.type === 'Identifier' &&
        n.object.name === name &&
        n.property.type === 'Identifier' &&
        n.property.name === key
      ) {
        return true
      }
      return local != null && n.type === 'Identifier' && n.name === local
    })
  }

  const forwardingRoot = (root) => {
    if (!root || root.type !== 'JSXElement') return false
    const attrs = root.openingElement.attributes
    const spreadAt = attrs.findIndex(
      (a) =>
        a.type === 'JSXSpreadAttribute' &&
        a.argument.type === 'Identifier' &&
        a.argument.name === name,
    )
    if (spreadAt === -1) return false
    for (let i = spreadAt + 1; i < attrs.length; i++) {
      const a = attrs[i]
      if (a.type !== 'JSXAttribute' || a.name.type !== 'JSXIdentifier') continue
      if (!isSlotInjected(a.name.name)) continue
      if (!a.value || a.value.type !== 'JSXExpressionContainer') return false
      if (!readsParamProp(a.value.expression, a.name.name)) return false
    }
    for (const d of destructuredInjected) {
      if (d.local == null) return false
      const reapplied = attrs.some(
        (a) =>
          a.type === 'JSXAttribute' &&
          a.value &&
          a.value.type === 'JSXExpressionContainer' &&
          subtreeSome(a.value.expression, (n) => n.type === 'Identifier' && n.name === d.local),
      )
      if (!reapplied) return false
    }
    return true
  }

  const isNullish = (e) =>
    !e ||
    (e.type === 'Literal' && e.value === null) ||
    (e.type === 'Identifier' && e.name === 'undefined')

  if (fn.body.type !== 'BlockStatement') return forwardingRoot(fn.body)
  /** @type {import('estree').ReturnStatement[]} */
  const returns = []
  const collect = (node) => {
    if (!node || typeof node.type !== 'string') return
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      return // nested scopes own their returns
    }
    if (node.type === 'ReturnStatement') returns.push(node)
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue
      const v = node[key]
      if (Array.isArray(v)) for (const c of v) collect(c)
      else if (v && typeof v.type === 'string') collect(v)
    }
  }
  collect(fn.body)
  if (returns.length === 0) return false
  return returns.every((r) => isNullish(r.argument) || forwardingRoot(r.argument))
}

/** Resolve a chain-target statement to its component function (unwraps exports). */
function targetComponentFn(stmt) {
  if (!stmt) return null
  if (stmt.type === 'ExportNamedDeclaration' || stmt.type === 'ExportDefaultDeclaration') {
    return targetComponentFn(stmt.declaration)
  }
  if (stmt.type === 'FunctionDeclaration') return componentOf(stmt)
  if (stmt.type === 'VariableDeclaration') {
    const d = stmt.declarations.length === 1 ? stmt.declarations[0] : null
    return d ? componentOf(d) : null
  }
  return null
}

/** Does a directive carry an asChild attr/property (the irreducible Slot pair)? */
function hasAsChild(d) {
  if (d.kind === 'call') {
    return d.object.properties.some((p) => propName(p) === 'asChild')
  }
  if (d.kind === 'jsx') {
    return d.element.openingElement.attributes.some(
      (a) => a.type === 'JSXAttribute' && a.name.name === 'asChild',
    )
  }
  return false
}

/** The attr-expression nodes of a directive (call property values / JSX attr values). */
function attrExpressions(d) {
  const out = []
  if (d.kind === 'call') {
    for (const p of d.object.properties) {
      if (p.type === 'Property') out.push(p.value)
      else if (p.type === 'SpreadElement') out.push(p.argument)
    }
  } else if (d.kind === 'jsx') {
    for (const a of d.element.openingElement.attributes) {
      if (a.type === 'JSXAttribute') {
        if (a.value && a.value.type === 'JSXExpressionContainer') out.push(a.value.expression)
      } else if (a.type === 'JSXSpreadAttribute') {
        out.push(a.argument)
      }
    }
  }
  return out
}

/** Collect Identifier nodes in REFERENCE position within an expression subtree. */
function referenceIdentifiers(node, out, parent) {
  if (!node || typeof node.type !== 'string') return out
  if (node.type === 'Identifier') {
    const skip =
      (parent &&
        ((parent.type === 'Property' && parent.key === node && !parent.computed) ||
          (parent.type === 'MemberExpression' && parent.property === node && !parent.computed))) ||
      (parent && parent.type.startsWith('TS'))
    if (!skip) out.push(node)
    return out
  }
  if (node.type.startsWith('TS')) return out
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue
    const v = node[key]
    if (Array.isArray(v)) {
      for (const c of v) referenceIdentifiers(c, out, node)
    } else if (v && typeof v.type === 'string') {
      referenceIdentifiers(v, out, node)
    }
  }
  return out
}

/**
 * Does this identifier reference resolve to a binding in some FUNCTION scope outside
 * the attr expression itself (i.e. the enclosing component's params/hooks/locals)?
 * Module-scope, import, global, and attr-internal bindings all count as static.
 */
function isComponentScopeRef(src, id, attrRange) {
  let scope = src.getScope(id)
  let ref = null
  while (scope && !ref) {
    ref = scope.references.find((r) => r.identifier === id) || null
    if (!ref) scope = scope.upper
  }
  const resolved = ref && ref.resolved
  if (!resolved || resolved.defs.length === 0) return false
  const def = resolved.defs[0]
  if (def.node.range[0] >= attrRange[0] && def.node.range[1] <= attrRange[1]) return false
  const vs = resolved.scope.variableScope
  return vs.type !== 'module' && vs.type !== 'global'
}

/** Visitor set shared by the two prop-hygiene rules. */
function componentVisitors(check) {
  return {
    FunctionDeclaration(node) {
      const fn = componentOf(node)
      if (fn) check(fn)
    },
    VariableDeclarator(node) {
      const fn = componentOf(node)
      if (fn) check(fn)
    },
  }
}

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
const rules = {
  'no-aschild-decl-decorator': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow asChild in declaration-position decorators (Radix Slot clones the generated base component and the injected props are dropped)',
      },
      schema: [],
      messages: {
        aschildDecl:
          'asChild in a declaration-position decorator breaks Radix Slot: Slot clones the emitted <X_base {...props}/> and the injected className/handlers are silently dropped. Either make the component forward — spread its props onto the root element of every return, without clobbering an injected prop (className/style/ref/on*) after the spread (merge instead: className={cn("x", p.className)}) — which exempts the innermost directive; or move the wrapper stack to a return-position directive so the Slot child stays a literal element (see the react-decor README, "The Slot boundary"). Note the forwarding pattern carries the injected ref only on React 19 (ref-as-prop); on React 18 the ref is dropped.',
      },
    },
    create(context) {
      const run = (body) =>
        walkChains(body, (dirs, position, target) => {
          if (position !== 'declaration') return
          // Forwarding escape: the INNERMOST directive's child is the generated
          // <X_base {...props}/> — when the base spreads its props onto its root,
          // Slot's injection flows through that boundary. Outer links still break
          // (their child is another wrapper element, never the base).
          const fn = targetComponentFn(target)
          const forwarding = fn ? forwardsPropsToRoot(fn) : false
          dirs.forEach((d, i) => {
            if (forwarding && i === dirs.length - 1) return
            if (d.kind === 'call') {
              for (const p of d.object.properties) {
                if (propName(p) === 'asChild') {
                  context.report({ node: p, messageId: 'aschildDecl' })
                }
              }
            } else if (d.kind === 'jsx') {
              for (const a of d.element.openingElement.attributes) {
                if (a.type === 'JSXAttribute' && a.name.name === 'asChild') {
                  context.report({ node: a, messageId: 'aschildDecl' })
                }
              }
            }
          })
        })
      return chainVisitors(run)
    },
  },

  'no-props-selector-decl': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow props-selector functions in declaration-position decorator args (decl args are module-scope only; the function itself becomes the prop)',
      },
      schema: [],
      messages: {
        propsSelector:
          'Declaration-position decorator args are module-scope only — a function like ({ to }) => to is passed to the wrapper AS the prop, never evaluated with props. Use a return-position directive inside the component (full scope), or fully-static specialized atoms (WorkBackLink / InsightsBackLink pattern). Functions carrying the $at sentinel are exempt — the transform rewrites those. A genuine render-prop attr can disable this line with a reason.',
      },
    },
    create(context) {
      const names = sentinelNamesOf(context.sourceCode.ast.body)
      const run = (body) =>
        walkChains(body, (dirs, position) => {
          if (position !== 'declaration') return
          for (const d of dirs) {
            if (d.kind === 'call') {
              for (const p of d.object.properties) {
                if (
                  p.type === 'Property' &&
                  isPropsSelectorShape(p.value) &&
                  !containsSentinel(p.value, names)
                ) {
                  context.report({ node: p.value, messageId: 'propsSelector' })
                }
              }
            } else if (d.kind === 'jsx') {
              for (const a of d.element.openingElement.attributes) {
                if (
                  a.type === 'JSXAttribute' &&
                  a.value &&
                  a.value.type === 'JSXExpressionContainer' &&
                  isPropsSelectorShape(a.value.expression) &&
                  !containsSentinel(a.value.expression, names)
                ) {
                  context.report({ node: a.value.expression, messageId: 'propsSelector' })
                }
              }
            }
          }
        })
      return chainVisitors(run)
    },
  },

  'no-key-prop': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow key as a component prop (React reserves it; the value arrives undefined and dev builds log a console error)',
      },
      schema: [],
      messages: {
        keyProp:
          '`key` is not a component prop — React reserves it, delivers undefined, and dev builds log a console error on access (tripping the zero-console e2e gate). Keep the key on the map callsite element (<Tile key={item.slug} …/>) and drop it from the props.',
      },
    },
    create(context) {
      return componentVisitors((fn) => checkBannedProp(context, fn, 'key', 'keyProp', null))
    },
  },

  'no-t-prop': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow threading the i18next t function through component props — call useTranslation() inside the component',
      },
      schema: [],
      messages: {
        tProp:
          "Don't thread `t` through props — call useTranslation() inside the component (i18next context re-renders it on language change). Zero-prop atoms keep callsites wiring-free.",
      },
    },
    create(context) {
      return componentVisitors((fn) => checkBannedProp(context, fn, 't', 'tProp', 'TFunction'))
    },
  },

  'no-static-return-directive': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow return-position directives whose attrs read nothing from the enclosing scope — a static wrapper belongs on a declaration (its own decl atom)',
      },
      schema: [],
      messages: {
        staticReturn:
          'This wrapper reads nothing from the enclosing component (no props, hooks, or locals in its attrs) — lift it to the declaration: decorate the component itself or peel it into its own decl-form atom. Return position is for wrappers that need function scope; the one exception, asChild over its literal child, is already exempt.',
      },
    },
    create(context) {
      const src = context.sourceCode
      const run = (body) =>
        walkChains(body, (dirs, position) => {
          if (position !== 'return') return
          for (const d of dirs) {
            if (hasAsChild(d)) continue
            const exprs = attrExpressions(d)
            const dynamic = exprs.some((e) => {
              const ids = referenceIdentifiers(e, [], null)
              return ids.some((id) => isComponentScopeRef(src, id, e.range))
            })
            if (!dynamic) {
              const node = d.kind === 'call' ? d.object : d.kind === 'jsx' ? d.element : null
              if (node) context.report({ node, messageId: 'staticReturn' })
            }
          }
        })
      return chainVisitors(run)
    },
  },

  'no-local-atom': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow decorated declarations inside function bodies — a local component gets a new identity every render, so React remounts its whole subtree on every parent re-render',
      },
      schema: [],
      messages: {
        localAtom:
          'This decorated component is declared inside a function: every parent render creates a new component identity and React REMOUNTS its entire subtree, resetting all of its state. Hoist it to module scope and pass what it closes over as props.',
      },
    },
    create(context) {
      const run = (body, local) =>
        walkChains(body, (dirs, position, target) => {
          if (!local || position !== 'declaration') return
          context.report({ node: target, messageId: 'localAtom' })
        })
      return chainVisitors(run)
    },
  },

  'no-passthrough-atom': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow undecorated components whose entire body renders one bare atom — pass-through indirection to delete (the wrapper should ride the consumer instead)',
      },
      schema: [],
      messages: {
        passthrough:
          'This component carries no wrapper and only renders <{{inner}} /> — pass-through indirection. Delete it: render {{inner}} directly, or move the wrapper it was hosting onto this declaration / the consuming return.',
      },
    },
    create(context) {
      const decorated = new Set()
      const candidates = []

      function declaredNames(stmt) {
        if (!stmt) return []
        if (stmt.type === 'ExportNamedDeclaration' || stmt.type === 'ExportDefaultDeclaration') {
          return declaredNames(stmt.declaration)
        }
        if (stmt.type === 'FunctionDeclaration' && stmt.id) return [stmt.id.name]
        if (stmt.type === 'VariableDeclaration') {
          return stmt.declarations.filter((d) => d.id.type === 'Identifier').map((d) => d.id.name)
        }
        return []
      }

      /** Bare pass-through body: exactly `<Inner />` — capitalized, no attrs/children. */
      function bareInner(fn) {
        let expr = null
        if (fn.body.type === 'JSXElement') expr = fn.body
        else if (
          fn.body.type === 'BlockStatement' &&
          fn.body.body.length === 1 &&
          fn.body.body[0].type === 'ReturnStatement'
        ) {
          expr = fn.body.body[0].argument
        }
        if (!expr || expr.type !== 'JSXElement') return null
        const open = expr.openingElement
        if (open.attributes.length > 0) return null
        const hasContent = expr.children.some(
          (c) => !(c.type === 'JSXText' && c.value.trim() === ''),
        )
        if (hasContent) return null
        if (open.name.type !== 'JSXIdentifier' || !CAP.test(open.name.name)) return null
        return { node: expr, inner: open.name.name }
      }

      const run = (body) =>
        walkChains(body, (dirs, position, target) => {
          if (position === 'declaration') {
            for (const n of declaredNames(target)) decorated.add(n)
          }
        })

      return {
        ...chainVisitors(run),
        FunctionDeclaration(node) {
          const fn = componentOf(node)
          if (fn && fn.params.length === 0) candidates.push({ name: node.id.name, fn })
        },
        VariableDeclarator(node) {
          const fn = componentOf(node)
          if (fn && fn.params.length === 0) candidates.push({ name: node.id.name, fn })
        },
        'Program:exit'() {
          for (const c of candidates) {
            if (decorated.has(c.name)) continue
            const bare = bareInner(c.fn)
            if (bare) {
              context.report({
                node: bare.node,
                messageId: 'passthrough',
                data: { inner: bare.inner },
              })
            }
          }
        },
      }
    },
  },

  'no-stray-at-sentinel': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'disallow the $at target-slot sentinel outside directive arguments — as a real identifier its runtime value is undefined (an in-tree-directive-shaped {<Cap …/>} container is exempt, since the virtualized AST cannot tell the two apart)',
      },
      schema: [],
      messages: {
        strayAt:
          '`$at` only has meaning inside decorator arguments, where the transform replaces it with the decorated target — here it is a real identifier whose runtime value is undefined. Move it into a directive, or rename the local.',
      },
    },
    create(context) {
      const names = sentinelNamesOf(context.sourceCode.ast.body)
      /** @type {[number, number][]} */
      const directiveRanges = []
      const sentinels = []
      const run = (body) =>
        walkChains(body, (dirs) => {
          for (const d of dirs) {
            if (d.kind === 'call') directiveRanges.push(d.object.range)
            else if (d.kind === 'jsx') directiveRanges.push(d.element.range)
          }
        })
      return {
        ...chainVisitors(run),
        JSXExpressionContainer(node) {
          // the virtual in-tree directive shape: { <Cap … /> } — childless, capitalized
          const e = node.expression
          if (!e || e.type !== 'JSXElement') return
          const tag = e.openingElement.name
          const name =
            tag.type === 'JSXIdentifier'
              ? tag.name
              : tag.type === 'JSXMemberExpression'
                ? tag.property.name
                : null
          const childless = e.children.every((c) => c.type === 'JSXText' && c.value.trim() === '')
          if (name && CAP.test(name) && childless) directiveRanges.push(node.range)
        },
        Identifier(node) {
          if (!names.has(node.name)) return
          const p = node.parent
          if (!p) return
          if (p.type === 'ImportSpecifier' || p.type === 'ExportSpecifier') return
          if (p.type === 'Property' && p.key === node && !p.computed) return
          if (p.type === 'MemberExpression' && p.property === node && !p.computed) return
          if (p.type.startsWith('TS')) return
          sentinels.push(node)
        },
        'Program:exit'() {
          for (const id of sentinels) {
            const inDirective = directiveRanges.some(
              (r) => id.range[0] >= r[0] && id.range[1] <= r[1],
            )
            if (!inDirective) context.report({ node: id, messageId: 'strayAt' })
          }
        },
      }
    },
  },
}

module.exports = { rules }
