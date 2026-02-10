import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    testTimeout: 15000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    forceExit: true,
    isolate: true,
    threads: {
      singleThread: true,
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
