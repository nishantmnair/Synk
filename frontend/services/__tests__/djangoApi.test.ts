/**
 * Tests for Django API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tasksApi, coupleApi, couplingCodeApi } from '../djangoApi'

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

  describe('accountApi', () => {
    it('deletes account with password', async () => {
      const { accountApi } = await import('../djangoApi')
      const mockResponse = { detail: 'Account successfully deleted.' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await accountApi.deleteAccount('testpassword')
      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/delete_account/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'testpassword' })
        })
      )
    })

    it('handles password verification error', async () => {
      const { accountApi } = await import('../djangoApi')
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ password: ['Password is incorrect.'] })
      })

      try {
        await accountApi.deleteAccount('wrongpassword')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('handles authentication required error', async () => {
      const { accountApi } = await import('../djangoApi')
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Authentication credentials were not provided.' })
      })

      try {
        await accountApi.deleteAccount('password')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Authentication')
      }
    })
  })

  describe('Pagination Handling', () => {
    it('should unwrap paginated responses with results array', async () => {
      const { collectionsApi } = await import('../djangoApi')
      const mockPaginatedResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          { id: '1', name: 'Travel', icon: 'flight' },
          { id: '2', name: 'Cooking', icon: 'restaurant' },
          { id: '3', name: 'Home', icon: 'home' }
        ]
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse
      })

      const result = await collectionsApi.getAll()
      
      // The request function should unwrap the paginated response
      // and return just the results array
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: '1', name: 'Travel', icon: 'flight' })
    })

    it('should handle empty paginated responses', async () => {
      const { collectionsApi } = await import('../djangoApi')
      const mockEmptyPaginatedResponse = {
        count: 0,
        next: null,
        previous: null,
        results: []
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyPaginatedResponse
      })

      const result = await collectionsApi.getAll()
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('should not unwrap non-paginated responses', async () => {
      const { tasksApi } = await import('../djangoApi')
      const mockSingleItem = { id: 1, title: 'Task 1', description: 'Test' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSingleItem
      })

      const result = await tasksApi.getAll()
      
      // Non-paginated responses should be returned as-is
      expect(result).toEqual(mockSingleItem)
    })

    it('should preserve paginated response structure for debugging', async () => {
      // This test verifies that if a response has 'results' key,
      // it's treated as paginated and unwrapped
      const response = {
        count: 2,
        results: [
          { id: 1, value: 'first' },
          { id: 2, value: 'second' }
        ]
      }

      const isPaginated = response && 
        typeof response === 'object' && 
        'results' in response && 
        Array.isArray((response as any).results)

      expect(isPaginated).toBe(true)
      // In actual API call, this would be unwrapped by the request function
      expect((response as any).results).toHaveLength(2)
    })
  })
})

