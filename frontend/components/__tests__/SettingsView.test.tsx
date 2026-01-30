/**
 * Tests for SettingsView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SettingsView from '../SettingsView'
import * as djangoApi from '../../services/djangoApi'

vi.mock('../../services/djangoApi', () => ({
  coupleApi: { get: vi.fn() },
  couplingCodeApi: { create: vi.fn(), use: vi.fn(), getAll: vi.fn() },
}))

const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', first_name: 'Test', last_name: 'User' }

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(djangoApi.coupleApi.get).mockResolvedValue({ is_coupled: false, partner: null } as any)
    vi.mocked(djangoApi.couplingCodeApi.getAll).mockResolvedValue([])
  })

  it('renders settings header', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    expect(screen.getByText(/Manage your shared space/i)).toBeInTheDocument()
  })

  it('renders Partner Connection section', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Partner Connection/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Generate Code/i })).toBeInTheDocument()
  })
})
