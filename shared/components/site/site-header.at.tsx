// site-header.at.tsx — sticky header for the react-decor documentation site.
// Transparent while it overlays the hero; once the page is scrolled past ~24px it
// animates to a frosted `bg-background/80` bar with a border, a subtle shadow and a
// slight height shrink. It also fades/slides down on mount.
// Prerender-safe: nothing touches window/document during render — scroll and
// reduced-motion are only read inside motion effects. Colors are theme
// tokens only.
//
// Hosts the reused <ThemeToggle /> control, the primary nav (a react-router <Link>
// for /docs; literal lowercase <a> anchors for hash targets, which can never be
// directives) and the "Get started" CTA. All visible copy flows through i18n. The
// asChild composition sites (CTA Button, SheetTrigger, SheetClose) ride @
// directives; the Radix Sheet's content-bearing parts and the motion.header
// machinery stay literal. The sheet nav staggers in on open via the site's own
// Stagger/StaggerItem primitives (immediate mode — reduced-motion aware).
//
// The brand link and desktop nav items are decorated atoms (HeaderBrand, NavItem —
// return-position @Link; hash anchors render a literal lowercase <a>). asChild
// CHILDREN must stay literal elements: Radix Slot clones its child to inject
// className/handlers, and a decorated atom would route those props to the label.

import { useState } from 'react'
import { Link } from '@shared/lib/router-link'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '@shared/components/app/theme-toggle.at'
import { Stagger, StaggerItem } from '@shared/components/motion/stagger'
import { BrandMark } from '@shared/components/site/brand-mark'
import { BRAND } from '@shared/lib/brand'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

// Primary nav: the /docs route (react-router <Link>) plus hash anchors into the two
// pages (rendered as literal <a> — the browser owns the scroll). Labels resolve via
// i18n by key.
const NAV_LINKS = [
  { key: 'docs', to: '/docs', hash: false },
  { key: 'quickstart', to: '/#quick-start', hash: true },
  { key: 'errors', to: '/docs#errors', hash: true },
] as const

const SCROLL_THRESHOLD = 24
const DESKTOP_LINK =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
const MOBILE_LINK =
  'rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const HeaderBrand = () => {
  const { t } = useTranslation()
  @(<Link
    to="/"
    viewTransition
    aria-label={t('header.home_aria', { brand: BRAND })}
    className="focus-visible:ring-ring flex items-center gap-2 rounded-md font-semibold tracking-tight transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:outline-none"
  />)
  return (
    <>
      <BrandMark />
      <span>{BRAND}</span>
    </>
  )
}

const NavItem = ({ link }: { link: (typeof NAV_LINKS)[number] }) => {
  const { t } = useTranslation()
  if (link.hash) {
    return (
      <a href={link.to} className={DESKTOP_LINK}>
        {t(`header.nav.${link.key}`)}
      </a>
    )
  }
  @(<Link to={link.to} viewTransition className={DESKTOP_LINK} />)
  return <>{t(`header.nav.${link.key}`)}</>
}

export function SiteHeader() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  // Live updates as the user scrolls. setState with the same boolean bails out,
  // so this only re-renders on the two threshold crossings. `scrolled` starts false
  // to match the prerendered HTML (no hydration mismatch).
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > SCROLL_THRESHOLD)
  })

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-border bg-background/80 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6 lg:px-8',
          scrolled && !reduceMotion ? 'h-14' : 'h-16',
        )}
      >
        {/* Brand */}
        <HeaderBrand />

        {/* Center nav (desktop) */}
        <nav aria-label={t('nav.primary')} className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.key} link={link} />
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1 sm:gap-2">
          @(<Button asChild size="sm" className="hidden md:inline-flex" />)
          <Link to="/docs" viewTransition>
            {t('header.cta')}
          </Link>
          <ThemeToggle />

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              @(<SheetTrigger asChild />)
              <Button variant="ghost" size="icon" aria-label={t('header.open_menu')}>
                <Menu aria-hidden="true" />
              </Button>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BrandMark />
                    <span>{BRAND}</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {t('header.menu_desc', { brand: BRAND })}
                  </SheetDescription>
                </SheetHeader>

                <nav aria-label={t('nav.primary')} className="mt-6">
                  <Stagger immediate className="flex flex-col gap-1">
                    {NAV_LINKS.map((link) => {
                      @(<StaggerItem key={link.key} />)
                      @(<SheetClose asChild />)
                      return link.hash ? (
                        <a href={link.to} className={MOBILE_LINK}>
                          {t(`header.nav.${link.key}`)}
                        </a>
                      ) : (
                        <Link to={link.to} viewTransition className={MOBILE_LINK}>
                          {t(`header.nav.${link.key}`)}
                        </Link>
                      )
                    })}
                    <StaggerItem className="mt-2">
                      @(<SheetClose asChild />)
                      <Link
                        to="/docs"
                        viewTransition
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring block rounded-md px-3 py-2 text-center text-base font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
                      >
                        {t('header.cta')}
                      </Link>
                    </StaggerItem>
                  </Stagger>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
