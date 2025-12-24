import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { AuthContext } from '../contexts/AuthContext';
import * as api from '../lib/api';
import { mockActivity, mockSection, mockCouple, mockReminder } from '../test/mocks/api';

vi.mock('../lib/api');

const mockUser = { uid: 'test-uid', email: 'test@example.com' } as any;
const mockProfile = { id: 1, user: 1, full_name: 'Test User' } as any;

const mockAuthContext = {
  user: mockUser,
  profile: mockProfile,
  couple: mockCouple,
  loading: false,
  signInWithGoogle: vi.fn(),
  refreshProfile: vi.fn(),
  refreshCouple: vi.fn(),
  signOut: vi.fn(),
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getSections').mockResolvedValue([mockSection] as any);
    vi.spyOn(api, 'getActivities').mockResolvedValue([mockActivity] as any);
    vi.spyOn(api, 'getActivityReminders').mockResolvedValue([mockReminder] as any);
  });

  it('renders dashboard', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Dashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Test Activity/i).length).toBeGreaterThan(0);
    });
  });

  it('loads data on mount', async () => {
    const getSectionsSpy = vi.spyOn(api, 'getSections');
    const getActivitiesSpy = vi.spyOn(api, 'getActivities');

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Dashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getSectionsSpy).toHaveBeenCalled();
      expect(getActivitiesSpy).toHaveBeenCalled();
    });
  });
});
