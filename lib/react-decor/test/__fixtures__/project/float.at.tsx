import { Card } from './composers'

@Card({ tone: 'brand' })
export function Floaty() {
  Promise.resolve(1)
  return <div>x</div>
}
