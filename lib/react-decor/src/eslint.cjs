'use strict'

/**
 * Flat-config helper: scopes the react-decor parser to decorated files (`**\/*.at.tsx`),
 * disables the one rule the virtualized `!Card(...)` expression statements would trip
 * (`@typescript-eslint/no-unused-expressions` — enabled by recommended-type-checked),
 * and turns on the react-decor plugin's footgun rules. The `!` swap itself keeps
 * composers whose call signature returns React 19's ReactNode (which includes
 * Promise) out of no-floating-promises — that rule stays ON for real code in
 * decorated files. Spread AFTER the project's TypeScript blocks so the parser
 * override wins while `parserOptions` (projectService etc.) merge in from those
 * earlier blocks.
 *
 * `reactDecorPlugin` is exported for app configs that also want the general React
 * hygiene rules (no-key-prop, no-t-prop) on PLAIN .tsx files — register the same
 * object under the 'react-decor' name so flat config sees one plugin identity.
 */

const { version } = require('../package.json')
const parser = require('./eslint-parser.cjs')
const { rules } = require('./eslint-rules.cjs')
// package.json ships in the tarball (npm always packs it) — the manifest is the
// single version source; a bump can no longer leave a stale literal behind.

const reactDecorPlugin = {
  meta: { name: 'react-decor', version },
  rules,
}

function reactDecorEslint() {
  return {
    name: 'react-decor',
    files: ['**/*.at.tsx'],
    languageOptions: { parser },
    plugins: { 'react-decor': reactDecorPlugin },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'react-decor/no-aschild-decl-decorator': 'error',
      'react-decor/no-props-selector-decl': 'error',
      'react-decor/no-key-prop': 'error',
      'react-decor/no-t-prop': 'error',
      'react-decor/no-static-return-directive': 'error',
      'react-decor/no-local-atom': 'error',
      'react-decor/no-passthrough-atom': 'error',
      'react-decor/no-stray-at-sentinel': 'error',
    },
  }
}

module.exports = { reactDecorEslint, reactDecorPlugin }
