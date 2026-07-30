// slot-red.at.tsx — pass-2 RED fixture: the SPLICED return expression violates
// the slot prop's type (Element | null into a non-null ReactElement). Pass 1
// (virtualized) is green by construction — `element={$at}` satisfies the prop
// and the detached return is a fine component body — so only the
// transformed-output pass can catch it.
import type { ReactElement } from 'react'
import { $at } from 'react-decor'

function Route({ element }: { element: ReactElement }) {
  return <div>{element}</div>
}

export function Gate({ ok }: { ok: boolean }) {
  @(<Route element={$at} />)
  return ok ? <a href="/y">y</a> : null
}
