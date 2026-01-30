/**
 * Tests for PlanDateModal component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PlanDateModal from '../PlanDateModal'
import { User } from '../../services/djangoAuth'

vi.mock('../../services/geminiService', () => ({
  generateDateIdea: vi.fn(),
}))

vi.mock('../../utils/userDisplay', () => ({
  getDisplayName: vi.fn((user: User | null) => (user ? 'Test User' : 'Signed in')),
}))

import * as geminiService from '../../services/geminiService'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  vibe: 'Feeling adventurous',
  currentUser: mockUser,
  onSaveToInbox: vi.fn(),
}

describe('PlanDateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(geminiService.generateDateIdea).mockImplementation(
      () => Promise.resolve({
        title: 'Beach Day',
        description: 'Sun and sand.',
        location: 'Beach',
        category: 'Adventure',
      })
    )
  })

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <PlanDateModal {...defaultProps} isOpen={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows loading state then idea when open', async () => {
    render(<PlanDateModal {...defaultProps} />)
    expect(screen.getByText(/Finding something magical/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Beach Day')).toBeInTheDocument()
    })
    expect(screen.getByText(/Sun and sand/i)).toBeInTheDocument()
    expect(screen.getByText('Beach')).toBeInTheDocument()
    expect(screen.getByText('Adventure')).toBeInTheDocument()
  })

  it('calls generateDateIdea with vibe and hint 0 when opened', async () => {
    render(<PlanDateModal {...defaultProps} vibe="Feeling cozy" />)
    await waitFor(() => {
      expect(geminiService.generateDateIdea).toHaveBeenCalledWith('Feeling cozy', 0)
    })
  })

  it('Try another fetches a new idea with hint', async () => {
    render(<PlanDateModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Beach Day')).toBeInTheDocument()
    })
    vi.mocked(geminiService.generateDateIdea).mockResolvedValueOnce({
      title: 'Movie Night',
      description: 'Cozy at home.',
      location: 'Home',
      category: 'Date idea',
    })
    fireEvent.click(screen.getByRole('button', { name: /Try another/i }))
    await waitFor(() => {
      expect(geminiService.generateDateIdea).toHaveBeenCalledTimes(2)
      expect(geminiService.generateDateIdea).toHaveBeenLastCalledWith('Feeling adventurous', 1)
    })
    await waitFor(() => {
      expect(screen.getByText('Movie Night')).toBeInTheDocument()
    })
  })

  it('Send to Inbox calls onSaveToInbox with payload and onClose', async () => {
    const onSaveToInbox = vi.fn()
    const onClose = vi.fn()
    render(
      <PlanDateModal
        {...defaultProps}
        onSaveToInbox={onSaveToInbox}
        onClose={onClose}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Beach Day')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Send to Inbox/i }))
    expect(onSaveToInbox).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Beach Day',
        description: 'Sun and sand.',
        location: 'Beach',
        category: 'Adventure',
        suggested_by: 'Test User',
        date: 'Soon',
        excitement: 50,
        tags: ['ai', 'date-idea'],
      })
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('Close button calls onClose', async () => {
    const onClose = vi.fn()
    render(<PlanDateModal {...defaultProps} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Beach Day')).toBeInTheDocument()
    })
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    fireEvent.click(closeButtons[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('dialog has accessible title', async () => {
    render(<PlanDateModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /plan a date/i })).toBeInTheDocument()
    })
  })

  it('shows fallback idea on fetch error', async () => {
    vi.mocked(geminiService.generateDateIdea).mockRejectedValueOnce(
      new Error('Network error')
    )
    render(<PlanDateModal {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Cozy Movie Marathon')).toBeInTheDocument()
    })
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })
})
