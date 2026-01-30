/**
 * Tests for InboxView component
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InboxView from '../InboxView'

const mockSuggestions = [
  {
    id: '1',
    title: 'Beach day',
    suggestedBy: 'Sam',
    date: 'Tomorrow',
    description: 'Fun in the sun',
    location: 'Beach',
    category: 'Adventure',
    excitement: 5,
    tags: [],
  },
]

const noop = vi.fn()

describe('InboxView', () => {
  it('renders inbox content when suggestions provided', () => {
    render(<InboxView suggestions={mockSuggestions} onAccept={noop} onSave={noop} onDecline={noop} />)
    expect(screen.getAllByText('Beach day').length).toBeGreaterThan(0)
    expect(screen.getByText(/Partner Suggestions/i)).toBeInTheDocument()
  })

  it('renders empty state when no suggestions', () => {
    render(<InboxView suggestions={[]} onAccept={noop} onSave={noop} onDecline={noop} />)
    expect(screen.getByText(/No suggestions to review/i)).toBeInTheDocument()
  })

  it('shows Accept / Save / Decline actions', () => {
    render(<InboxView suggestions={mockSuggestions} onAccept={noop} onSave={noop} onDecline={noop} />)
    expect(screen.getByRole('button', { name: /Accept to Planning/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument()
  })
})
