/**
 * Tests for CouplingOnboarding component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CouplingOnboarding from '../CouplingOnboarding'
import * as djangoApi from '../../services/djangoApi'

vi.mock('../../services/djangoApi', () => ({
  coupleApi: { get: vi.fn() },
  couplingCodeApi: { create: vi.fn(), use: vi.fn() },
}))

const mockUser = { id: 1, username: 'alex', email: 'alex@example.com', first_name: 'Alex', last_name: 'U' }

describe('CouplingOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(djangoApi.coupleApi.get).mockRejectedValue(new Error('Not coupled'))
  })

  it('renders choose step by default', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
  })

  it('calls onComplete when Skip for Now is clicked', async () => {
    const onComplete = vi.fn()
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={onComplete} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Skip for Now/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Skip for Now/i }))
    expect(onComplete).toHaveBeenCalled()
  })

  it('shows generate step after generating code', async () => {
    vi.mocked(djangoApi.couplingCodeApi.create).mockResolvedValue({
      code: 'ABCD1234',
      expires_at: '2025-02-01T00:00:00Z',
    } as any)
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Generate Code')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Share Your Coupling Code')).toBeInTheDocument()
    })
    expect(screen.getByText('ABCD1234')).toBeInTheDocument()
  })

  it('shows You\'re Connected when already coupled', async () => {
    vi.mocked(djangoApi.coupleApi.get).mockResolvedValue({
      is_coupled: true,
      partner: { id: 2, username: 'sam', email: 'sam@example.com', first_name: 'Sam', last_name: 'U' },
    } as any)
    const onComplete = vi.fn()
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={onComplete} />)
    await waitFor(() => {
      expect(screen.getByText("You're Connected!")).toBeInTheDocument()
    })
  })
})
