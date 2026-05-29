import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globalSetup: ['./vitest.globalSetup.ts'],
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // The local miniflare D1 is a single SQLite file; running test files in
    // parallel makes each open its own miniflare instance -> SQLITE_BUSY / runtime
    // failed to start. Serialize files so only one D1 connection is live at a time.
    fileParallelism: false,
  },
})
