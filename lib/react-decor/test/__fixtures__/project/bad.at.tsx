import { Card } from './composers'

@Card({ tone: 123 })
export function Broken() {
  return <div>broken</div>
}
