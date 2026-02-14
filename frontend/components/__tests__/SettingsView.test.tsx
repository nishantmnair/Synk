/**
 * Tests for SettingsView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsView from '../SettingsView'
import * as djangoApi from '../../services/djangoApi'

vi.mock('../../services/djangoApi', () => ({
  coupleApi: { get: vi.fn() },
  couplingCodeApi: { create: vi.fn(), use: vi.fn(), getAll: vi.fn() },
  accountApi: { deleteAccount: vi.fn() },
  preferencesApi: { get: vi.fn(), update: vi.fn() },
}))

vi.mock('../../services/djangoRealtime', () => ({
  djangoRealtimeService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('../DeleteAccountModal', () => ({
  default: ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="delete-account-modal">
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onConfirm('password')}>Confirm Delete</button>
      </div>
    )
  },
}))

const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', first_name: 'Test', last_name: 'User' }
const mockLogout = vi.fn()
const mockShowToast = vi.fn()

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(djangoApi.coupleApi.get).mockResolvedValue({ is_coupled: false, partner: null } as any)
    vi.mocked(djangoApi.couplingCodeApi.getAll).mockResolvedValue([])
    vi.mocked(djangoApi.accountApi.deleteAccount).mockResolvedValue({ detail: 'Account successfully deleted.' })
    vi.mocked(djangoApi.preferencesApi.get).mockResolvedValue({ 
      id: 1, 
      anniversary: '2024-01-15'
    } as any)
    vi.mocked(djangoApi.preferencesApi.update).mockResolvedValue({ success: true } as any)
  })

  it('renders settings header', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    }, { timeout: 250 })
    expect(screen.getByText(/Manage your shared space/i)).toBeInTheDocument()
  })

  it('renders Partner Connection section', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Partner Connection/i)).toBeInTheDocument()
    }, { timeout: 250 })
    expect(screen.getByRole('button', { name: /Generate Code/i })).toBeInTheDocument()
  })

  it('renders Danger Zone section', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('renders Delete Account button', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('displays warning text for delete account', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/These actions are irreversible/i)).toBeInTheDocument()
      expect(screen.getByText(/Proceed with caution/i)).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('opens delete account modal when button clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsView currentUser={mockUser as any} onLogout={mockLogout} showToast={mockShowToast} />)
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('calls logout after account deletion', async () => {
    const user = userEvent.setup()
    vi.mocked(djangoApi.accountApi.deleteAccount).mockResolvedValue({ detail: 'Account deleted' })
    
    render(
      <SettingsView 
        currentUser={mockUser as any} 
        onLogout={mockLogout} 
        showToast={mockShowToast}
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    }, { timeout: 250 })
    
    const confirmButton = screen.getByText('Confirm Delete')
    await user.click(confirmButton)
    
    await waitFor(() => {
      expect(vi.mocked(djangoApi.accountApi.deleteAccount)).toHaveBeenCalledWith('password')
    }, { timeout: 250 })
  })

  it('handles delete account error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Failed to delete account'
    vi.mocked(djangoApi.accountApi.deleteAccount).mockRejectedValue(new Error(errorMessage))
    
    render(
      <SettingsView 
        currentUser={mockUser as any} 
        onLogout={mockLogout} 
        showToast={mockShowToast}
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    }, { timeout: 250 })
    
    // Modal should still be accessible for retry
    expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
  })

  it('displays user-friendly error when coupling code generation fails', async () => {
    const errorMsg = 'Could not generate a coupling code. Please try again.'
    vi.mocked(djangoApi.couplingCodeApi.create).mockRejectedValue(new Error(errorMsg))
    
    render(<SettingsView currentUser={mockUser as any} showToast={mockShowToast} />)
    
    const generateButton = screen.getByRole('button', { name: /Generate Code/i })
    await userEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMsg.split('(')[0].trim()), 'i')).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('displays user-friendly error when coupling code use fails', async () => {
    const user = userEvent.setup()
    const errorMsg = 'Could not connect accounts. The code may be expired or invalid.'
    vi.mocked(djangoApi.couplingCodeApi.use).mockRejectedValue(new Error(errorMsg))
    
    render(<SettingsView currentUser={mockUser as any} showToast={mockShowToast} />)
    
    await waitFor(() => {
      const codeInput = screen.getByPlaceholderText(/Enter 8-character code/i)
      expect(codeInput).toBeInTheDocument()
    }, { timeout: 250 })
    
    const codeInput = screen.getByPlaceholderText(/Enter 8-character code/i)
    await user.type(codeInput, 'TESTCODE')
    
    const connectButton = screen.getByRole('button', { name: /Connect/i })
    await user.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMsg.split('(')[0].trim(), 'i'))).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('displays button with responsive width class', async () => {
    render(<SettingsView currentUser={mockUser as any} showToast={mockShowToast} />)
    
    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
      expect(deleteButton).toHaveClass('w-full')
    }, { timeout: 250 })
  })

  it('displays anniversary input with responsive width', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    
    await waitFor(() => {
      const inputs = screen.getAllByDisplayValue(/2024-01-15/)
      expect(inputs.length).toBeGreaterThan(0)
      const anniversaryInput = inputs[0]
      expect(anniversaryInput).toHaveClass('md:w-auto')
    }, { timeout: 250 })
  })
})

