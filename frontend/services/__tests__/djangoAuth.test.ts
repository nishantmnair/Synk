/**
 * Tests for Django authentication service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { djangoAuthService } from '../djangoAuth'

// Mock fetch globally
global.fetch = vi.fn()

describe('djangoAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    ;(localStorage.getItem as any).mockReturnValue(null)
    ;(localStorage.setItem as any).mockImplementation(() => {})
    ;(localStorage.removeItem as any).mockImplementation(() => {})
    // Reset service state
    ;(djangoAuthService as any).currentUser = null
    ;(djangoAuthService as any).accessToken = null
    ;(djangoAuthService as any).refreshToken = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockTokens = {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token'
      }
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      }

      // Mock token endpoint
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens
      })

      // Mock user endpoint
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      })

      const user = await djangoAuthService.login('test@example.com', 'testpass123')

      expect(user).toEqual(mockUser)
      expect(localStorage.setItem).toHaveBeenCalledWith('synk_access_token', 'mock-access-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('synk_refresh_token', 'mock-refresh-token')
    })

    it('throws error on invalid credentials', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' })
      })

      await expect(
        djangoAuthService.login('test@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid email/username or password.')
    })

    it('maps standardized backend auth errors to friendly login message', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          status: 'error',
          error_code: 'invalid_credentials',
          message: 'The credentials provided are invalid. Please try again.'
        })
      })

      await expect(
        djangoAuthService.login('test@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid email/username or password.')
    })
  })

  describe('signup', () => {
    it('successfully signs up user', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User'
      }

      // Mock signup endpoint
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })

      // Mock login (called after signup)
      const mockTokens = {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token'
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens
      })
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      })

      const user = await djangoAuthService.signup(
        'newuser@example.com',
        'testpass123',
        'testpass123',
        'New',
        'User'
      )

      expect(user).toEqual(mockUser)
    })

    it('throws error on duplicate email', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ email: ['A user with this email already exists.'] })
      })

      await expect(
        djangoAuthService.signup('existing@example.com', 'testpass123', 'testpass123')
      ).rejects.toThrow()
    })
  })

  describe('logout', () => {
    it('clears tokens and user data', async () => {
      // Mock localStorage
      const storage: any = {
        'synk_access_token': 'token',
        'synk_refresh_token': 'refresh',
        'synk_user': JSON.stringify({ id: 1 })
      }
      ;(localStorage.getItem as any).mockImplementation((key: string) => storage[key] || null)
      
      await djangoAuthService.logout()

      expect(localStorage.removeItem).toHaveBeenCalledWith('synk_access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('synk_refresh_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('synk_user')
    })
  })

  describe('getCurrentUser', () => {
    it('returns user from localStorage', async () => {
      // Clear localStorage first
      localStorage.clear()
      
      // Mock getAccessToken to return a token
      vi.spyOn(djangoAuthService, 'getAccessToken').mockResolvedValue('mock-token')
      
      // Mock localStorage
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }
      const storage: any = {
        'synk_user': JSON.stringify(mockUser)
      }
      ;(localStorage.getItem as any).mockImplementation((key: string) => storage[key] || null)

      const user = await djangoAuthService.getCurrentUser()

      expect(user).toEqual(mockUser)
      
      // Restore original method
      vi.restoreAllMocks()
    })

    it('returns null when no user in localStorage', async () => {
      // Mock localStorage to return null
      ;(localStorage.getItem as any).mockReturnValue(null)
      
      // Mock getAccessToken to return null (no token)
      vi.spyOn(djangoAuthService, 'getAccessToken').mockResolvedValue(null)
      
      const user = await djangoAuthService.getCurrentUser()
      expect(user).toBeNull()
      
      // Restore original method
      vi.restoreAllMocks()
    })
  })
})
