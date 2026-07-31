import type { ReactElement, ReactNode } from 'react'
import { $at } from 'react-decor'

function Overlay({ content, tone }: { content?: ReactElement; tone: string }) {
  return <aside data-tone={tone}>{content}</aside>
}

function Frame({ children }: { children?: ReactNode }) {
  return <section data-x="frame">{children}</section>
}

@Overlay({ content: $at, tone: 'brand' })
@Frame
export function Slotted({ name }: { name: string }) {
  @(<Overlay content={$at} tone="ret" />)
  return (
    <div>
      @(<Overlay content={$at} tone="tree" />)
      <span>{name}</span>
      <i>sib</i>
    </div>
  )
}
