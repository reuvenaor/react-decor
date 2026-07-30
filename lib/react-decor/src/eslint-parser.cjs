'use strict'

/**
 * react-decor ESLint parser — virtualizes the raw text (same-length swaps) and delegates
 * to @typescript-eslint/parser, so every rule location and autofix range computed on
 * the virtual text applies verbatim to the raw file. Type-aware linting keeps working:
 * typescript-estree hands the PROVIDED text to the project service (verified against
 * this repo's projectService setup), so the checker sees the virtualized module.
 *
 * Malformed directives throw a fatal parse error at the raw location — lint-staged
 * catches them at commit time even before at-tsc or the build runs.
 */

const tsParser = require('@typescript-eslint/parser')
const { virtualize } = require('./virtualize.cjs')

// Version follows the manifest (packed in the tarball) — never a stale literal.
const meta = { name: 'react-decor-eslint-parser', version: require('../package.json').version }

function parseForESLint(code, options) {
  const res = virtualize(code, options && options.filePath)
  if (res.errors.length > 0) {
    const first = res.errors[0]
    const pre = code.slice(0, first.span.start)
    const err = new Error(`[react-decor] ${first.code}: ${first.message}`)
    // ESLint reads these to place the fatal parse error.
    err.lineNumber = pre.split('\n').length
    err.column = first.span.start - pre.lastIndexOf('\n')
    throw err
  }
  return tsParser.parseForESLint(res.code, options)
}

module.exports = { meta, parseForESLint }
