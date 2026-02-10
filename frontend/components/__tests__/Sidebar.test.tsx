/**
 * Tests for Sidebar component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

const mockOnAddCollection = vi.fn()
const mockOnDeleteCollection = vi.fn()
const mockOnToggle = vi.fn()

const defaultCollections = [
  { id: '1', name: 'Adventure', icon: 'hiking', color: '#6366f1' },
  { id: '2', name: 'Food', icon: 'restaurant', color: '#ff6b6b' },
]

const renderSidebar = (initialPath = '/today') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar
        collections={defaultCollections}
        onAddCollection={mockOnAddCollection}
        onDeleteCollection={mockOnDeleteCollection}
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

  it('renders favicon with correct properties', () => {
    renderSidebar()
    const favicon = screen.getByAltText('Synk')
    expect(favicon).toBeInTheDocument()
    expect(favicon).toHaveAttribute('src', '/Synk-Favicon.png')
  })

  it('favicon has explicit sizing for crisp rendering', () => {
    renderSidebar()
    const favicon = screen.getByAltText('Synk') as HTMLImageElement
    expect(favicon.style.width).toBe('30px')
    expect(favicon.style.height).toBe('30px')
    expect(favicon.style.imageRendering).toBe('crisp-edges')
  })

  it('favicon link navigates to home page with transparent background', () => {
    renderSidebar()
    const link = screen.getByRole('link', { name: /Synk/i })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveAttribute('title', 'Home')
    expect(link.style.background).toBe('transparent')
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

  it('shows context menu on right-click of collection', () => {
    renderSidebar()
    const adventureLink = screen.getByRole('link', { name: /Adventure/i })
    fireEvent.contextMenu(adventureLink.closest('div')!)
    const deleteButtons = screen.getAllByText(/Delete/i)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('calls onDeleteCollection when delete is clicked from context menu', async () => {
    mockOnDeleteCollection.mockResolvedValue(undefined)
    renderSidebar()
    const adventureLink = screen.getByRole('link', { name: /Adventure/i })
    fireEvent.contextMenu(adventureLink.closest('div')!)
    
    // The context menu delete button
    const deleteButton = screen.getAllByText(/Delete/i)[0]
    fireEvent.click(deleteButton)
    
    // Wait a bit for async handlers
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(mockOnDeleteCollection).toHaveBeenCalledWith('1')
  })

  it('closes context menu when clicking outside', async () => {
    renderSidebar()
    const adventureLink = screen.getByRole('link', { name: /Adventure/i })
    fireEvent.contextMenu(adventureLink.closest('div')!)
    
    // The context menu should have a delete button
    let contextMenuOverlay = document.querySelector('.fixed.inset-0.z-40')
    expect(contextMenuOverlay).toBeTruthy()
    
    // Click the overlay to close the context menu
    fireEvent.click(contextMenuOverlay!)
    
    // Wait a bit for state update
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Context menu overlay should be gone
    contextMenuOverlay = document.querySelector('.fixed.inset-0.z-40')
    expect(contextMenuOverlay).toBeFalsy()
  })
})
