/**
 * Tests for MemoriesView component
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemoriesView from '../MemoriesView'

describe('MemoriesView', () => {
  const mockSetMemories = vi.fn()
  const mockShowToast = vi.fn()

  it.skip('renders header and empty state', () => {
    render(<MemoriesView memories={[]} setMemories={mockSetMemories} showToast={mockShowToast} />)
    expect(screen.getByText('Memories')).toBeInTheDocument()
    expect(screen.getByText(/Relive your shared moments/i)).toBeInTheDocument()
    expect(screen.getByText('No memories yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Your First Memory/i })).toBeInTheDocument()
  })

  it.skip('has grid and list view toggle', () => {
    render(<MemoriesView memories={[]} setMemories={mockSetMemories} showToast={mockShowToast} />)
    const gridBtn = screen.getByRole('button', { name: /grid_view|grid/i })
    const listBtn = screen.getByRole('button', { name: /list/i })
    expect(gridBtn).toBeInTheDocument()
    expect(listBtn).toBeInTheDocument()
    fireEvent.click(listBtn)
    expect(listBtn).toHaveClass(/bg-accent|accent/)
  })

  it.skip('has Add Memory button', () => {
    render(<MemoriesView memories={[]} setMemories={mockSetMemories} showToast={mockShowToast} />)
    expect(screen.getByRole('button', { name: /Add Memory/i })).toBeInTheDocument()
  })
})
