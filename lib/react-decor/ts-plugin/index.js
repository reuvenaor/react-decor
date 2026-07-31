'use strict'

/**
 * react-decor tsserver plugin. The editor shows the RAW `@Card` text while the language
 * service sees the same-length virtualized text (`;Card` / `{ <Card/>}`), so every
 * position aligns 1:1: zero squiggles on directives, and hover / go-to-definition /
 * completions work INSIDE decorator expressions as real expressions. Malformed
 * directives (the AT catalog) are appended as semantic diagnostics from the raw scan.
 *
 * Wiring: tsconfig `"plugins": [{ "name": "react-decor-ts-plugin" }]` (optionally
 * `"filter": "\\.at\\.tsx$"`), with the editor using the WORKSPACE TypeScript.
 * Loaded via `require` by tsserver — plain CommonJS by design; the core comes from
 * the react-decor package (a real dependency, so the plugin packs/publishes standalone).
 */

const { scan } = require('react-decor/scan')
const { virtualize } = require('react-decor/virtualize')

/** @param {{ typescript: typeof import('typescript') }} modules */
function init(modules) {
  const ts = modules.typescript

  function create(info) {
    const filter =
      info.config && typeof info.config.filter === 'string'
        ? new RegExp(info.config.filter)
        : /\.at\.tsx$/

    const host = info.languageServiceHost
    const rawGet = host.getScriptSnapshot.bind(host)
    /** raw snapshot → virtual snapshot (per-version: keyed by the raw snapshot object) */
    const cache = new WeakMap()
    /** virtual snapshot → raw snapshot (so change ranges forward 1:1) */
    const rawOf = new WeakMap()

    host.getScriptSnapshot = (fileName) => {
      const snap = rawGet(fileName)
      if (!snap || !filter.test(fileName)) return snap
      let virt = cache.get(snap)
      if (!virt) {
        const raw = snap.getText(0, snap.getLength())
        const swapped = virtualize(raw, fileName).code
        virt = {
          getText: (s, e) => swapped.slice(s, e),
          getLength: () => swapped.length,
          getChangeRange: (old) => {
            // Same-length swaps → ranges computed on raw snapshots are valid verbatim.
            const oldRaw = rawOf.get(old) ?? old
            return typeof snap.getChangeRange === 'function'
              ? snap.getChangeRange(oldRaw)
              : undefined
          },
        }
        rawOf.set(virt, snap)
        cache.set(snap, virt)
      }
      return virt
    }

    const ls = info.languageService
    const proxy = Object.create(null)
    for (const k of Object.keys(ls)) {
      const v = ls[k]
      proxy[k] = typeof v === 'function' ? v.bind(ls) : v
    }
    proxy.getSemanticDiagnostics = (fileName) => {
      const base = ls.getSemanticDiagnostics(fileName)
      if (!filter.test(fileName)) return base
      const program = ls.getProgram ? ls.getProgram() : undefined
      const file = program ? program.getSourceFile(fileName) : undefined
      const snap = rawGet(fileName)
      if (!file || !snap) return base
      const raw = snap.getText(0, snap.getLength())
      const extra = scan(raw, fileName).errors.map((e) => ({
        file,
        start: e.span.start,
        length: Math.max(1, e.span.end - e.span.start),
        messageText: `[react-decor] ${e.code}: ${e.message}`,
        category: ts.DiagnosticCategory.Error,
        code: 90000 + Number(e.code.slice(2)),
        source: 'react-decor',
      }))
      return extra.length > 0 ? base.concat(extra) : base
    }
    return proxy
  }

  return { create }
}

module.exports = init
