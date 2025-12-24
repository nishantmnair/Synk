import { vi } from 'vitest';
import type { Activity, Section, Couple, Profile, ActivityReminder } from '../../lib/api';

export const mockProfile: Profile = {
  id: 1,
  user: 1,
  full_name: 'Test User',
  bio: 'Test bio',
  timezone: 'UTC',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockCouple: Couple = {
  id: 1,
  user1: 1,
  user2: 2,
  invite_code: 'TEST123',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockSection: Section = {
  id: 1,
  couple: 1,
  title: 'Test Section',
  parent_section: undefined,
  display_order: 0,
  subsections: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockActivity: Activity = {
  id: 1,
  couple: 1,
  section: 1,
  section_title: 'Test Section',
  title: 'Test Activity',
  description: 'Test description',
  status: 'not_started',
  is_recurring: false,
  recurrence_pattern: '',
  order: 0,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockReminder: ActivityReminder = {
  id: 1,
  couple: 1,
  activity: 1,
  activity_title: 'Test Activity',
  dismissed: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock API functions
export const mockApiMethods = {
  getMyProfile: vi.fn().mockResolvedValue({ data: [mockProfile] }),
  getMyCouples: vi.fn().mockResolvedValue({ data: [mockCouple] }),
  getSections: vi.fn().mockResolvedValue({ data: [mockSection] }),
  getActivities: vi.fn().mockResolvedValue({ data: [mockActivity] }),
  getActivityReminders: vi.fn().mockResolvedValue({ data: [mockReminder] }),
  createProfile: vi.fn().mockResolvedValue({ data: mockProfile }),
  createCouple: vi.fn().mockResolvedValue({ data: mockCouple }),
  joinCouple: vi.fn().mockResolvedValue({ data: mockCouple }),
  createActivity: vi.fn().mockResolvedValue({ data: mockActivity }),
  updateActivity: vi.fn().mockResolvedValue({ data: mockActivity }),
  deleteActivity: vi.fn().mockResolvedValue({ data: mockActivity }),
  createSection: vi.fn().mockResolvedValue({ data: mockSection }),
  updateSection: vi.fn().mockResolvedValue({ data: mockSection }),
  deleteSection: vi.fn().mockResolvedValue({ data: {} }),
  markActivityComplete: vi.fn().mockResolvedValue({ data: { ...mockActivity, status: 'finished' } }),
  dismissReminder: vi.fn().mockResolvedValue({ data: { ...mockReminder, dismissed: true } }),
};
