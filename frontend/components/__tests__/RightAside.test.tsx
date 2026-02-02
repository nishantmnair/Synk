/**
 * Tests for RightAside component
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RightAside from '../RightAside'

const mockActivities = [
  { id: '1', user: 'Sam', action: 'added', item: 'Beach day', timestamp: 'Just now', avatar: 'https://example.com/1.png' },
]

describe('RightAside', () => {
  it('renders Our Activity header and toggle button', () => {
    render(<RightAside activities={[]} milestones={[]} onToggle={vi.fn()} />)
    expect(screen.getByText(/Our Activity/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Collapse Sidebar/i)).toBeInTheDocument()
  })

  it('calls onToggle when button clicked', () => {
    const onToggle = vi.fn()
    render(<RightAside activities={[]} milestones={[]} onToggle={onToggle} />)
    fireEvent.click(screen.getByTitle(/Collapse Sidebar/i))
    expect(onToggle).toHaveBeenCalled()
  })

  it('renders activity feed items', () => {
    render(<RightAside activities={mockActivities} milestones={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Beach day')).toBeInTheDocument()
    expect(screen.getByText('Just now')).toBeInTheDocument()
  })

  it('renders Our Journey section', () => {
    render(<RightAside activities={[]} milestones={[]} onToggle={vi.fn()} />)
    expect(screen.getByText('Our Journey')).toBeInTheDocument()
    // Updated to match current RightAside content
    expect(screen.getByText('MILESTONES')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })
})
