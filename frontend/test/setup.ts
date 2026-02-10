import { expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Cleanup after each test
afterEach(async () => {
  cleanup()
  // Ensure any pending updates are flushed
  await new Promise(resolve => setTimeout(resolve, 0))
  // Clear all mocks
  vi.clearAllMocks()
  // Try to run all pending timers if in fake timer mode
  try {
    vi.runAllTimers()
  } catch {
    // Not in fake timer mode, ignore
  }
  // Clear all timers
  vi.clearAllTimers()
  // Switch back to real timers if needed
  try {
    vi.useRealTimers()
  } catch {
    // Already using real timers, ignore
  }
})




