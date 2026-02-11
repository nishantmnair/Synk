import { expect, afterEach, vi, beforeEach, afterAll } from 'vitest'
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
  vi.clearAllTimers()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear all mocks
  vi.clearAllMocks()
  // Clear all timers
  vi.clearAllTimers()
  // Restore all stubs
  vi.restoreAllMocks()
})

// Final cleanup after all tests
afterAll(() => {
  cleanup()
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.restoreAllMocks()
})





