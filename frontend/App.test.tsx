/**
 * Tests for App component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as djangoAuth from './services/djangoAuth'
import * as djangoRealtime from './services/djangoRealtime'

vi.mock('./services/djangoAuth', () => ({
  djangoAuthService: {
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {}),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('./services/djangoRealtime', () => ({
  djangoRealtimeService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
  },
}))

vi.mock('./services/djangoApi', () => ({
  tasksApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  milestonesApi: { getAll: vi.fn().mockResolvedValue([]) },
  activitiesApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn() },
  suggestionsApi: { getAll: vi.fn().mockResolvedValue([]) },
  collectionsApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn() },
  preferencesApi: { get: vi.fn().mockResolvedValue(null) },
}))

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(djangoAuth.djangoAuthService.getCurrentUser).mockResolvedValue(null)
    vi.mocked(djangoAuth.djangoAuthService.onAuthStateChange).mockImplementation(() => {
      return () => {}
    })
  })

  it('shows loading then AuthView when user is not logged in', async () => {
    render(<App />)
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email or username/i)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('button', { name: /Sign Up/i }).length).toBeGreaterThan(0)
  })

  it('shows main app with Sidebar and Today when user is logged in', async () => {
    vi.mocked(djangoAuth.djangoAuthService.getCurrentUser).mockResolvedValue(mockUser as any)
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Synk')).toBeInTheDocument()
    }, { timeout: 3000 })
    await waitFor(() => {
      expect(screen.getByText('Your Shared Space in Synk')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(djangoRealtime.djangoRealtimeService.connect).toHaveBeenCalled()
  })
})
