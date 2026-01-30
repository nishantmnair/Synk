/**
 * Tests for AuthView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthView from '../AuthView'

const mockOnLogin = vi.fn()
const mockOnSignup = vi.fn()

const renderAuthView = () => {
  return render(
    <AuthView onLogin={mockOnLogin} onSignup={mockOnSignup} />
  )
}

describe('AuthView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in form by default', () => {
    renderAuthView()
    expect(screen.getByPlaceholderText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Sign Up/i }).length).toBeGreaterThan(0)
  })

  it('toggles between sign-in and sign-up', async () => {
    renderAuthView()
    const toggles = screen.getAllByRole('button', { name: /Sign Up/i })
    fireEvent.click(toggles[0])
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('validates email on signup', async () => {
    renderAuthView()
    fireEvent.click(screen.getAllByRole('button', { name: /Sign Up/i })[0])
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    })
    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    const passwordInput = screen.getByPlaceholderText(/at least 8 characters/i)
    const confirmInput = screen.getByPlaceholderText(/confirm password/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.submit(emailInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password length on signup', async () => {
    renderAuthView()
    fireEvent.click(screen.getAllByRole('button', { name: /Sign Up/i })[0])
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'short' } })
    const form = screen.getByPlaceholderText(/at least 8 characters/i).closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
    })
  })

  it('handles login submission', async () => {
    mockOnLogin.mockResolvedValueOnce(undefined)
    renderAuthView()
    fireEvent.change(screen.getByPlaceholderText(/email or username/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'testpass123' } })
    fireEvent.submit(screen.getByPlaceholderText(/email or username/i).closest('form')!)
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'testpass123')
    })
  })
})
