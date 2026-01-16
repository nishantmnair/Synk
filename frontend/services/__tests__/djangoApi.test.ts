/**
 * Tests for Django API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tasksApi, milestonesApi, activitiesApi, suggestionsApi, collectionsApi, preferencesApi, coupleApi, couplingCodeApi } from '../djangoApi'
import { djangoAuthService } from '../djangoAuth'

// Mock djangoAuthService
vi.mock('../djangoAuth', () => ({
  djangoAuthService: {
    getAccessToken: vi.fn().mockResolvedValue('mock-token')
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('djangoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tasksApi', () => {
    it('fetches all tasks', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }]
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      })

      const result = await tasksApi.getAll()
      expect(result).toEqual(mockTasks)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })

    it('creates a task', async () => {
      const mockTask = { id: 1, title: 'New Task' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      })

      const result = await tasksApi.create({ title: 'New Task' })
      expect(result).toEqual(mockTask)
    })

    it('handles errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Error' })
      })

      await expect(tasksApi.getAll()).rejects.toThrow()
    })
  })

  describe('coupleApi', () => {
    it('fetches couple status', async () => {
      const mockCouple = { is_coupled: true, partner: { id: 2 } }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCouple
      })

      const result = await coupleApi.get()
      expect(result).toEqual(mockCouple)
    })

    it('uncouples users', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ detail: 'Successfully uncoupled' })
      })

      await coupleApi.uncouple()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/couple/uncouple/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('couplingCodeApi', () => {
    it('creates a coupling code', async () => {
      const mockCode = { code: 'TESTCODE', expires_at: '2024-12-31' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCode
      })

      const result = await couplingCodeApi.create()
      expect(result).toEqual(mockCode)
    })

    it('uses a coupling code', async () => {
      const mockResponse = { is_coupled: true }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await couplingCodeApi.use('TESTCODE')
      expect(result).toEqual(mockResponse)
    })
  })
})
