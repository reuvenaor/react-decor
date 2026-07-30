import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint, type Linter } from 'eslint'
import * as reactDecorParser from 'react-decor/eslint-parser'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'

const projDir = path.dirname(fileURLToPath(new URL('./__fixtures__/project/x', import.meta.url)))

/**
 * The load-bearing integration: type-aware linting through the projectService with
 * lint text that DIFFERS from disk (the parser hands the service virtualized text).
 * Verified premise: typescript-estree passes the provided text through, so the
 * checker sees the virtualized module while every position stays raw-accurate.
 */
const makeESLint = () =>
  new ESLint({
    cwd: projDir,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.at.tsx'],
        languageOptions: {
          parser: reactDecorParser as unknown as Linter.Parser,
          parserOptions: {
            projectService: true,
            tsconfigRootDir: projDir,
            ecmaFeatures: { jsx: true },
          },
        },
        plugins: { '@typescript-eslint': tseslint.plugin },
        rules: {
          '@typescript-eslint/no-floating-promises': 'error',
        },
      },
    ],
  })

describe('eslint parser + projectService', () => {
  it('parses decorated files with zero fatal errors and fires type-aware rules at raw positions', async () => {
    const eslint = makeESLint()
    const results = await eslint.lintFiles(['ok.at.tsx', 'float.at.tsx'])
    const byFile = Object.fromEntries(results.map((r) => [path.basename(r.filePath), r]))

    // ok.at.tsx: every placement present, no parse errors, no rule hits
    expect(byFile['ok.at.tsx'].fatalErrorCount).toBe(0)
    expect(byFile['ok.at.tsx'].messages).toEqual([])

    // float.at.tsx: the TYPE-AWARE rule fires at the raw line/column
    const msgs = byFile['float.at.tsx'].messages
    expect(byFile['float.at.tsx'].fatalErrorCount).toBe(0)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].ruleId).toBe('@typescript-eslint/no-floating-promises')
    expect(msgs[0].line).toBe(5)
    expect(msgs[0].column).toBe(3)
  }, 120_000)

  it('reports malformed directives as a fatal parse error at the raw location', async () => {
    const eslint = makeESLint()
    const [res] = await eslint.lintText('@card\nexport function X() { return <i/> }\n', {
      filePath: path.join(projDir, 'virtual-bad.at.tsx'),
      warnIgnored: true,
    })
    expect(res.fatalErrorCount).toBe(1)
    expect(res.messages[0].message).toContain('AT003')
  }, 60_000)
})
