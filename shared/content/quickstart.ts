import {
  SNIPPET_STEP_ESLINT,
  SNIPPET_STEP_SCRIPTS,
  SNIPPET_STEP_TSCONFIG,
  SNIPPET_STEP_VITE,
} from '@shared/content/snippets'

export interface QuickStartStep {
  key: string
  /** Code identifier shown as the CodeBlock chip — verbatim, not translated. */
  filename: string
  snippet: string
}

// Structure only — the copy lives in i18n (home.quickstart.steps.<key>.*).
export const QUICKSTART: QuickStartStep[] = [
  { key: 'vite', filename: 'vite.config.ts', snippet: SNIPPET_STEP_VITE },
  { key: 'tsconfig', filename: 'tsconfig.app.json', snippet: SNIPPET_STEP_TSCONFIG },
  { key: 'eslint', filename: 'eslint.config.js', snippet: SNIPPET_STEP_ESLINT },
  { key: 'scripts', filename: 'package.json', snippet: SNIPPET_STEP_SCRIPTS },
]
