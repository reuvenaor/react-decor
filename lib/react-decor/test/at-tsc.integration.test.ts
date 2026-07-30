import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const bin = path.join(here, '..', 'bin', 'at-tsc.cjs')
const proj = path.join(here, '__fixtures__', 'project')

const atTsc = (config: string) =>
  spawnSync(process.execPath, [bin, '-p', path.join(proj, config), '--noEmit'], {
    encoding: 'utf8',
  })

describe('at-tsc', () => {
  it('exits 0 on the clean fixture project (all placements type-check)', () => {
    const r = atTsc('tsconfig.json')
    expect(r.status, r.stdout + r.stderr).toBe(0)
  }, 60_000)

  it('recurses solution-style configs (files: [] + references)', () => {
    const r = atTsc('tsconfig.solution.json')
    expect(r.status, r.stdout + r.stderr).toBe(0)
  }, 60_000)

  it('surfaces config errors on a solution-style config instead of dropping them', () => {
    const r = atTsc('tsconfig.solution-bad.json')
    expect(r.status).toBe(1)
    // TS5025 (unknown option with suggestion) — the recoverable class the early
    // return used to swallow; the referenced project itself stays green.
    expect(r.stdout).toMatch(/TS502[35]/)
    expect(r.stdout).toContain('noUncheckedIndexedAccesss')
  }, 60_000)

  it('fails with a raw-position code frame when a decorator prop has the wrong type', () => {
    const r = atTsc('tsconfig.bad.json')
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('bad.at.tsx:3:9')
    expect(r.stdout).toContain('TS2322')
    // the code frame renders the RAW text — users see @Card, never ;Card
    expect(r.stdout).toContain('@Card({ tone: 123 })')
  }, 60_000)

  it('pass 2 catches a slot-type violation in the real spliced output', () => {
    // Virtualization-green (element={$at} satisfies the prop; the return is
    // checked detached) — only type-checking the transformed splice sees the
    // Element | null → ReactElement mismatch.
    const r = atTsc('tsconfig.slot-red.json')
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('TS2322')
    expect(r.stdout).toContain('slot-red.at.tsx')
  }, 60_000)
})
