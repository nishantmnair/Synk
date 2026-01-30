/**
 * Tests for MilestonesView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MilestonesView from '../MilestonesView'
import * as geminiService from '../../services/geminiService'

vi.mock('../../services/geminiService', () => ({
  getProTip: vi.fn().mockResolvedValue('Dream big together!'),
}))

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
    vi.mocked(geminiService.getProTip).mockResolvedValue('Dream big together!')
  })

  it('renders roadmap header and progress', async () => {
    render(<MilestonesView milestones={mockMilestones} />)
    await waitFor(() => {
      expect(screen.getByText('Our 2024 Roadmap')).toBeInTheDocument()
    })
    expect(screen.getByText('Overall Progress')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('renders milestones table with milestone name', async () => {
    render(<MilestonesView milestones={mockMilestones} />)
    await waitFor(() => {
      expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
    })
    expect(screen.getByText('Milestone Name')).toBeInTheDocument()
    expect(screen.getByText('Target Date')).toBeInTheDocument()
  })

  it('shows pro tip from geminiService', async () => {
    render(<MilestonesView milestones={mockMilestones} />)
    await waitFor(() => {
      expect(screen.getByText(/Dream big together!/)).toBeInTheDocument()
    })
  })
})
