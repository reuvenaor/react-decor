import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { GREEN } from './corpus.ts'

type TransformFn = (
  this: { error(e: { message: string; pos?: number }): never },
  code: string,
  id: string,
) => { code: string } | undefined

interface ReactDecorPlugin {
  name: string
  enforce?: 'pre' | 'post'
  transform: TransformFn
}

// createRequire mirrors how every real consumer loads the plugin (Vite's config
// loader externalizes the bare specifier to a native CJS load).
const require = createRequire(import.meta.url)
const reactDecor = require('react-decor/vite') as (options?: {
  include?: RegExp
}) => ReactDecorPlugin

const plugin = reactDecor()
const hook = plugin.transform

const ctx = {
  error(e: { message: string; pos?: number }): never {
    throw new Error(`plugin-error at ${e.pos}: ${e.message}`)
  },
}

const run = (code: string, id: string) => hook.call(ctx, code, id)

describe('vite plugin', () => {
  it('is a pre-enforced plugin named react-decor', () => {
    expect(plugin.name).toBe('react-decor')
    expect(plugin.enforce).toBe('pre')
  })

  it('ignores non-matching ids and @-less files', () => {
    expect(run(GREEN.declFn, '/x/file.tsx')).toBeUndefined()
    expect(run('export const A = 1\n', '/x/file.at.tsx')).toBeUndefined()
  })

  it('transforms matching files, including query-suffixed ids', () => {
    const out = run(GREEN.declFn, '/x/email.at.tsx')
    expect(out?.code).toContain('EmailInput_base')
    const q = run(GREEN.declFn, '/x/email.at.tsx?client-route')
    expect(q?.code).toContain('EmailInput_base')
  })

  it('reports malformed directives through this.error with a position', () => {
    expect(() => run('@card\nexport function X() { return <i/> }\n', '/x/b.at.tsx')).toThrow(
      /plugin-error at \d+: \[react-decor] AT003/,
    )
  })

  it('supports a custom include filter', () => {
    const custom = reactDecor({ include: /\.deco\.tsx$/ })
    expect(custom.transform.call(ctx, GREEN.declConstArrow, '/x/a.at.tsx')).toBeUndefined()
    expect(custom.transform.call(ctx, GREEN.declConstArrow, '/x/a.deco.tsx')?.code).toContain(
      'Chip_base',
    )
  })
})
