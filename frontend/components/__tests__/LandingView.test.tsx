/**
 * Tests for LandingView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LandingView from '../LandingView'

const mockOnLogin = vi.fn()
const mockOnSignup = vi.fn()

const renderLandingView = () => {
  return render(
    <BrowserRouter>
      <LandingView onLogin={mockOnLogin} onSignup={mockOnSignup} />
    </BrowserRouter>
  )
}

describe('LandingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders landing page', () => {
    renderLandingView()
    // Landing page should render - check for sign in button
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('toggles between login and signup', async () => {
    renderLandingView()
    
    // Click Sign In to open modal
    const signInButtons = screen.getAllByText('Sign In')
    const navSignInButton = signInButtons.find(btn => btn.closest('nav')) || signInButtons[0]
    fireEvent.click(navSignInButton)
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Click the "Sign Up" button in the toggle (not the link)
    const signUpToggleButton = screen.getByRole('button', { name: /^Sign Up$/i })
    fireEvent.click(signUpToggleButton)
    
    // Wait for signup form to appear (check for signup form fields)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/At least 8 characters/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('validates email on signup', async () => {
    renderLandingView()
    
    // Click Sign In to open modal
    const signInButtons = screen.getAllByText('Sign In')
    const navSignInButton = signInButtons.find(btn => btn.closest('nav')) || signInButtons[0]
    fireEvent.click(navSignInButton)
    
    // Wait for modal and switch to signup
    await waitFor(() => {
      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Click "Sign up here" link
    const signUpLink = screen.getByText(/Sign up here/i)
    fireEvent.click(signUpLink)
    
    // Wait for signup form
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    // Fill in password fields to satisfy form requirements
    const passwordInput = screen.getByPlaceholderText(/At least 8 characters/i)
    const passwordConfirmInput = screen.getByPlaceholderText(/Confirm your password/i)
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(passwordConfirmInput, { target: { value: 'password123' } })
    
    // Submit form
    const form = emailInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    }
    
    await waitFor(() => {
      // Error message should appear
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('validates password length', async () => {
    renderLandingView()
    
    // Click Sign In to open modal
    const signInButtons = screen.getAllByText('Sign In')
    const navSignInButton = signInButtons.find(btn => btn.closest('nav')) || signInButtons[0]
    fireEvent.click(navSignInButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Sign Up$/i })).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Switch to signup
    const signUpToggleButton = screen.getByRole('button', { name: /^Sign Up$/i })
    fireEvent.click(signUpToggleButton)
    
    // Wait for signup form to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/At least 8 characters/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Fill in required fields
    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    const passwordInput = screen.getByPlaceholderText(/At least 8 characters/i)
    const passwordConfirmInput = screen.getByPlaceholderText(/Confirm your password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.change(passwordConfirmInput, { target: { value: 'short' } })
    
    // Submit form to trigger validation
    const form = emailInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    }
    
    // Password validation happens on submit, check for error message
    await waitFor(() => {
      // Error message should appear
      expect(screen.getByText(/Password must be at least 8 characters long/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles login submission', async () => {
    mockOnLogin.mockResolvedValueOnce(undefined)
    
    renderLandingView()
    
    // Click Sign In button in nav to open modal
    const loginButton = screen.getAllByText('Sign In').find(btn => btn.closest('nav')) || screen.getAllByText('Sign In')[0]
    fireEvent.click(loginButton)
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    const passwordInput = screen.getByPlaceholderText(/enter your password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } })
    
    // Find the form and submit it
    const form = emailInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      // Fallback: find submit button
      const submitButton = screen.getAllByRole('button').find(btn => btn.type === 'submit')
      if (submitButton) {
        fireEvent.click(submitButton)
      }
    }
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'testpass123')
    }, { timeout: 3000 })
  })
})
