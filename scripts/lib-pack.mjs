#!/usr/bin/env node
/**
 * Vendor repack: the one command to run after editing lib source (or bumping
 * versions). Replaces the old inline `npm pack && npm update` script, which
 * could not survive a version bump — the emitted tarball FILENAME changes with
 * the version, but the six `file:vendor/react-decor-<v>.tgz` pins (root + both
 * example apps) are literal, so `npm update` kept resolving the stale tarball.
 *
 * What it does, in order:
 *   1. sync   — ts-plugin's `react-decor` dependency range follows the lib version
 *   2. pack   — `npm pack` both packages into vendor/
 *   3. pins   — rewrite the six `file:` specifiers to the current filenames
 *   4. prune  — stale vendor tarballs + the installed node_modules copies
 *               (npm can serve a stale extraction when the filename is
 *               unchanged — the CONTRIBUTING.md cache gotcha)
 *   5. install — refresh the workspace install + package-lock integrity
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const log = (msg) => console.log(`[lib-pack] ${msg}`)
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'))

const libVersion = readJson('lib/react-decor/package.json').version
const pluginVersion = readJson('lib/react-decor/ts-plugin/package.json').version
const libTgz = `react-decor-${libVersion}.tgz`
const pluginTgz = `react-decor-ts-plugin-${pluginVersion}.tgz`

// 1. ts-plugin depends on react-decor by range — keep it caret-locked to the
// lib version so a bump cannot leave the published pair incompatible.
const pluginManifestPath = path.join(root, 'lib/react-decor/ts-plugin/package.json')
const pluginManifest = readFileSync(pluginManifestPath, 'utf8')
const syncedPlugin = pluginManifest.replace(/("react-decor"\s*:\s*")[^"]+(")/, `$1^${libVersion}$2`)
if (syncedPlugin !== pluginManifest) {
  writeFileSync(pluginManifestPath, syncedPlugin)
  log(`ts-plugin dependency synced to ^${libVersion}`)
}

// 2. pack both packages into vendor/
log(`packing ${libTgz} + ${pluginTgz}…`)
execFileSync(
  'npm',
  ['pack', './lib/react-decor', './lib/react-decor/ts-plugin', '--pack-destination', 'vendor'],
  { cwd: root, stdio: 'inherit' },
)
for (const f of [libTgz, pluginTgz]) {
  if (!existsSync(path.join(root, 'vendor', f))) {
    console.error(`[lib-pack] expected vendor/${f} after npm pack — aborting`)
    process.exit(1)
  }
}

// 3. re-point the six file: pins (raw-text replace keeps formatting intact)
const pinFiles = [
  ['package.json', 'vendor'],
  ['examples/react-router/package.json', '../../vendor'],
  ['examples/nextjs/package.json', '../../vendor'],
]
for (const [rel, prefix] of pinFiles) {
  const p = path.join(root, rel)
  const before = readFileSync(p, 'utf8')
  const after = before
    .replace(/("react-decor"\s*:\s*")file:[^"]+(")/, `$1file:${prefix}/${libTgz}$2`)
    .replace(/("react-decor-ts-plugin"\s*:\s*")file:[^"]+(")/, `$1file:${prefix}/${pluginTgz}$2`)
  if (after !== before) {
    writeFileSync(p, after)
    log(`${rel}: pins → ${libTgz} / ${pluginTgz}`)
  }
}

// 4a. prune stale vendor tarballs (anything not the two current filenames)
for (const f of readdirSync(path.join(root, 'vendor'))) {
  if (f.endsWith('.tgz') && f !== libTgz && f !== pluginTgz) {
    rmSync(path.join(root, 'vendor', f))
    log(`pruned stale vendor/${f}`)
  }
}

// 4b. prune the installed copies so npm re-extracts the fresh tarballs even
// when the filename did not change (same-version repack)
for (const dir of [
  'node_modules/react-decor',
  'node_modules/react-decor-ts-plugin',
  'examples/react-router/node_modules/react-decor',
  'examples/react-router/node_modules/react-decor-ts-plugin',
  'examples/nextjs/node_modules/react-decor',
  'examples/nextjs/node_modules/react-decor-ts-plugin',
]) {
  rmSync(path.join(root, dir), { recursive: true, force: true })
}

// 5. refresh installs + package-lock. A plain `npm install` trusts the existing
// lock entries and leaves their `integrity` stale on a same-filename repack
// (the next `npm ci` dies with EINTEGRITY), while `npm update react-decor`
// re-resolves the ts-plugin's `react-decor@^x` range against the REGISTRY
// (E404 — the package is unpublished). So: drop the two lock entries and let
// install rebuild them from the file: pins, fully offline.
const lockPath = path.join(root, 'package-lock.json')
const lock = JSON.parse(readFileSync(lockPath, 'utf8'))
for (const key of Object.keys(lock.packages ?? {})) {
  if (/(^|\/)node_modules\/react-decor(-ts-plugin)?$/.test(key)) delete lock.packages[key]
}
writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`)
log('npm install --workspaces --include-workspace-root…')
execFileSync(
  'npm',
  ['install', '--workspaces', '--include-workspace-root', '--no-audit', '--no-fund'],
  {
    cwd: root,
    stdio: 'inherit',
  },
)

// 6. self-check: the rebuilt lock integrity must match the tarballs on disk,
// or the next `npm ci` fails in CI.
const { createHash } = await import('node:crypto')
const rebuilt = JSON.parse(readFileSync(lockPath, 'utf8'))
for (const [key, tgz] of [
  ['node_modules/react-decor', libTgz],
  ['node_modules/react-decor-ts-plugin', pluginTgz],
]) {
  const entry = rebuilt.packages?.[key]
  const actual = `sha512-${createHash('sha512')
    .update(readFileSync(path.join(root, 'vendor', tgz)))
    .digest('base64')}`
  if (!entry || entry.integrity !== actual) {
    console.error(`[lib-pack] lock integrity for ${key} does not match vendor/${tgz} — aborting`)
    process.exit(1)
  }
}
log(`done — vendor at react-decor@${libVersion} / react-decor-ts-plugin@${pluginVersion}`)
