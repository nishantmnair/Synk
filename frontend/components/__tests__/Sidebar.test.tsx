/**
 * Tests for Sidebar component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

const mockOnAddCollection = vi.fn()
const mockOnToggle = vi.fn()

const defaultCollections = [
  { id: '1', name: 'Adventure', icon: 'hiking', color: '#6366f1' },
]

const renderSidebar = (initialPath = '/today') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar
        vibe="Feeling adventurous"
        collections={defaultCollections}
        onAddCollection={mockOnAddCollection}
        onToggle={mockOnToggle}
      />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Synk brand and nav links', () => {
    renderSidebar()
    expect(screen.getByText('Synk')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inbox/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Today/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Board/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Memories/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Milestones/i })).toBeInTheDocument()
  })

  it('calls onToggle when collapse button clicked', () => {
    renderSidebar()
    const toggleBtn = screen.getByTitle(/Collapse Navigation/i)
    fireEvent.click(toggleBtn)
    expect(mockOnToggle).toHaveBeenCalled()
  })

  it('shows Collections section', () => {
    renderSidebar()
    expect(screen.getByText(/Collections/i)).toBeInTheDocument()
  })

  it('opens add collection modal and calls onAddCollection when form submitted', () => {
    renderSidebar()
    const addButtons = screen.getAllByRole('button')
    const addIconBtn = addButtons.find(b => b.textContent === 'add' || b.getAttribute('title') === 'add')
    expect(addIconBtn).toBeTruthy()
    fireEvent.click(addIconBtn!)
    expect(screen.getByText('New Collection')).toBeInTheDocument()
    const input = screen.getByPlaceholderText(/e\.g\., Home Projects/i)
    fireEvent.change(input, { target: { value: 'Food' } })
    fireEvent.click(screen.getByRole('button', { name: /Create/i }))
    expect(mockOnAddCollection).toHaveBeenCalledWith('Food', expect.any(String))
  })
})
