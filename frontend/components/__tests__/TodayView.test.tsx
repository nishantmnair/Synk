/**
 * Tests for TodayView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TodayView from '../TodayView'
import * as djangoApi from '../../services/djangoApi'

vi.mock('../../services/djangoApi', () => ({
  dailyConnectionApi: {
    getToday: vi.fn(),
    submitAnswer: vi.fn(),
  },
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
    vi.mocked(djangoApi.dailyConnectionApi.getToday).mockResolvedValue({
      id: 1,
      prompt: 'Take a moment to share something meaningful with your partner.',
      answers: [],
    } as any)
  })

  it('renders date and greeting', async () => {
    renderTodayView()
    await waitFor(() => {
      expect(screen.getByText(/Your Shared Space in Synk/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Good (morning|afternoon|evening)!/)).toBeInTheDocument()
  })

  it.skip('shows loading then daily connection prompt', async () => {
    renderTodayView()
    await waitFor(() => {
      expect(screen.getByText(/Take a moment to share/i)).toBeInTheDocument()
    })
  })

  it.skip('Share Answer button calls onShareAnswer and becomes Shared', async () => {
    const onShareAnswer = vi.fn()
    vi.mocked(djangoApi.dailyConnectionApi.submitAnswer).mockResolvedValue({ success: true } as any)
    renderTodayView({ onShareAnswer })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Answer/i })).toBeInTheDocument()
    })
    
    // Open the answer modal
    fireEvent.click(screen.getByRole('button', { name: /Share Answer/i }))

    // Fill and submit the modal form
    const textarea = await screen.findByPlaceholderText('Share your thoughts...')
    fireEvent.change(textarea, { target: { value: 'Hello partner' } })
    const submit = screen.getByRole('button', { name: /Share with Partner/i })
    fireEvent.click(submit)

    await waitFor(() => {
      expect(onShareAnswer).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /Shared/i })).toBeInTheDocument()
    })
  })

  it('shows Daily Connection section', async () => {
    renderTodayView()
    await waitFor(() => {
      expect(screen.getByText(/Daily Connection/i)).toBeInTheDocument()
    })
  })
})
