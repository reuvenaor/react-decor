import { test, expect, a11yScan, type Page } from './_base'

// react-decor docs e2e. Every route must boot, render exactly one <h1>, carry its
// exact document title (the cross-app parity proof for the two seo helpers — and
// the tripwire for a metadata regression that would ship a page with no <title>),
// log no console errors, and pass an axe WCAG 2.1 A/AA scan once settled. Sections
// reveal on scroll (motion whileInView), so the a11y pass scrolls the whole page
// first — under emulated reduced motion the reveals are instant. Titles mirror
// shared/locales/en/translation.json (*.meta.title / a11y.statement.title).
const ROUTES = [
  { path: '/', name: 'home', title: 'react-decor — compile-time @ decorators for React' },
  { path: '/docs', name: 'docs reference', title: 'Reference — react-decor' },
  { path: '/accessibility', name: 'accessibility statement', title: 'Accessibility statement' },
] as const

async function revealAll(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y <= height; y += 600) {
    await page.evaluate((offset) => window.scrollTo(0, offset), y)
    await page.waitForTimeout(40)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

for (const route of ROUTES) {
  test(`${route.name} loads with one h1 and no console errors`, async ({ page, consoleErrors }) => {
    await page.goto(route.path)
    await expect(page).toHaveTitle(route.title)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(consoleErrors).toEqual([])
  })

  test(`${route.name} is accessibility-clean`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route.path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await revealAll(page)
    expect(await a11yScan(page)).toEqual([])
  })
}

test('reduced motion still reveals every section (no stuck prerender styles)', async ({ page }) => {
  // Regression guard: the prerendered HTML ships motion's initial opacity-0 styles.
  // A reduce-gated client that renders DIFFERENT props leaves those attributes
  // unmatched (React 19 keeps them), permanently hiding content for reduced-motion
  // visitors — axe and toBeVisible are both opacity-blind, so assert computed style.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const targets = [
    'section[data-section="why"] > div:first-child',
    'section[data-section="cta"] > div',
    'footer#footer > div > div',
  ]
  for (const selector of targets) {
    await page.locator(selector).scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.locator(selector).evaluate((el) => getComputedStyle(el).opacity), {
        message: selector,
        timeout: 5_000,
      })
      .toBe('1')
  }
})

test('home and docs are accessibility-clean in dark mode', async ({ page }) => {
  // Dark mode has its own token set — and every CodeBlock forces it, so the docs
  // page is the contrast-critical one. Force dark deterministically: next-themes
  // reads the `theme` localStorage key and applies the `.dark` class.
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.addInitScript(() => {
    try {
      localStorage.setItem('theme', 'dark')
    } catch {
      /* localStorage may be unavailable */
    }
  })
  for (const path of ['/', '/docs'] as const) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await revealAll(page)
    expect(await a11yScan(page), path).toEqual([])
  }
})

test('an unknown route renders a single-main 404', async ({ page }) => {
  // Parity guard for the error surfaces: the react-router root boundary
  // REPLACES the app shell (its own <main role="alert"> is the only main),
  // while the Next 404 renders INSIDE SiteShell's <main id="main"> — nested
  // main landmarks in the static export were the bug. No console-error
  // assertion here: the react-router dev server legitimately logs the route
  // error.
  await page.goto('/this-page-does-not-exist')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/404/)
  await expect(page.locator('main')).toHaveCount(1)
  // filtered: Next also mounts its empty route-announcer as a role="alert"
  await expect(page.getByRole('alert').filter({ hasText: '404 Not Found' })).toBeVisible()
})

test('primary nav reaches the docs page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation').first().getByRole('link', { name: 'Docs' }).click()
  await expect(page).toHaveURL(/\/docs$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the docs TOC jumps to the error catalog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs')
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'Error catalog' })
    .click()
  await expect(page).toHaveURL(/#errors$/)
  await expect(page.locator('section#errors')).toBeInViewport()
})

test('theme toggle switches to dark', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Change theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('mobile viewport has no horizontal page overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', '/docs']) {
    await page.goto(path)
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(0)
  }
})
