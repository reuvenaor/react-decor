import type { ReactNode } from 'react'

function Frame({ children }: { children?: ReactNode }) {
  return <section data-x="frame">{children}</section>
}

function Label({ text, children }: { text: string; children?: ReactNode }) {
  return <div data-label={text}>{children}</div>
}

@Frame
@Label({ text: 'outer' })
export function Hello({ name }: { name: string }) {
  @(<Frame />)
  const Inner = ({ v }: { v: string }) => <em>{v}</em>

  @(<Label text="ret" />)
  return (
    <div>
      @(<Frame />)
      <span>{name}</span>
      <Inner v="local" />
    </div>
  )
}
