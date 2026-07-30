'use strict'

/**
 * react-decor Vite plugin — `enforce: 'pre'` source→source transform (TSX in, TSX out),
 * so it runs before @react-router/dev's plugin and rolldown's TSX handling in dev,
 * build, AND the prerender pass.
 *
 * Import it with the BARE specifier (`import reactDecor from 'react-decor/vite'`): Vite's
 * config loader externalizes bare specifiers to a native Node import, and this module
 * (plus its whole require chain) is plain CommonJS that any Node runs with no build
 * step and no type stripping. A RELATIVE import would get bundled into the config —
 * which breaks, because the bundle rewrites `require('typescript')` inside the CJS
 * core to a file:// URL that require() cannot load.
 */

const { AtBuildError, transform } = require('./transform.cjs')

/**
 * @param {{ include?: RegExp }} [options] include is tested against the query-stripped
 *   module id; default `/\.at\.tsx$/`.
 * @returns {import('vite').Plugin}
 */
function reactDecor(options = {}) {
  const include = options.include ?? /\.at\.tsx$/
  return {
    name: 'react-decor',
    enforce: 'pre',
    transform(code, id) {
      const clean = id.split('?')[0]
      if (!include.test(clean) || !code.includes('@')) return
      try {
        const res = transform(code, clean)
        return res.changed ? { code: res.code, map: res.map } : undefined
      } catch (e) {
        // Rollup/rolldown render a code frame on the RAW file from `pos`.
        if (e instanceof AtBuildError) return this.error({ message: e.message, pos: e.pos })
        throw e
      }
    },
  }
}

module.exports = reactDecor
module.exports.default = reactDecor
