import { $at } from 'react-decor'
import { Card, Frame, Slot } from './composers'

@Slot({ tone: 'decl', content: $at })
export function Slotted(props: { name: string }) {
  return <b>{props.name}</b>
}

@Frame
@Card({ tone: 'brand' })
export function Hello(props: { name: string }) {
  @(<Frame />)
  const Inner = ({ label }: { label: string }) => <em>{label}</em>

  @(<Card tone="wrap" />)
  return (
    <div>
      @(<Frame />)
      <span>{props.name}</span>
      <Inner label="x" />
    </div>
  )
}
