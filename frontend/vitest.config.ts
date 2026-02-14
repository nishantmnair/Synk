import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    forceExit: true,
    isolate: true,
    passWithNoTests: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['json'],
      reportsDirectory: './coverage',
      enabled: false,
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
} as any)
