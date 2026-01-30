/**
 * Tests for geminiService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as geminiService from '../geminiService'

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
}))

describe('geminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset()
  })

  describe('generateDateIdea', () => {
    it('returns parsed JSON from API response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          title: 'Beach Day',
          description: 'Sun and sand',
          location: 'Beach',
        }),
      })
      const result = await geminiService.generateDateIdea('adventurous')
      expect(result).toEqual({
        title: 'Beach Day',
        description: 'Sun and sand',
        location: 'Beach',
      })
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          contents: expect.stringContaining('adventurous'),
        })
      )
    })

    it('returns fallback object on API error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'))
      const result = await geminiService.generateDateIdea('cozy')
      expect(result).toEqual({
        title: 'Cozy Movie Marathon',
        description: expect.any(String),
        location: 'Home Sweet Home',
      })
    })
  })

  describe('getProTip', () => {
    it('returns text from API response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Plan a surprise date night!' })
      const result = await geminiService.getProTip([
        { name: 'Trip', status: 'Upcoming' },
      ])
      expect(result).toBe('Plan a surprise date night!')
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          contents: expect.stringContaining('Trip'),
        })
      )
    })

    it('returns fallback string on API error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'))
      const result = await geminiService.getProTip([])
      expect(result).toContain('journey')
      expect(typeof result).toBe('string')
    })
  })

  describe('getDailyConnectionPrompt', () => {
    it('returns text from API response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'What are you grateful for today?' })
      const result = await geminiService.getDailyConnectionPrompt()
      expect(result).toBe('What are you grateful for today?')
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          contents: expect.any(String),
        })
      )
    })

    it('returns fallback string on API error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'))
      const result = await geminiService.getDailyConnectionPrompt()
      expect(result).toContain('teleport')
      expect(typeof result).toBe('string')
    })
  })
})
