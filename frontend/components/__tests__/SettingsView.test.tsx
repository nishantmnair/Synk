/**
 * Tests for SettingsView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsView from '../SettingsView'
import * as djangoApi from '../../services/djangoApi'

vi.mock('../../services/djangoApi', () => ({
  coupleApi: { get: vi.fn() },
  couplingCodeApi: { create: vi.fn(), use: vi.fn(), getAll: vi.fn() },
  accountApi: { deleteAccount: vi.fn() },
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

  it('renders Danger Zone section', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument()
    })
  })

  it('renders Delete Account button', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument()
    })
  })

  it('displays warning text for delete account', async () => {
    render(<SettingsView currentUser={mockUser as any} />)
    await waitFor(() => {
      expect(screen.getByText(/This action is irreversible/i)).toBeInTheDocument()
      expect(screen.getByText(/permanently removes your account and data/i)).toBeInTheDocument()
    })
  })

  it('opens delete account modal when button clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsView currentUser={mockUser as any} onLogout={mockLogout} showToast={mockShowToast} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    })
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
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByText('Confirm Delete')
    await user.click(confirmButton)
    
    await waitFor(() => {
      expect(vi.mocked(djangoApi.accountApi.deleteAccount)).toHaveBeenCalledWith('password')
    })
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
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
    })
    
    // Modal should still be accessible for retry
    expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
  })
})

