import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const tsserverPath = require.resolve('typescript/lib/tsserver.js')
const here = path.dirname(fileURLToPath(import.meta.url))
const okFile = path.join(here, '__fixtures__', 'project', 'ok.at.tsx')

interface TsserverMessage {
  type: string
  command?: string
  success?: boolean
  body?: { code: number; text?: string }[]
}

/**
 * Drive the REAL tsserver binary over its stdio protocol — exactly what an editor
 * running the workspace TypeScript does. The fixture tsconfig declares
 * react-decor-ts-plugin, which tsserver resolves from the node_modules ancestor of
 * tsserver.js itself (the "Use Workspace Version" scenario). If the plugin fails to
 * load, tsserver silently falls back to raw text and the assertions below surface
 * the exact raw-mode codes (1206/1146/6133) an editor would show.
 */
function runTsserver(requests: object[], doneWhen: (msgs: TsserverMessage[]) => boolean) {
  return new Promise<TsserverMessage[]>((resolve, reject) => {
    const child = spawn(process.execPath, [tsserverPath, '--disableAutomaticTypingAcquisition'], {
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const msgs: TsserverMessage[] = []
    let buf = ''
    const finish = (err?: Error) => {
      clearTimeout(timer)
      child.kill()
      if (err) reject(err)
      else resolve(msgs)
    }
    const timer = setTimeout(
      () => finish(new Error(`tsserver timeout; got: ${JSON.stringify(msgs).slice(0, 1500)}`)),
      90_000,
    )
    child.stdout.on('data', (d: Buffer) => {
      buf += d.toString('utf8')
      for (;;) {
        const head = /^Content-Length: (\d+)\r?\n\r?\n/.exec(buf)
        if (!head) break
        const start = head[0].length
        const length = Number(head[1])
        if (buf.length < start + length) break
        const body = buf.slice(start, start + length)
        buf = buf.slice(start + length)
        msgs.push(JSON.parse(body) as TsserverMessage)
      }
      if (doneWhen(msgs)) finish()
    })
    child.on('error', (e) => finish(e))
    for (const r of requests) child.stdin.write(`${JSON.stringify(r)}\n`)
  })
}

const response = (msgs: TsserverMessage[], command: string) =>
  msgs.find((m) => m.type === 'response' && m.command === command)

describe('tsserver (workspace-TS scenario)', () => {
  it('serves decorated files clean through the configured plugin', async () => {
    const msgs = await runTsserver(
      [
        { seq: 0, type: 'request', command: 'configure', arguments: { hostInfo: 'vitest' } },
        { seq: 1, type: 'request', command: 'open', arguments: { file: okFile } },
        {
          seq: 2,
          type: 'request',
          command: 'syntacticDiagnosticsSync',
          arguments: { file: okFile },
        },
        {
          seq: 3,
          type: 'request',
          command: 'semanticDiagnosticsSync',
          arguments: { file: okFile },
        },
        {
          seq: 4,
          type: 'request',
          command: 'suggestionDiagnosticsSync',
          arguments: { file: okFile },
        },
      ],
      (m) =>
        !!response(m, 'syntacticDiagnosticsSync') &&
        !!response(m, 'semanticDiagnosticsSync') &&
        !!response(m, 'suggestionDiagnosticsSync'),
    )
    // Raw-mode signatures an editor without the plugin shows: 1146 "Declaration
    // expected" (syntactic), 1206 "Decorators are not valid here" (semantic), and
    // 6133/6192 unused-import (suggestion). All three channels must be silent.
    const syntactic = response(msgs, 'syntacticDiagnosticsSync')
    expect(syntactic?.success, JSON.stringify(syntactic)).toBe(true)
    expect(syntactic?.body).toEqual([])
    const semantic = response(msgs, 'semanticDiagnosticsSync')
    expect(semantic?.success, JSON.stringify(semantic)).toBe(true)
    expect(semantic?.body).toEqual([])
    const suggestion = response(msgs, 'suggestionDiagnosticsSync')
    expect(suggestion?.success, JSON.stringify(suggestion)).toBe(true)
    const codes = (suggestion?.body ?? []).map((d) => d.code)
    expect(codes.filter((c) => [1146, 1206, 6133, 6192].includes(c))).toEqual([])
  }, 120_000)
})
