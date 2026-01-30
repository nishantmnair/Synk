/**
 * Tests for TodayView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TodayView from '../TodayView'
import * as geminiService from '../../services/geminiService'

vi.mock('../../services/geminiService', () => ({
  getDailyConnectionPrompt: vi.fn(),
}))

const defaultTasks: any[] = []

const renderTodayView = (props = {}) =>
  render(
    <MemoryRouter>
      <TodayView tasks={defaultTasks} vibe="Feeling good" {...props} />
    </MemoryRouter>
  )

describe('TodayView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(geminiService.getDailyConnectionPrompt).mockResolvedValue('What made you smile today?')
  })

  it('renders date and greeting', async () => {
    renderTodayView()
    await waitFor(() => {
      expect(screen.getByText(/Your Shared Space in Synk/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Good (morning|afternoon|evening)!/)).toBeInTheDocument()
  })

  it('shows loading then daily connection prompt', async () => {
    renderTodayView()
    expect(screen.getByText(/Loading your connection prompt/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/What made you smile today\?/)).toBeInTheDocument()
    })
  })

  it('Share Answer button calls onShareAnswer and becomes Shared', async () => {
    const onShareAnswer = vi.fn()
    renderTodayView({ onShareAnswer })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Answer/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Share Answer/i }))
    expect(onShareAnswer).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Shared/i })).toBeInTheDocument()
  })

  it('shows Daily Connection section', async () => {
    renderTodayView()
    await waitFor(() => {
      expect(screen.getByText(/Daily Connection/i)).toBeInTheDocument()
    })
  })
})
