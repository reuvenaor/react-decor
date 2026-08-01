import { BadgeCheck, Feather, IndentDecrease, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface FeatureItem {
  key: string
  icon: LucideIcon
}

// Structure only — the copy lives in i18n (home.why.items.<key>.*).
export const FEATURES: FeatureItem[] = [
  { key: 'zero_runtime', icon: Feather },
  { key: 'toolchain', icon: BadgeCheck },
  { key: 'lint', icon: ShieldCheck },
  { key: 'readable', icon: IndentDecrease },
]
