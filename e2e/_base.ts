import { test as base, expect, type Page, type Locator } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Shared Playwright base fixture. Every spec imports `{ test, expect }` from THIS
 * module (not directly from '@playwright/test') so the cross-cutting concerns below
 * apply automatically.
 *
 * The `consoleErrors` fixture is `auto: true` — it runs for every test even when the
 * test doesn't reference it — and attaches any browser console errors / uncaught
 * page errors as a `console-errors` attachment, backing the zero-console-errors
 * discipline (specs also assert on it directly where it matters).
 */
export const test = base.extend<{ consoleErrors: string[]; ariaOnFailure: void }>({
  consoleErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))
      await use(errors)
      if (errors.length > 0) {
        await testInfo.attach('console-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        })
      }
    },
    { auto: true },
  ],
  // On a FAILED test, attach the page's rendered accessibility tree (roles +
  // accessible names) as an `aria-snapshot` — the fastest way to repair a locator
  // against the app's REAL names. Failure-only and best-effort.
  ariaOnFailure: [
    async ({ page }, use, testInfo) => {
      await use()
      if (testInfo.status !== testInfo.expectedStatus) {
        try {
          await testInfo.attach('aria-snapshot', {
            body: await page.locator('body').ariaSnapshot(),
            contentType: 'text/yaml',
          })
        } catch {
          // page may be closed/navigated after the failure — skip.
        }
      }
    },
    { auto: true },
  ],
})

export { expect }

// Re-export the Playwright object types so specs type their OWN helpers from this
// single `./_base` source — the lint-clean alternative to an inline
// `import('@playwright/test').Page` annotation, which is valid TypeScript but
// forbidden by `@typescript-eslint/consistent-type-imports`.
export type { Page, Locator }

/**
 * Run an axe-core WCAG 2.1 A/AA scan on the current page and return the
 * violations array (empty = clean):
 *   expect(await a11yScan(page)).toEqual([])
 */
export async function a11yScan(
  page: Page,
  options: { exclude?: string[]; disableRules?: string[] } = {},
) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector)
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules)
  const { violations } = await builder.analyze()
  return violations
}
