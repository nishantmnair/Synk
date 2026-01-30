/**
 * Tests for ProfileView component
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfileView from '../ProfileView'

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
}

const mockActivities = [
  { id: '1', user: 'Test User', action: 'added', item: 'Beach day', timestamp: 'Just now', avatar: 'https://example.com/a.png' },
]

describe('ProfileView', () => {
  it('renders profile header with user display name', () => {
    render(<ProfileView currentUser={mockUser as any} activities={[]} milestonesCount={0} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText(/Joined Synk/i)).toBeInTheDocument()
  })

  it('renders Ideas Shared and Milestones stats', () => {
    render(<ProfileView currentUser={mockUser as any} activities={[]} milestonesCount={5} />)
    expect(screen.getByText('Ideas Shared')).toBeInTheDocument()
    expect(screen.getByText('Milestones')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders recent activity when activities match current user', () => {
    render(<ProfileView currentUser={mockUser as any} activities={mockActivities} milestonesCount={0} />)
    expect(screen.getByText(/Your Recent Activity/i)).toBeInTheDocument()
    expect(screen.getByText(/added.*Beach day|You added/i)).toBeInTheDocument()
  })

  it('renders empty activity state when no matching activities', () => {
    render(<ProfileView currentUser={mockUser as any} activities={[]} milestonesCount={0} />)
    expect(screen.getByText(/No recent activity/i)).toBeInTheDocument()
  })
})
