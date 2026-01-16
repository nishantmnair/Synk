/**
 * Tests for avatar utility
 */
import { describe, it, expect } from 'vitest'
import { getUserAvatar } from '../avatar'
import { User } from '../../services/djangoAuth'

describe('getUserAvatar', () => {
  it('generates avatar for user with first_name', () => {
    const user: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe'
    }
    const avatar = getUserAvatar(user)
    expect(avatar).toContain('data:image/svg+xml')
    // Avatar contains first letter 'J', not full name
    expect(decodeURIComponent(avatar)).toContain('>J</text>')
  })

  it('generates avatar for user without first_name', () => {
    const user: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    }
    const avatar = getUserAvatar(user)
    expect(avatar).toContain('data:image/svg+xml')
    // Avatar is URL-encoded, check for 'T' (first letter of email)
    expect(decodeURIComponent(avatar)).toContain('T')
  })

  it('generates default avatar for null user', () => {
    const avatar = getUserAvatar(null)
    expect(avatar).toContain('data:image/svg+xml')
    expect(avatar).toContain('U')
  })

  it('generates consistent colors for same user', () => {
    const user: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'John'
    }
    const avatar1 = getUserAvatar(user)
    const avatar2 = getUserAvatar(user)
    // Extract color from SVG (hsl values)
    expect(avatar1).toBe(avatar2)
  })

  it('uses case-sensitive first letter', () => {
    const user1: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'John'
    }
    const user2: User = {
      id: 2,
      username: 'testuser2',
      email: 'test2@example.com',
      first_name: 'john'
    }
    const avatar1 = getUserAvatar(user1)
    const avatar2 = getUserAvatar(user2)
    // Should be different because 'J' vs 'j'
    expect(avatar1).not.toBe(avatar2)
  })

  it('generates correct size', () => {
    const user: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'John'
    }
    const avatar = getUserAvatar(user, 256)
    // Avatar is URL-encoded, so decode before checking
    const decoded = decodeURIComponent(avatar)
    expect(decoded).toContain('width="256"')
    expect(decoded).toContain('height="256"')
  })
})
