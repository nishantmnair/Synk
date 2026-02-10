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
    icon: 'flight',
  },
]

const mockCallbacks = {
  onAddMilestone: vi.fn(),
  onUpdateMilestone: vi.fn(),
  onDeleteMilestone: vi.fn(),
  showConfirm: vi.fn(),
  showToast: vi.fn(),
}

describe('MilestonesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders roadmap header and progress', async () => {
    render(<MilestonesView milestones={mockMilestones} {...mockCallbacks} />)
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
    expect(screen.getByText('Milestone')).toBeInTheDocument()
    expect(screen.getByText('Target Date')).toBeInTheDocument()
  })
})
