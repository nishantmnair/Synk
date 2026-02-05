/**
 * Tests for CollectionView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CollectionView from '../CollectionView'
import { TaskStatus } from '../../types'

const mockOnAddTask = vi.fn()

const defaultCollections = [
  { id: '1', name: 'Adventure', icon: 'hiking', color: '#6366f1' },
  { id: '2', name: 'Food', icon: 'restaurant', color: '#10b981' },
]

const defaultTasks: any[] = []

const renderWithRouter = (collectionId: string, tasks = defaultTasks, collections = defaultCollections) => {
  return render(
    <MemoryRouter initialEntries={[`/collection/${collectionId}`]}>
      <Routes>
        <Route
          path="/collection/:collectionId"
          element={
            <CollectionView
              tasks={tasks}
              collections={collections}
              onAddTask={mockOnAddTask}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('CollectionView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders collection not found when collectionId does not match', () => {
    renderWithRouter('999')
    expect(screen.getByText(/Collection not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to Board/i })).toBeInTheDocument()
  })

  it('renders collection header when collection exists', () => {
    renderWithRouter('1')
    expect(screen.getByText('Adventure')).toBeInTheDocument()
    expect(screen.getByText(/shared items in this collection/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quick Add Idea/i })).toBeInTheDocument()
  })

  it('renders empty state when no tasks in collection', () => {
    renderWithRouter('1')
    expect(screen.getByText(/No items here yet/i)).toBeInTheDocument()
  })

  it('renders tasks when collection has matching category tasks', () => {
    const tasks = [
      {
        id: 't1',
        title: 'Hiking trip',
        category: 'Adventure',
        priority: 'medium' as const,
        status: TaskStatus.BACKLOG,
        liked: false,
        fired: false,
        progress: 0,
        alexProgress: 0,
        samProgress: 0,
        avatars: [],
      },
    ]
    renderWithRouter('1', tasks)
    expect(screen.getByText('Hiking trip')).toBeInTheDocument()
    expect(screen.getByText(/1 shared items/)).toBeInTheDocument()
  })

  it('Quick Add Idea button opens modal and calls onAddTask when title entered', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByRole('button', { name: /Quick Add Idea/i }))
    
    // Modal should be visible
    expect(screen.getByPlaceholderText(/What.*idea do you have/i)).toBeInTheDocument()
    
    // Enter text in the input
    const input = screen.getByPlaceholderText(/What.*idea do you have/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New hiking idea' } })
    
    // Click the Add button
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }))
    
    // Verify onAddTask was called
    expect(mockOnAddTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New hiking idea',
        category: 'Adventure',
        status: TaskStatus.BACKLOG,
      })
    )
  })

  it('Quick Add Idea modal closes when Cancel button is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByRole('button', { name: /Quick Add Idea/i }))
    
    // Modal input should be visible
    expect(screen.getByPlaceholderText(/What.*idea do you have/i)).toBeInTheDocument()
    
    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    
    // Verify onAddTask was not called
    expect(mockOnAddTask).not.toHaveBeenCalled()
  })
})
