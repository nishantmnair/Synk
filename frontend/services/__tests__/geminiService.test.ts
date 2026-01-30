/**
 * Tests for geminiService (calls backend AI API; no client Gemini key)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as geminiService from '../geminiService'
import * as djangoApi from '../djangoApi'

vi.mock('../djangoApi', () => ({
  aiApi: {
    planDate: vi.fn(),
    proTip: vi.fn(),
    dailyPrompt: vi.fn(),
  },
}))

describe('geminiService', () => {
  beforeEach(() => {
    vi.mocked(djangoApi.aiApi.planDate).mockReset()
    vi.mocked(djangoApi.aiApi.proTip).mockReset()
    vi.mocked(djangoApi.aiApi.dailyPrompt).mockReset()
  })

  describe('generateDateIdea', () => {
    it('returns result from backend API', async () => {
      vi.mocked(djangoApi.aiApi.planDate).mockResolvedValue({
        title: 'Beach Day',
        description: 'Sun and sand',
        location: 'Beach',
        category: 'Adventure',
      })
      const result = await geminiService.generateDateIdea('adventurous')
      expect(result).toEqual({
        title: 'Beach Day',
        description: 'Sun and sand',
        location: 'Beach',
        category: 'Adventure',
      })
      expect(djangoApi.aiApi.planDate).toHaveBeenCalledWith('adventurous', undefined)
    })

    it('returns fallback on API error', async () => {
      vi.mocked(djangoApi.aiApi.planDate).mockRejectedValue(new Error('API error'))
      const result = await geminiService.generateDateIdea('cozy')
      expect(result).toEqual({
        title: 'Cozy Movie Marathon',
        description: expect.any(String),
        location: 'Home Sweet Home',
        category: 'Date idea',
      })
    })
  })

  describe('getProTip', () => {
    it('returns tip from backend API', async () => {
      vi.mocked(djangoApi.aiApi.proTip).mockResolvedValue({ tip: 'Plan a surprise date night!' })
      const result = await geminiService.getProTip([
        { name: 'Trip', status: 'Upcoming' },
      ])
      expect(result).toBe('Plan a surprise date night!')
      expect(djangoApi.aiApi.proTip).toHaveBeenCalledWith([
        { name: 'Trip', status: 'Upcoming' },
      ])
    })

    it('returns fallback on API error', async () => {
      vi.mocked(djangoApi.aiApi.proTip).mockRejectedValue(new Error('API error'))
      const result = await geminiService.getProTip([])
      expect(result).toContain('journey')
      expect(typeof result).toBe('string')
    })
  })

  describe('getDailyConnectionPrompt', () => {
    it('returns prompt from backend API', async () => {
      vi.mocked(djangoApi.aiApi.dailyPrompt).mockResolvedValue({
        prompt: 'What are you grateful for today?',
      })
      const result = await geminiService.getDailyConnectionPrompt()
      expect(result).toBe('What are you grateful for today?')
      expect(djangoApi.aiApi.dailyPrompt).toHaveBeenCalled()
    })

    it('returns fallback on API error', async () => {
      vi.mocked(djangoApi.aiApi.dailyPrompt).mockRejectedValue(new Error('API error'))
      const result = await geminiService.getDailyConnectionPrompt()
      expect(result).toContain('teleport')
      expect(typeof result).toBe('string')
    })
  })
})
