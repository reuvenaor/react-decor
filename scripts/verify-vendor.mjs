#!/usr/bin/env node
/**
 * Vendor ↔ source parity gate. CI installs (and therefore lints, type-checks,
 * and tests) the COMMITTED vendor/*.tgz tarballs, while `npm publish
 * ./lib/react-decor` ships the SOURCE directory — so a lib edit committed
 * without `npm run lib:pack` would make CI verify one thing and a release
 * publish another. This script packs both packages from source into a temp
 * dir, extracts them next to the committed vendor tarballs, and diffs the
 * package trees (content compare — tgz bytes are not compared so packing
 * metadata can never false-positive). Non-zero exit on any drift.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const log = (msg) => console.log(`[verify-vendor] ${msg}`)
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'))

const libTgz = `react-decor-${readJson('lib/react-decor/package.json').version}.tgz`
const pluginTgz = `react-decor-ts-plugin-${readJson('lib/react-decor/ts-plugin/package.json').version}.tgz`

const tmp = mkdtempSync(path.join(tmpdir(), 'react-decor-verify-vendor-'))
let failed = false

log('packing from lib source…')
execFileSync(
  'npm',
  ['pack', './lib/react-decor', './lib/react-decor/ts-plugin', '--pack-destination', tmp],
  { cwd: root, stdio: 'pipe' },
)

for (const tgz of [libTgz, pluginTgz]) {
  const vendorFile = path.join(root, 'vendor', tgz)
  const freshFile = path.join(tmp, tgz)
  if (!existsSync(vendorFile)) {
    console.error(`[verify-vendor] MISSING vendor/${tgz} — run \`npm run lib:pack\` and commit it`)
    failed = true
    continue
  }
  if (!existsSync(freshFile)) {
    console.error(
      `[verify-vendor] npm pack did not produce ${tgz} — manifest version vs vendor filename mismatch?`,
    )
    failed = true
    continue
  }
  const vendorDir = path.join(tmp, `vendor-${tgz}`)
  const freshDir = path.join(tmp, `fresh-${tgz}`)
  mkdirSync(vendorDir)
  mkdirSync(freshDir)
  execFileSync('tar', ['-xzf', vendorFile, '-C', vendorDir], { stdio: 'inherit' })
  execFileSync('tar', ['-xzf', freshFile, '-C', freshDir], { stdio: 'inherit' })
  const diff = spawnSync(
    'diff',
    ['-r', path.join(vendorDir, 'package'), path.join(freshDir, 'package')],
    { encoding: 'utf8' },
  )
  if (diff.status === 0) {
    log(`vendor/${tgz} ≡ lib source`)
  } else {
    console.error(`[verify-vendor] DRIFT in vendor/${tgz} — lib source changed without a repack:`)
    console.error(diff.stdout || diff.stderr)
    console.error('[verify-vendor] fix: `npm run lib:pack`, then commit vendor/ + the lockfile')
    failed = true
  }
}

if (failed) {
  console.error(`[verify-vendor] extracted trees kept at: ${tmp}`)
  process.exit(1)
}
rmSync(tmp, { recursive: true, force: true })
log('PASS — committed vendor tarballs match lib source')
