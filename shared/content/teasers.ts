import { LayoutGrid, Puzzle, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TeaserItem {
  key: string
  to: string
  icon: LucideIcon
}

// Structure only — the copy lives in i18n (home.conventions.items.<key>.*).
export const TEASERS: TeaserItem[] = [
  { key: 'keyed_tile', to: '/docs#keyed-tile', icon: LayoutGrid },
  { key: 'slot', to: '/docs#slot', icon: Puzzle },
  { key: 'enforcement', to: '/docs#lint', icon: ShieldCheck },
]
