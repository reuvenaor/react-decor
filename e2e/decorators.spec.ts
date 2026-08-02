import { expect, test, type Page } from './_base'

/**
 * react-decor composed-structure coverage: the docs site's decorated sections must
 * render their COMPOSED output (decorators compile to real nested JSX), the live
 * demos must actually demonstrate their claims, and no directive text may leak
 * outside the code samples. The auto console-errors fixture from ./_base re-asserts
 * zero console errors throughout.
 */

// Body text with every code sample removed (scripts/styles too — textContent on the
// detached clone would otherwise include hydration script source). Directive-opener
// text may only ever appear inside <figure> code blocks.
async function proseText(page: Page) {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement
    for (const el of Array.from(clone.querySelectorAll('figure, script, style'))) el.remove()
    return clone.textContent ?? ''
  })
}

test.describe('react-decor composed sections', () => {
  test('hero pairs the pitch copy with two code samples', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('compile away')
    await expect(page.locator('section#top figure')).toHaveCount(2)
  })

  test('why grid maps four keyed feature tiles through Stagger', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const shell = page.locator('section[data-section="why"]')
    await expect(shell).toBeVisible()
    const grid = shell.locator(':scope > div.grid')
    await expect(grid).toHaveCount(1)
    const tiles = grid.locator(':scope > div')
    await expect(tiles).toHaveCount(4)
    for (const i of [0, 1, 2, 3]) {
      await expect(tiles.nth(i).locator('h3')).toHaveCount(1)
    }
  })

  test('the why grid discloses its own source', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const details = page.locator('section[data-section="why"] details')
    await details.locator('summary').click()
    await expect(details.locator('figure')).toBeVisible()
    await expect(details.locator('figure')).toContainText('WhyStripBody')
  })

  test('quick-start maps four numbered step tiles with their config samples', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const grid = page.locator('section[data-section="quick-start"] > div.grid')
    await expect(grid).toHaveCount(1)
    const tiles = grid.locator(':scope > div')
    await expect(tiles).toHaveCount(4)
    for (const i of [0, 1, 2, 3]) {
      await expect(tiles.nth(i).locator('figure')).toHaveCount(1)
    }
  })

  test('convention teasers map keyed tiles to /docs anchor links', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const grid = page.locator('section[data-section="conventions"] > div.grid')
    await expect(grid).toHaveCount(1)
    const tiles = grid.locator(':scope > div')
    await expect(tiles).toHaveCount(3)
    for (const i of [0, 1, 2]) {
      await expect(tiles.nth(i).locator(':scope > a[href^="/docs#"]')).toHaveCount(1)
    }
  })

  test('footer band renders through the SectionShell composer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const footer = page.locator('footer#footer')
    await expect(footer).toBeVisible()
    const container = footer.locator(':scope > div')
    await expect(container).toHaveCount(1)
    const inner = container.locator(':scope > div')
    await expect(inner).toHaveCount(1)
    await expect(inner.locator(':scope > div.grid')).toHaveCount(1)
    await expect(footer.getByRole('navigation')).toHaveCount(2)
  })

  test('header and footer atoms render real anchors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const header = page.locator('header')
    // HeaderBrand atom (aria-label from the return-position @Link)
    await expect(header.getByRole('link', { name: 'react-decor — home' })).toHaveAttribute(
      'href',
      '/',
    )
    // NavItem atoms: the /docs route link plus the two literal hash-anchor branches
    const nav = header.getByRole('navigation', { name: 'Primary' })
    await expect(nav.locator('a[href="/docs"]')).toHaveCount(1)
    await expect(nav.locator('a[href="/#quick-start"]')).toHaveCount(1)
    await expect(nav.locator('a[href="/docs#errors"]')).toHaveCount(1)
    // FooterBrand (@Link decl) + the project column's Home link
    const footer = page.locator('footer#footer')
    await expect(footer.getByRole('link', { name: 'Accessibility' })).toHaveAttribute(
      'href',
      '/accessibility',
    )
    await expect(footer.locator('a[href="/"]')).toHaveCount(2)
  })

  test('mobile menu composes through the SheetTrigger/SheetClose directives', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()
    await sheet.getByRole('link', { name: 'Docs' }).click()
    await expect(page).toHaveURL(/\/docs$/)
    await expect(sheet).toBeHidden()
  })

  test('no directive text leaks outside code samples', async ({ page }) => {
    for (const path of ['/', '/docs', '/accessibility']) {
      await page.goto(path)
      expect(await proseText(page), path).not.toContain('@(')
    }
  })
})

test.describe('live docs demos', () => {
  test('form mirrors render beside their samples', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    // Scope to the live panels — the same strings appear as text inside the code
    // samples beside them (they are mirrors), which would trip strict mode.
    const panels = page.locator('section#forms [data-demo-panel]')
    await expect(panels).toHaveCount(3)
    // bare: the note renders inside the TintCard surface
    await expect(panels.nth(0).getByText('Wrapped in a card.')).toBeVisible()
    // call: the Labeled wrapper associates the label with the input
    await expect(panels.nth(1).getByLabel('Email address')).toBeVisible()
    // jsx: the Badge wrapper renders the version chip
    await expect(panels.nth(2).getByText('v0.1.0')).toBeVisible()
  })

  test('target-slot mirrors render beside their samples', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    const panels = page.locator('section#target-slots [data-demo-panel]')
    await expect(panels).toHaveCount(2)
    // element-valued arg: the header element renders while the body stays children
    await expect(panels.nth(0).getByText('From a decorator arg.')).toBeVisible()
    await expect(panels.nth(0).getByText('The body is still children.')).toBeVisible()
    // $at: the target landed in the body slot of a self-closing wrapper
    await expect(panels.nth(1).getByText('A named slot.')).toBeVisible()
    await expect(panels.nth(1).getByText('Spliced into body={…}.')).toBeVisible()
  })

  test('the in-tree directive wraps exactly one sibling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    const demo = page.locator('section[data-demo="in-tree"]')
    await expect(demo).toBeVisible()
    // the first sibling landed INSIDE the TintCard div; the second stayed direct
    await expect(demo.locator(':scope > div > p')).toHaveText('Only this sibling is wrapped.')
    await expect(demo.locator(':scope > p')).toHaveText('This one is not.')
  })

  test('module-scope tiles keep their state across parent re-renders', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    const demo = page.locator('section#keyed-tile')
    const tileA = demo.getByRole('button', { name: /tile-a/ })
    await tileA.scrollIntoViewIfNeeded()
    await tileA.click()
    await tileA.click()
    await expect(tileA).toContainText('Clicks: 2')
    await demo.getByRole('button', { name: 'Re-render parent' }).click()
    await expect(demo.getByText('Parent renders: 2')).toBeVisible()
    // identity held: the tiles' local state survived the parent re-render
    await expect(tileA).toContainText('Clicks: 2')
  })

  test('the Slot pair styles the literal Link as a Button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    const link = page.getByRole('link', { name: /back to the homepage/i })
    await link.scrollIntoViewIfNeeded()
    await expect(link).toHaveAttribute('href', '/')
    // Slot cloned the literal Link and injected the Button classes onto it
    await expect(link).toHaveClass(/inline-flex/)
    await link.click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('reference tables render the full rule and error catalogs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs')
    await expect(page.locator('section#lint tbody tr')).toHaveCount(8)
    await expect(page.locator('section#errors tbody tr')).toHaveCount(17)
  })
})
