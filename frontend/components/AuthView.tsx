import React, { useState, useEffect } from 'react';
import { getActionErrorMessage } from '../utils/errorMessages';

interface AuthViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, passwordConfirm: string, firstName?: string, lastName?: string, couplingCode?: string) => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onSignup, showToast, theme: propTheme, onToggleTheme }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [couplingCode, setCouplingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (propTheme) return propTheme;
    if (typeof document !== 'undefined') {
      const stored = localStorage.getItem('synk_theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const next = theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      // Safely handle localStorage - in incognito mode it might throw or be unavailable
      try {
        localStorage.setItem('synk_theme', next);
      } catch (e) {
        // Silently fail in incognito mode - theme will reset on page reload but will use browser preference
        console.debug('Theme preference not saved (incognito mode or localStorage disabled)');
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setFirstName('');
    setLastName('');
    setCouplingCode('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        await onSignup(email, password, passwordConfirm, firstName, lastName, couplingCode.trim() || undefined);
      } else {
        await onLogin(email, password);
      }
    } catch (err: unknown) {
      const errorMsg = getActionErrorMessage(
        isSignup ? 'signup' : 'login',
        err
      );
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main text-primary font-sans flex flex-col items-center justify-center p-4">
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 material-symbols-outlined text-secondary hover:text-primary transition-colors text-[20px] w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5 active:scale-95"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo with Synk Text */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src={theme === 'dark' ? '/Synk-Logo-Inverted.png' : '/Synk-Logo.png'}
            alt="Synk Logo"
            className="w-12 h-12"
          />
          <span className="text-3xl font-bold text-primary">Synk</span>
        </div>

        <div className="bg-card border border-subtle rounded-2xl p-6 space-y-5">
          <h1 className="text-xl font-bold text-center">{isSignup ? 'Sign Up' : 'Sign In'}</h1>

          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setIsSignup(false); resetForm(); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${!isSignup ? 'bg-primary text-main' : 'text-secondary'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); resetForm(); }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${isSignup ? 'bg-primary text-main' : 'text-secondary'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-lg text-sm space-y-2 flex gap-3 animate-in shake-in-x">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label htmlFor="signup-email" className="block text-sm text-secondary mb-1">Email *</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
                    placeholder="Enter your email"
                  />
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="first-name" className="block text-sm text-secondary mb-1">First name</label>
                      <input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="last-name" className="block text-sm text-secondary mb-1">Last name</label>
                      <input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </>
            )}

            {!isSignup && (
              <div>
                <label htmlFor="login-email" className="block text-sm text-secondary mb-1">Email or username *</label>
                <input
                  id="login-email"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
                  placeholder="Email or username"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm text-secondary mb-1">Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
                placeholder={isSignup ? 'At least 8 characters' : 'Password'}
              />
              {isSignup && password && (
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-400' : 'bg-white/10'}`}></span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-white/10'}`}></span>
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-400' : 'bg-white/10'}`}></span>
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-white/10'}`}></span>
                    One number
                  </div>
                </div>
              )}
            </div>

            {isSignup && (
              <>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm text-secondary mb-1">Confirm password *</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-primary text-sm focus:outline-none ${
                      passwordConfirm && password !== passwordConfirm ? 'border-red-500/50' : 'border-subtle focus:border-accent'
                    }`}
                    placeholder="Confirm password"
                  />
                  {passwordConfirm && password !== passwordConfirm && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg text-xs space-y-1 flex gap-2 animate-in shake-in-x mt-1">
                      <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="coupling-code" className="block text-sm text-secondary mb-1">Partner code (optional)</label>
                  <input
                    id="coupling-code"
                    type="text"
                    value={couplingCode}
                    onChange={(e) => setCouplingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    maxLength={8}
                    className="w-full bg-white/5 border border-subtle rounded-lg px-3 py-2 text-primary text-sm text-center font-mono tracking-wider focus:outline-none focus:border-accent"
                    placeholder="8-character code"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-main font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isSignup ? 'Creating…' : 'Signing in…') : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {!isSignup && (
            <>
              <p className="text-xs text-secondary text-center pt-1">
                No account?{' '}
                <button type="button" onClick={() => { setIsSignup(true); resetForm(); }} className="text-accent font-medium">
                  Sign up
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
