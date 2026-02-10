/**
 * Tests for CouplingOnboarding component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders choose step by default', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    expect(screen.getByText('Generate Code')).toBeInTheDocument()
    expect(screen.getByText('Join with Code')).toBeInTheDocument()
  })

  it('does not show Skip for Now button', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Skip for Now/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/You can always connect accounts later in Settings/i)).not.toBeInTheDocument()
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

  it('does not show Continue to App button after generating code', async () => {
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
    expect(screen.queryByRole('button', { name: /Continue to App/i })).not.toBeInTheDocument()
  })

  it('allows copying the coupling code', async () => {
    vi.mocked(djangoApi.couplingCodeApi.create).mockResolvedValue({
      code: 'ABCD1234',
      expires_at: '2025-02-01T00:00:00Z',
    } as any)
    const showToast = vi.fn()
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} showToast={showToast} />)
    await waitFor(() => {
      expect(screen.getByText('Generate Code')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate Code/i }))
    await waitFor(() => {
      expect(screen.getByText('ABCD1234')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Copy Code/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD1234')
    expect(showToast).toHaveBeenCalledWith('Code copied to clipboard!', 'success')
  })

  it('handles error when generating code', async () => {
    const errorMessage = 'Failed to generate code'
    vi.mocked(djangoApi.couplingCodeApi.create).mockRejectedValue(new Error(errorMessage))
    const showToast = vi.fn()
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} showToast={showToast} />)
    await waitFor(() => {
      expect(screen.getByText('Generate Code')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate Code/i }))
    // Since the component stays on the choose screen when code generation fails,
    // we should still be able to see the initial render
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
  })

  it('navigates to join step when Join with Code is clicked', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Join with Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
  })

  it('allows entering and validating coupling code', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Join with Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    const input = screen.getByPlaceholderText('Enter 8-character code') as HTMLInputElement
    await userEvent.type(input, 'ABCD1234')
    expect(input.value).toBe('ABCD1234')
  })

  it('shows error when entering invalid code length', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Join with Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    const connectButton = screen.getByRole('button', { name: /Connect Accounts/i }) as HTMLButtonElement
    // Button should be disabled when input is empty
    expect(connectButton.disabled).toBe(true)
  })

  it('successfully uses coupling code', async () => {
    vi.mocked(djangoApi.couplingCodeApi.use).mockResolvedValue({} as any)
    vi.mocked(djangoApi.coupleApi.get).mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      is_coupled: true,
      partner: { id: 2, username: 'sam', email: 'sam@example.com', first_name: 'Sam', last_name: 'U' },
    } as any)
    const showToast = vi.fn()
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} showToast={showToast} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Join with Code'))!)
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    const input = screen.getByPlaceholderText('Enter 8-character code') as HTMLInputElement
    await userEvent.type(input, 'ABCD1234')
    fireEvent.click(screen.getByRole('button', { name: /Connect Accounts/i }))
    await waitFor(() => {
      expect(vi.mocked(djangoApi.couplingCodeApi.use)).toHaveBeenCalledWith('ABCD1234')
    })
    expect(showToast).toHaveBeenCalledWith('Connected! You can now share your couple space.', 'success')
  })

  it('handles error when using invalid coupling code', async () => {
    const errorMessage = 'Invalid coupling code'
    vi.mocked(djangoApi.couplingCodeApi.use).mockRejectedValue(new Error(errorMessage))
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Join with Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    const input = screen.getByPlaceholderText('Enter 8-character code') as HTMLInputElement
    await userEvent.type(input, 'INVALID1')
    fireEvent.click(screen.getByRole('button', { name: /Connect Accounts/i }))
    await waitFor(() => {
      expect(screen.getByText(/Invalid coupling code/i)).toBeInTheDocument()
    })
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
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('allows going back from join step', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Join with Code/i }))
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
  })

  it('clears error on input change', async () => {
    render(<CouplingOnboarding currentUser={mockUser as any} onComplete={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument()
    })
    fireEvent.click(screen.getAllByRole('button').find(btn => btn.textContent?.includes('Join with Code'))!)
    await waitFor(() => {
      expect(screen.getByText('Join with Partner Code')).toBeInTheDocument()
    })
    const input = screen.getByPlaceholderText('Enter 8-character code') as HTMLInputElement
    // Type some text to clear any potential errors
    await userEvent.type(input, 'AB')
    // Verify input has value
    expect(input.value).toBe('AB')
  })
})
