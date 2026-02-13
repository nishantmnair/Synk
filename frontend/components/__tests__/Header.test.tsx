/**
 * Tests for Header component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from '../Header'
import { User } from '../../services/djangoAuth'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User'
}

const renderHeader = (props = {}) => {
  const defaultProps = {
    currentUser: mockUser,
    vibe: 'Feeling adventurous',
    onToggleRightSidebar: vi.fn(),
    isRightSidebarOpen: true,
    onToggleLeftSidebar: vi.fn(),
    isLeftSidebarOpen: true,
    onLogout: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    theme: 'dark' as const,
    onToggleTheme: vi.fn(),
    onSaveDateIdea: vi.fn(),
    showConfirm: vi.fn(),
    isCoupled: false,
    showToast: vi.fn(),
    ...props
  }

  return render(
    <BrowserRouter>
      <Header {...defaultProps} />
    </BrowserRouter>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with user info', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderHeader()
    const searchInput = screen.getByPlaceholderText('Search our world...')
    expect(searchInput).toBeInTheDocument()
  })

  it('updates search query on input', () => {
    const onSearchChange = vi.fn()
    renderHeader({ onSearchChange })
    const searchInput = screen.getByPlaceholderText('Search our world...')
    
    fireEvent.change(searchInput, { target: { value: 'test query' } })
    expect(onSearchChange).toHaveBeenCalledWith('test query')
  })

  it('opens profile dropdown on avatar click', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: /profile/i }))
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders without user', () => {
    renderHeader({ currentUser: null })
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
  })

  it('shows sign out option in profile menu', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: /profile/i }))
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
  })

  it('calls showConfirm when sign out is clicked with coupled status true', () => {
    const showConfirm = vi.fn()
    renderHeader({ isCoupled: true, showConfirm })
    fireEvent.click(screen.getByRole('button', { name: /profile/i }))
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }))
    expect(showConfirm).toHaveBeenCalled()
  })
})
