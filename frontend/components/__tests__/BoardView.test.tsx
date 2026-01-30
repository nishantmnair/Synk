/**
 * Tests for BoardView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoardView from '../BoardView'
import { TaskStatus } from '../../types'

const mockSetTasks = vi.fn()
const mockOnAction = vi.fn()
const mockOnAddTask = vi.fn()
const mockOnUpdateTask = vi.fn()
const mockOnDeleteTask = vi.fn()

const defaultTasks = [
  {
    id: '1',
    title: 'Test Task',
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

const renderBoardView = (tasks = defaultTasks) => {
  return render(
    <BoardView
      tasks={tasks}
      setTasks={mockSetTasks}
      onAction={mockOnAction}
      onAddTask={mockOnAddTask}
      onUpdateTask={mockOnUpdateTask}
      onDeleteTask={mockOnDeleteTask}
    />
  )
}

describe('BoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('alert', vi.fn())
  })

  it('renders column headers', () => {
    renderBoardView()
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('renders tasks in correct column', () => {
    renderBoardView()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('opens add modal when add button in column clicked', () => {
    renderBoardView()
    const addBtns = screen.getAllByRole('button', { name: /add/i })
    fireEvent.click(addBtns[0])
    expect(screen.getByText(/New Shared Plan/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\., Weekend trip/i)).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    renderBoardView([])
    expect(screen.getByText('Backlog')).toBeInTheDocument()
  })
})
