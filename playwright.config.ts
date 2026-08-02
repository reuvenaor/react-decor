import { defineConfig, devices } from '@playwright/test'

// Per-run ports so parallel runs don't collide — PW_PORT (react-router dev
// server, default 5173) and PW_NEXT_PORT (static server over the Next export,
// default 3000). Standalone `npx playwright test` uses the defaults.
const rrPort = Number(process.env.PW_PORT ?? 5173)
const rrBaseURL = `http://localhost:${rrPort}`
const nextPort = Number(process.env.PW_NEXT_PORT ?? 3000)
const nextBaseURL = `http://localhost:${nextPort}`

export default defineConfig({
  testDir: 'e2e',
  // Under CI: fail on a stray test.only, and give a transient flake exactly one
  // retry — a real failure still fails twice.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Machine-readable JSON report alongside the list reporter (PLAYWRIGHT_JSON
  // overrides the output path).
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON ?? 'test-results/report.json' }],
  ],
  use: {
    // Capture a screenshot at the end of every test; trace only on failure.
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'off',
  },
  // The SAME specs run against both example apps — the parity proof that the
  // shared react-decor sections compose identically under react-router and Next.
  projects: [
    { name: 'react-router', use: { ...devices['Desktop Chrome'], baseURL: rrBaseURL } },
    { name: 'nextjs', use: { ...devices['Desktop Chrome'], baseURL: nextBaseURL } },
  ],
  // Playwright owns both server lifecycles. react-router runs its dev server
  // (the proven setup); the Next app is tested as its REAL static export —
  // `next build` then a static file server over out/ — which also exercises the
  // SSG HTML + hydration and stays immune to dev-overlay console noise.
  webServer: [
    {
      command: `npm run dev -w examples/react-router -- --port ${rrPort}`,
      url: rrBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // Single npm level so the appended args reach the app script's final
      // command (serve): `next build && serve out -n` + `-l <port>`.
      command: `npm run e2e:serve -w examples/nextjs -- -l ${nextPort}`,
      url: nextBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
