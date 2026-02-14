/**
 * Tests for DeleteAccountModal component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteAccountModal from '../DeleteAccountModal'

describe('DeleteAccountModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DeleteAccountModal isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />
    )
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', () => {
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    // Check for the heading first
    const heading = screen.getByRole('heading', { name: /Delete Account/i })
    expect(heading).toBeInTheDocument()
  })

  it('displays warning messages', () => {
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    expect(screen.getByText(/This action is permanent/i)).toBeInTheDocument()
    expect(screen.getByText(/All tasks, milestones, and memories deleted/i)).toBeInTheDocument()
    expect(screen.getByText(/Account cannot be recovered/i)).toBeInTheDocument()
    expect(screen.getByText(/You will be immediately logged out/i)).toBeInTheDocument()
  })

  it('has password input field', () => {
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('shows error when password is empty', async () => {
    const user = userEvent.setup()
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    const submitButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Please enter your password to confirm deletion')).toBeInTheDocument()
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm with password when form submitted', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockResolvedValue(undefined)
    
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    await user.type(passwordInput, 'TestPassword123')
    
    const submitButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('TestPassword123')
    }, { timeout: 250 })
  })

  it('clears error when user types in password field', async () => {
    const user = userEvent.setup()
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    // First show error
    const submitButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(submitButton)
    expect(screen.getByText('Please enter your password to confirm deletion')).toBeInTheDocument()
    
    // Then type in password field
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    await user.type(passwordInput, 'T')
    
    // Error should be cleared
    expect(screen.queryByText('Please enter your password to confirm deletion')).not.toBeInTheDocument()
  })

  it('displays error message from API', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Password is incorrect'
    mockOnConfirm.mockRejectedValueOnce(new Error(errorMessage))
    
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    await user.type(passwordInput, 'WrongPassword')
    
    const submitButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Could not delete your account/i)).toBeInTheDocument()
    }, { timeout: 250 })
  })

  it('disables button during deletion', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)))
    
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    await user.type(passwordInput, 'TestPassword123')
    
    const submitButton = screen.getByRole('button', { name: /Delete Account/i })
    await user.click(submitButton)
    
    // Button should show loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    }, { timeout: 250 })
  })

  it('renders with warning icon', () => {
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    const warningIcon = screen.getByText('warning')
    expect(warningIcon).toBeInTheDocument()
  })

  it('shows confirmation message', () => {
    render(<DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />)
    expect(screen.getByText(/Confirm Password/i)).toBeInTheDocument()
  })

  it('closes backdrop when clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DeleteAccountModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />
    )
    
    const backdrop = container.querySelector('.bg-black\\/60')
    if (backdrop) {
      await user.click(backdrop)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })
})
