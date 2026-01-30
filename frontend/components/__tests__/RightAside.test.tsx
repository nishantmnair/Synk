/**
 * Tests for RightAside component
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RightAside from '../RightAside'

const mockActivities = [
  { id: '1', user: 'Sam', action: 'added', item: 'Beach day', timestamp: 'Just now', avatar: 'https://example.com/1.png' },
]
const mockMilestones = [
  { id: '1', name: 'Trip', date: '2025-06-01', status: 'Upcoming', samExcitement: 80, alexExcitement: 90, icon: 'flight' },
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
    expect(screen.getByText('DATES THIS YEAR')).toBeInTheDocument()
    expect(screen.getByText('Yearly Goal')).toBeInTheDocument()
  })
})
