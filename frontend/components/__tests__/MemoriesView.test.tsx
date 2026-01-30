/**
 * Tests for MemoriesView component
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemoriesView from '../MemoriesView'

describe('MemoriesView', () => {
  it('renders header and empty state', () => {
    render(<MemoriesView />)
    expect(screen.getByText('Memories')).toBeInTheDocument()
    expect(screen.getByText(/Relive your shared moments/i)).toBeInTheDocument()
    expect(screen.getByText('No memories yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Your First Memory/i })).toBeInTheDocument()
  })

  it('has grid and list view toggle', () => {
    render(<MemoriesView />)
    const gridBtn = screen.getByRole('button', { name: /grid_view|grid/i })
    const listBtn = screen.getByRole('button', { name: /list/i })
    expect(gridBtn).toBeInTheDocument()
    expect(listBtn).toBeInTheDocument()
    fireEvent.click(listBtn)
    expect(listBtn).toHaveClass(/bg-accent|accent/)
  })

  it('has Add Memory button', () => {
    render(<MemoriesView />)
    expect(screen.getByRole('button', { name: /Add Memory/i })).toBeInTheDocument()
  })
})
