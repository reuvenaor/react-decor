import { Reveal } from '@shared/components/motion/reveal'
import { SectionShell } from '@shared/components/site/section-shell'
import { cn } from '@/lib/utils'

interface PageHeroProps {
  /** Already-translated strings (the caller resolves them via t()). */
  eyebrow?: string
  title: string
  intro?: string
  /** Merged over the canonical hero padding — pad overrides need explicit md: counterparts. */
  className?: string
}

// The static Reveal rides its own decl atom (react-decor/no-static-return-directive);
// the copy is prop-parameterized like any tile.
@Reveal
const PageHeroBody = ({ eyebrow, title, intro }: Omit<PageHeroProps, 'className'>) => (
  <>
    {eyebrow ? <p className="text-primary text-sm font-medium">{eyebrow}</p> : null}
    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
      {title}
    </h1>
    {intro ? <p className="text-muted-foreground mt-5 max-w-2xl text-lg">{intro}</p> : null}
  </>
)

/**
 * Inner-route hero — eyebrow + h1 + intro, revealed on scroll. The section shell
 * rides a RETURN-position directive (not a top-level one) so the caller's className
 * can reach it: return placements see the full function scope, props included.
 */
export function PageHero({ eyebrow, title, intro, className }: PageHeroProps) {
  @(<SectionShell
    bare
    data-section="page-hero"
    className={cn('pt-8 pb-20 md:pt-8 md:pb-28', className)}
  />)
  return <PageHeroBody eyebrow={eyebrow} title={title} intro={intro} />
}
