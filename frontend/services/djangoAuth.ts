// Django JWT Authentication Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error_code?: string;
  errors?: Record<string, string[] | string>;
  non_field_errors?: string[];
}

/** Derive Django username from email. Same logic for signup and login. Backend requires len >= 3. */
function emailToUsername(email: string): string {
  const raw = email.trim().toLowerCase();
  const at = raw.indexOf('@');
  const local = (at >= 0 ? raw.slice(0, at) : raw).replace(/[^a-z0-9]/g, '') || 'user';
  if (local.length >= 3) return local.slice(0, 150);
  const domain = (at >= 0 ? raw.slice(at + 1) : 'mail').replace(/\./g, '').slice(0, 8);
  return (local + '_' + domain).slice(0, 150);
}

function extractErrorMessage(error: ApiErrorResponse | null, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  if (typeof error.detail === 'string' && error.detail.trim()) {
    return error.detail;
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (Array.isArray(error.non_field_errors) && typeof error.non_field_errors[0] === 'string') {
    return error.non_field_errors[0];
  }

  if (error.errors && typeof error.errors === 'object') {
    for (const value of Object.values(error.errors)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return fallback;
}

class DjangoAuthService {
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private lastTokenVerified: number = 0; // Timestamp of last verification
  private tokenVerificationCacheTTL: number = 5 * 60 * 1000; // 5 minutes cache
  private refreshTokenPromise: Promise<void> | null = null; // Prevent concurrent refresh attempts

  /** Decode JWT and check if it's expired */
  private isTokenExpired(token: string): boolean {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      // Decode payload (base64url)
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return true;

      // Check if token expires within the next 30 seconds
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now + 30;
    } catch {
      return true;
    }
  }

  async signup(email: string, password: string, passwordConfirm: string, firstName?: string, lastName?: string, couplingCode?: string): Promise<User> {
    try {
      // Register new user
      // Auto-generate username from email (for backend compatibility)
      // Backend still requires username for Django User model, so we use email prefix as username
      const signupUrl = `${API_BASE_URL}/api/register/`;
      const signupData: any = { 
        username: emailToUsername(email), // Backend requires len >= 3; keep in sync with login
        email: email.trim().toLowerCase(), 
        password, 
        password_confirm: passwordConfirm,
        first_name: firstName?.trim() || '',
        last_name: lastName?.trim() || ''
      };
      
      // Add coupling code if provided
      if (couplingCode && couplingCode.trim()) {
        signupData.coupling_code = couplingCode.trim().toUpperCase();
      }
      
      const signupResponse = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      }).catch((fetchError) => {
        // Network error - backend might not be running or CORS issue
        console.error('Network error during signup:', fetchError);
        throw new Error(`Unable to connect to server. Please ensure the backend is running at ${API_BASE_URL}`);
      });

      if (!signupResponse.ok) {
        const error = await signupResponse.json().catch(() => ({ detail: 'Registration failed' })) as { detail?: string; [key: string]: any };
        // Handle field-specific errors - DRF returns errors as arrays
        let errorMessage = error.detail;
        if (!errorMessage) {
          // Check for field-specific errors
          if (error.password && Array.isArray(error.password)) {
            errorMessage = error.password[0];
          } else if (error.username && Array.isArray(error.username)) {
            errorMessage = error.username[0];
          } else if (error.email && Array.isArray(error.email)) {
            errorMessage = error.email[0];
          } else if (error.password_confirm && Array.isArray(error.password_confirm)) {
            errorMessage = error.password_confirm[0];
          } else if (typeof error === 'object') {
            // Try to get first error message from any field
            const firstError = Object.values(error).find(val => Array.isArray(val) && val.length > 0);
            errorMessage = Array.isArray(firstError) ? firstError[0] : 'Registration failed';
          }
        }
        throw new Error(errorMessage || 'Registration failed. Please check your input and try again.');
      }

      const signupJson = await signupResponse.json() as any;
      const userData = signupJson?.data ?? signupJson;
      
      // Automatically log in after signup. Use username (not email): JWT /api/token/ expects username.
      // Fall back to email-derived username if not in response
      const loginIdentifier = userData?.username || emailToUsername(email);
      return await this.login(loginIdentifier, password);
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw with better error message if it's not already an Error object
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  async login(identifier: string, password: string): Promise<User> {
    try {
      // JWT /api/token/ expects username. Form uses "email"; support both email and username.
      if (!identifier || typeof identifier !== 'string') {
        throw new Error('Invalid login: identifier must be a non-empty string');
      }
      const username = identifier.includes('@') ? emailToUsername(identifier) : identifier.trim();
      const tokenResponse = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => null) as ApiErrorResponse | null;
        const defaultMessage = tokenResponse.status === 401 ? 'Invalid credentials' : 'Login failed';
        const msg = extractErrorMessage(error, defaultMessage);
        const friendly = error?.error_code === 'invalid_credentials' ||
          /no active account|invalid credentials|credentials provided are invalid/i.test(msg)
          ? 'Invalid email/username or password.'
          : msg;
        throw new Error(friendly);
      }

      const tokens: TokenResponse = await tokenResponse.json();
      this.accessToken = tokens.access;
      this.refreshToken = tokens.refresh;

      // Get user info
      const userResponse = await fetch(`${API_BASE_URL}/api/users/`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await userResponse.json();
      // DRF uses PageNumberPagination: { count, next, previous, results }
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      const user = list[0] ?? null;
      if (!user || typeof user !== 'object') {
        throw new Error('Failed to fetch user info');
      }
      this.currentUser = user as User;

      // Store tokens and user in localStorage
      localStorage.setItem('synk_access_token', this.accessToken);
      localStorage.setItem('synk_refresh_token', this.refreshToken);
      localStorage.setItem('synk_user', JSON.stringify(this.currentUser));

      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('synk_access_token');
    localStorage.removeItem('synk_refresh_token');
    localStorage.removeItem('synk_user');
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      return this.accessToken;
    }

    // Try to restore from localStorage
    const storedToken = localStorage.getItem('synk_access_token');
    if (storedToken) {
      // Check if token is expired using JWT decode (no API call)
      if (!this.isTokenExpired(storedToken)) {
        this.accessToken = storedToken;
        return storedToken;
      } else {
        // Token is expired, try to refresh
        try {
          await this.refreshAccessToken();
          return this.accessToken;
        } catch (err) {
          // Refresh failed - clear tokens
          await this.logout();
          return null;
        }
      }
    }

    return null;
  }

  async refreshAccessToken(): Promise<void> {
    // Prevent concurrent refresh attempts - if one is already in progress, wait for it
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const storedRefresh = localStorage.getItem('synk_refresh_token');
    if (!storedRefresh) {
      return;
    }

    // Create the refresh promise
    this.refreshTokenPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: storedRefresh }),
        });

        if (response.ok) {
          const data = await response.json() as { access: string };
          this.accessToken = data.access;
          localStorage.setItem('synk_access_token', this.accessToken);
        } else {
          // Refresh token expired, logout
          await this.logout();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await this.logout();
      } finally {
        // Clear the refresh promise after completion
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from localStorage
    const storedUser = localStorage.getItem('synk_user');
    const storedToken = localStorage.getItem('synk_access_token');
    const token = await this.getAccessToken();

    // If we have a stored token but getCurrentUser couldn't get a valid one,
    // it means token refresh failed - clear stale auth
    if (storedToken && !token) {
      localStorage.removeItem('synk_access_token');
      localStorage.removeItem('synk_refresh_token');
      localStorage.removeItem('synk_user');
      this.currentUser = null;
      return null;
    }

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser) as unknown;
        // Reject pagination wrapper or invalid shape (old bug stored { results } as user)
        const valid = parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
          'id' in parsed && !('results' in parsed);
        if (valid) {
          const parsedUser = parsed as User;
          this.currentUser = parsedUser;
          return this.currentUser;
        }
        localStorage.removeItem('synk_user');
      } catch {
        localStorage.removeItem('synk_user');
      }
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    // Check auth state periodically
    const checkAuth = async () => {
      const user = await this.getCurrentUser();
      callback(user);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000); // Check every minute

    return () => clearInterval(interval);
  }
}

export const djangoAuthService = new DjangoAuthService();
