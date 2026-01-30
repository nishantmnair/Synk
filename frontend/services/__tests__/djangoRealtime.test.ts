/**
 * Tests for djangoRealtime service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { djangoRealtimeService } from '../djangoRealtime'
import * as djangoAuth from '../djangoAuth'

vi.mock('../djangoAuth', () => ({
  djangoAuthService: {
    getCurrentUser: vi.fn(),
  },
}))

const CONNECTING = 0
const OPEN = 1

describe('djangoRealtimeService', () => {
  let mockWs: { readyState: number; close: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn> }
  let WsConstructor: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    djangoRealtimeService.disconnect()
    mockWs = {
      readyState: CONNECTING,
      close: vi.fn(),
      addEventListener: vi.fn(),
    }
    WsConstructor = vi.fn(() => mockWs)
    const MockWS = Object.assign(WsConstructor, { OPEN, CONNECTING })
    vi.stubGlobal('WebSocket', MockWS)
  })

  afterEach(() => {
    djangoRealtimeService.disconnect()
  })

  it('isConnected returns false when not connected', () => {
    expect(djangoRealtimeService.isConnected()).toBe(false)
  })

  it('connect does nothing when user not authenticated', async () => {
    vi.mocked(djangoAuth.djangoAuthService.getCurrentUser).mockResolvedValue(null)
    await djangoRealtimeService.connect()
    expect(WsConstructor).not.toHaveBeenCalled()
  })

  it('connect creates WebSocket when user is authenticated', async () => {
    vi.mocked(djangoAuth.djangoAuthService.getCurrentUser).mockResolvedValue({
      id: 1,
      username: 'test',
      email: 'test@example.com',
      first_name: '',
      last_name: '',
    } as any)
    await djangoRealtimeService.connect()
    expect(WsConstructor).toHaveBeenCalledWith(expect.stringMatching(/\/ws\/1\//))
  })

  it('on and off register and unregister listeners', () => {
    const cb = vi.fn()
    djangoRealtimeService.on('task:created', cb)
    expect(() => djangoRealtimeService.off('task:created', cb)).not.toThrow()
  })

  it('disconnect clears WebSocket and listeners', async () => {
    vi.mocked(djangoAuth.djangoAuthService.getCurrentUser).mockResolvedValue({ id: 42 } as any)
    await djangoRealtimeService.connect()
    djangoRealtimeService.disconnect()
    expect(mockWs.close).toHaveBeenCalled()
  })
})
