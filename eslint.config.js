import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import i18next from 'eslint-plugin-i18next'
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import nextPlugin from '@next/eslint-plugin-next'
import { reactDecorEslint, reactDecorPlugin } from 'react-decor/eslint'

// Tailwind palette names — any token of the form bg-blue-500, text-zinc-700, etc.
// is a violation: use the semantic theme tokens (bg-primary, text-muted-foreground, …).
const PALETTE_RE =
  '\\b(?:bg|text|border|ring|from|via|to|outline|fill|stroke|decoration|shadow|caret|accent|divide|placeholder)-(?:red|blue|green|yellow|purple|pink|indigo|gray|zinc|slate|stone|neutral|amber|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\\d'

// Physical-direction Tailwind utilities. Use logical (ms-*, pe-*, text-start, border-s, …) instead.
const PHYSICAL_DIR_RE =
  '\\b(?:ml-|mr-|pl-|pr-|text-(?:left|right)\\b|border-(?:l|r)\\b|rounded-(?:l|r|tl|tr|bl|br)\\b|(?:left|right)-)'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'examples/*/build',
      'examples/*/.react-router',
      'examples/*/.next',
      'examples/*/out',
      'examples/*/next-env.d.ts',
      'examples/*/src/components/ui',
      // Raw-@ react-decor fixtures: unreadable by every standard parser by design —
      // tests read them as strings (or through the Vite transform), never as lint input.
      'lib/react-decor/test/__fixtures__',
    ],
  },

  // Base JS recommendations
  js.configs.recommended,

  // Type-aware TS — recommended-type-checked + stylistic-type-checked.
  // strict-type-checked is intentionally deferred: the existing app code
  // (react-router internals, third-party-typed providers) trips no-unsafe-*
  // rules even with valid code. Re-evaluate later.
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Wire up the type-aware parser for TS files only.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.es2025 },
    },
  },

  // JS config / build scripts shouldn't run type-aware rules.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node, ...globals.es2025 } },
  },

  // Hand-written CommonJS declaration twins (react-decor ships .d.cts next to its .cjs
  // core) — declarations carry no runtime code; type-aware linting adds nothing and
  // the projectService glob above doesn't cover .cts.
  {
    files: ['**/*.cts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // react-decor's tool-time core is CommonJS BY DESIGN: tsserver require()s the plugin,
  // ESLint flat config imports the parser through Node's CJS interop, and the at-tsc
  // bin must run under any Node with no build step. require() is the point.
  {
    files: ['lib/react-decor/**/*.{js,cjs}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // React (recommended + jsx-runtime so no need to import React in scope).
  {
    files: ['**/*.{jsx,tsx}'],
    ...react.configs.flat.recommended,
    settings: { react: { version: '19.0' } },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },

  // React best-practice hardening — explicit opt-ins beyond flat.recommended
  // (security/render-correctness at error, hygiene advisory at warn).
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react/no-danger': 'error',
      'react/jsx-no-script-url': 'error',
      'react/no-array-index-key': 'warn',
      'react/jsx-no-constructed-context-values': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/self-closing-comp': 'warn',
      'react/no-unused-prop-types': 'error',
    },
  },

  // React hooks — all source files, not just JSX: custom hooks live in plain .ts.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Preset default is warn; a missing dep is a stale-closure bug, so it gates.
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // React refresh — component-module constraint, JSX files only.
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'meta',
            'links',
            'headers',
            'loader',
            'action',
            'clientLoader',
            'clientAction',
            'shouldRevalidate',
            'ErrorBoundary',
            'HydrateFallback',
            'Layout',
          ],
        },
      ],
    },
  },

  // Next.js rules for the nextjs example only — the PLUGIN, not eslint-config-next
  // (the full config re-registers react/react-hooks/import with different
  // identities and would conflict with the blocks above).
  {
    files: ['examples/nextjs/**/*.{js,jsx,ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    settings: { next: { rootDir: 'examples/nextjs' } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    // App Router modules export metadata objects beside the default component by
    // design; react-refresh's Vite-oriented constraint doesn't apply to them.
    files: ['examples/nextjs/src/app/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // jsx-a11y strict — mechanically enforces the accessibility baseline (labels,
  // alt text, keyboard handlers, aria attributes).
  jsxA11y.flatConfigs.strict,

  // Import discipline + i18n string enforcement
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: { import: importPlugin, i18next },
    rules: {
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'ignore',
        },
      ],
    },
  },

  // i18next: only enforce on user-facing JSX text in app source (not app
  // bootstrap files, which contain framework-required English literals).
  {
    files: [
      'examples/*/src/root.tsx',
      'examples/*/src/routes/**/*.{ts,tsx}',
      'examples/*/src/components/**/*.{ts,tsx}',
      'shared/components/**/*.{ts,tsx}',
    ],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          'should-validate-template': true,
        },
      ],
    },
  },

  // eslint-comments — every disable must explain why. react/jsx-key may never be
  // disabled at all: the keyed-tile convention (extract a decorated tile, key on the
  // map callsite) or a ternary return always removes the need — see the react-decor
  // README "Conventions".
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
      '@eslint-community/eslint-comments/no-restricted-disable': ['error', 'react/jsx-key'],
    },
  },

  // Project-specific custom rules (no custom plugin — uses primitives only).
  {
    files: ['**/*.{ts,tsx,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Restricted imports (TS-aware variant — also catches `import type`):
      //  - forwardRef: React 19 uses ref-as-prop; forwardRef is a legacy escape hatch.
      // (`@shared/*` is this repo's OWN cross-app alias into shared/ —
      // deliberately allowed; both example apps compile it from source.)
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['forwardRef'],
              message: 'React 19 uses ref as a prop. Remove forwardRef.',
            },
          ],
        },
      ],

      'no-restricted-syntax': [
        'error',
        // Tailwind palette literal in a static className string
        {
          selector: `JSXAttribute[name.name="className"] > Literal[value=/${PALETTE_RE}/]`,
          message:
            'Use semantic Tailwind tokens (bg-primary, text-foreground, border-border, bg-chart-1) — not palette literals.',
        },
        // Tailwind palette inside a template literal `className={`bg-blue-500 …`}`
        {
          selector: `JSXAttribute[name.name="className"] TemplateElement[value.raw=/${PALETTE_RE}/]`,
          message:
            'Use semantic Tailwind tokens (bg-primary, text-foreground, border-border, bg-chart-1) — not palette literals.',
        },
        // Physical-direction utility in a static className string
        {
          selector: `JSXAttribute[name.name="className"] > Literal[value=/${PHYSICAL_DIR_RE}/]`,
          message:
            'Use logical-direction utilities (ms-*, pe-*, text-start, border-s, rounded-s-*) for RTL safety.',
        },
        // Physical-direction utility inside a template literal
        {
          selector: `JSXAttribute[name.name="className"] TemplateElement[value.raw=/${PHYSICAL_DIR_RE}/]`,
          message:
            'Use logical-direction utilities (ms-*, pe-*, text-start, border-s, rounded-s-*) for RTL safety.',
        },
        // window.* at module top level — SPA pre-renders the root at build time.
        {
          selector: `Program > VariableDeclaration > VariableDeclarator > MemberExpression[object.name="window"]`,
          message:
            'No window.* at module top level — SPA pre-renders root at build time. Move to effects or event handlers.',
        },
        {
          selector: `Program > ExpressionStatement > CallExpression > MemberExpression[object.name="window"]`,
          message:
            'No window.* at module top level — SPA pre-renders root at build time. Move to effects or event handlers.',
        },
        {
          selector: `Program > ExpressionStatement > MemberExpression[object.name="window"]`,
          message:
            'No window.* at module top level — SPA pre-renders root at build time. Move to effects or event handlers.',
        },
      ],
    },
  },

  // Playwright e2e tests — node runtime; exempt from the app i18n/react/jsx
  // constraints (those are file-scoped to src/ already). The type-aware safety
  // net stays on (no-floating-promises catches a forgotten await in a test).
  {
    files: ['e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  // react-decor hygiene rules that hold for ALL React code, not just decorated files:
  // key/t must never be component props (React reserves key; t comes from
  // useTranslation() inside the component). Registers the SAME plugin object the
  // reactDecorEslint() block uses, so flat config sees one 'react-decor' identity.
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-decor': reactDecorPlugin },
    rules: {
      'react-decor/no-key-prop': 'error',
      'react-decor/no-t-prop': 'error',
    },
  },

  // react-decor decorated files (**/*.at.tsx): swap in the virtualizing parser (raw `@`
  // directives become valid, type-checked expressions at identical positions, so every
  // block above — jsx-a11y, i18next, the custom no-restricted-syntax rules, --fix
  // ranges — keeps applying verbatim) and enable the full react-decor rule set,
  // including the decorator-position rules (no-aschild-decl-decorator,
  // no-props-selector-decl). Placed after the TS blocks so the parser override wins
  // while parserOptions (projectService) merge in from them.
  reactDecorEslint(),

  // Prettier last — disables stylistic rules that conflict with the formatter.
  prettier,
)
