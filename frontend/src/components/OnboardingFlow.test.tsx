import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';
import { AuthContext } from '../contexts/AuthContext';

vi.mock('../lib/api');

const mockAuthContext = {
  user: { uid: 'test-uid', email: 'test@example.com' } as any,
  profile: null,
  couple: null,
  loading: false,
  signInWithGoogle: vi.fn(),
  refreshProfile: vi.fn(),
  refreshCouple: vi.fn(),
  signOut: vi.fn(),
};

describe('OnboardingFlow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders onboarding flow', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <OnboardingFlow />
      </AuthContext.Provider>
    );

    // Component should render with join option
    expect(screen.getByText(/Join with Code/i)).toBeInTheDocument();
  });

  it('shows create couple option', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <OnboardingFlow />
      </AuthContext.Provider>
    );

    // Should show create option
    expect(screen.getByText(/Start solo/i)).toBeInTheDocument();
  });

  it('renders without errors', () => {
    const { container } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <OnboardingFlow />
      </AuthContext.Provider>
    );

    expect(container).toBeTruthy();
  });
});

