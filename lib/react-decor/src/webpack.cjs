'use strict'

/**
 * react-decor webpack loader — the webpack/Turbopack analog of the Vite plugin: a
 * source→source transform (TSX in, TSX out) that must run before the TS/JSX
 * compiler parses the file (raw `@` directives are not valid input for SWC/tsc).
 *
 * webpack — register as a pre-loader so it runs before the framework's TSX rule:
 *   { test: /\.at\.tsx$/, enforce: 'pre', use: 'react-decor/webpack' }
 *
 * Turbopack (next.config.ts) — the rule transforms and re-enters the normal
 * TSX pipeline via `as`:
 *   turbopack: { rules: { '*.at.tsx': { loaders: ['react-decor/webpack'], as: '*.tsx' } } }
 *
 * Like every react-decor entry the whole require chain is plain CommonJS that any
 * Node runs with no build step; bundlers resolve the bare `'react-decor/webpack'`
 * string through the package exports map (precedent: `'graphql-tag/loader'`).
 */

const { AtBuildError, transform } = require('./transform.cjs')

/**
 * 1-based line:col for a raw-file offset. webpack renders no code frame for
 * loader errors, so the message itself carries the position.
 * @param {string} source
 * @param {number} pos
 */
function lineCol(source, pos) {
  const upTo = source.slice(0, pos)
  const line = upTo.split('\n').length
  const col = pos - (upTo.lastIndexOf('\n') + 1) + 1
  return `${line}:${col}`
}

/**
 * @this {{ resourcePath: string, callback: (err: Error | null, content?: string, map?: object) => void }}
 * @param {string} source
 * @param {object} [map] upstream sourcemap, forwarded verbatim on the untransformed paths
 */
function reactDecorLoader(source, map) {
  const id = this.resourcePath
  if (!/\.at\.tsx$/.test(id) || !source.includes('@')) {
    this.callback(null, source, map)
    return
  }
  try {
    const res = transform(source, id)
    if (!res.changed) {
      this.callback(null, source, map)
      return
    }
    // JSON round-trip: hand loader-runner a plain V3 object, not magic-string's
    // SourceMap class instance (Turbopack serializes the result across a bridge).
    this.callback(null, res.code, JSON.parse(res.map.toString()))
  } catch (e) {
    if (e instanceof AtBuildError) {
      const err = new Error(`${e.message} (${id}:${lineCol(source, e.pos)})`)
      err.name = 'AtBuildError'
      throw err
    }
    throw e
  }
}

module.exports = reactDecorLoader
module.exports.default = reactDecorLoader
