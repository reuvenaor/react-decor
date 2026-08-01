import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Hydration-safe "mounted" flag: false on the prerendered SPA shell + the
// first client render, true afterwards. Implemented with useSyncExternalStore
// (not setState-in-effect) so it satisfies react-hooks and never cascades.
const subscribeNoop = () => () => {
  // The mounted snapshot flips false→true once at hydration, then never
  // changes — there is no external store to subscribe to, so this unsubscribe
  // is intentionally a no-op.
}

/**
 * Scaffold-owned light/dark/system theme toggle (auto-mounted in the app
 * header). Backed by next-themes (`ThemeProvider` in src/lib/providers.tsx).
 * The mount guard avoids a hydration mismatch: the prerendered shell has no
 * resolved theme, so we render a stable placeholder until mounted. Generated
 * apps inherit this — do not rebuild a theme toggle; read theme state with
 * `useTheme()` if needed.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  if (!mounted) {
    @(<Button variant="ghost" size="icon" aria-label={t('theme.toggle')} disabled />)
    return <Sun aria-hidden="true" className="size-4" />
  }

  const Icon = resolvedTheme === 'dark' ? Moon : Sun
  return (
    <DropdownMenu>
      @(<DropdownMenuTrigger asChild />)
      <Button variant="ghost" size="icon" aria-label={t('theme.toggle')}>
        <Icon aria-hidden="true" className="size-4" />
      </Button>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">{t('theme.light')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t('theme.dark')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t('theme.system')}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
