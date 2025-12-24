import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from './Auth';
import { AuthContext } from '../contexts/AuthContext';

// Mock firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    signInWithPopup: vi.fn(),
  },
  googleProvider: {},
}));

const mockAuthContext = {
  user: null,
  profile: null,
  couple: null,
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshCouple: vi.fn(),
  refreshProfile: vi.fn(),
};

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in button', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
  });

  it('shows loading state when signing in', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed sign in
    const delayedSignIn = vi.fn(() => new Promise<void>((resolve) => setTimeout(() => resolve(), 100)));
    const contextWithDelay = { ...mockAuthContext, signInWithGoogle: delayedSignIn };

    render(
      <AuthContext.Provider value={contextWithDelay}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    const signInButton = screen.getByText(/Continue with Google/i);
    await user.click(signInButton);

    expect(signInButton).toBeDisabled();
  });

  it('displays app description', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Date Ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in to create or join/i)).toBeInTheDocument();
  });

  it('handles sign in error gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const failedSignIn = vi.fn(() => Promise.reject(new Error('Sign in failed')));
    const contextWithError = { ...mockAuthContext, signInWithGoogle: failedSignIn };

    render(
      <AuthContext.Provider value={contextWithError}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    const signInButton = screen.getByText(/Continue with Google/i);
    await user.click(signInButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
