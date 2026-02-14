import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 5000,
    forceExit: true,
    isolate: true,
    passWithNoTests: true,
    threads: {
      singleThread: true,
      isolate: false,
    },
    pool: {
      threads: 1,
    },
    coverage: {
      provider: 'v8',
      reporter: [],
      enabled: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
