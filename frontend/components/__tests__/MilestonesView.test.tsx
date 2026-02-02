/**
 * Tests for MilestonesView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MilestonesView from '../MilestonesView'

const mockMilestones = [
  {
    id: '1',
    name: 'Trip to Japan',
    date: '2025-06-01',
    status: 'Upcoming',
    samExcitement: 90,
    alexExcitement: 85,
    icon: 'flight',
  },
]

describe('MilestonesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders roadmap header and progress', async () => {
    render(<MilestonesView milestones={mockMilestones} />)
    await waitFor(() => {
      expect(screen.getByText('Our Milestones')).toBeInTheDocument()
    })
    expect(screen.getByText('Overall Progress')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders milestones table with milestone name', async () => {
    render(<MilestonesView milestones={mockMilestones} />)
    await waitFor(() => {
      expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
    })
    expect(screen.getByText('Milestone Name')).toBeInTheDocument()
    expect(screen.getByText('Target Date')).toBeInTheDocument()
  })
})
