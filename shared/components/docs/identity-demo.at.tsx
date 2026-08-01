import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DemoPanel } from '@shared/components/docs/demo-panel'
import { Region } from '@shared/components/site/region'
import { Button } from '@/components/ui/button'

const TILE_IDS = ['tile-a', 'tile-b', 'tile-c'] as const

// Module scope: the tiles keep their identity across parent re-renders — that IS the
// demo. Each holds local click state; the parent button forces re-renders above them.
// The Button wrapper reads setClicks, so it rides the return position.
const ClickTile = ({ id }: { id: (typeof TILE_IDS)[number] }) => {
  const { t } = useTranslation()
  const [clicks, setClicks] = useState(0)
  @(<Button
    variant="outline"
    onClick={() => setClicks((count) => count + 1)}
    className="h-auto min-w-28 flex-col items-start gap-1 px-4 py-3"
  />)
  return (
    <>
      <span className="font-mono text-xs">{id}</span>
      <span className="text-muted-foreground text-sm font-normal">
        {t('docs.keyedtile.demo.clicks', { count: clicks })}
      </span>
    </>
  )
}

/**
 * Interactive identity proof for the keyed-tile section: click tiles to give them
 * local state, force parent re-renders, watch the state survive. The counter-example
 * (a local atom) is shown as a static sample — committing it would fail lint.
 */
export function IdentityDemo() {
  const { t } = useTranslation()
  const [renders, setRenders] = useState(1)
  // The Region label reads t(), so the wrapper rides the return — the live twin of
  // the return-position sample in the placements section.
  @(<Region label={t('docs.keyedtile.demo.region')} />)
  return (
    <DemoPanel className="items-stretch">
      <div className="flex flex-wrap items-center gap-3">
        @(<Button variant="secondary" size="sm" onClick={() => setRenders((count) => count + 1)} />)
        <span>{t('docs.keyedtile.demo.rerender')}</span>
        <span className="text-muted-foreground text-sm" aria-live="polite">
          {t('docs.keyedtile.demo.renders', { count: renders })}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {TILE_IDS.map((id) => (
          <ClickTile key={id} id={id} />
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{t('docs.keyedtile.demo.note')}</p>
    </DemoPanel>
  )
}
