import { defineConfig } from 'vitest/config'
// Same bare-specifier rule as vite.config.ts (externalized → native CJS load).
import reactDecor from 'react-decor/vite'

// Standalone on purpose: a root vitest.config.ts takes priority over vite.config.ts,
// so reactRouter() (and the rest of the app pipeline) never loads under unit tests.
// reactDecor() is registered so the render-proof test imports a decorated fixture
// through the real transform.
export default defineConfig({
  plugins: [reactDecor()],
  test: {
    include: ['lib/react-decor/test/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
