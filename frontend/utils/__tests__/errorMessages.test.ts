/**
 * Tests for error message utilities
 * Tests user-friendly error message extraction and formatting
 */

import { describe, it, expect } from 'vitest';
import { extractErrorMessage, getContextualErrorMessage, getActionErrorMessage } from '../errorMessages';

describe('errorMessages utilities', () => {
  describe('extractErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Something went wrong');
      expect(extractErrorMessage(error)).toBe('Something went wrong');
    });

    it('should extract message from string', () => {
      const error = 'User not found';
      expect(extractErrorMessage(error)).toBe('User not found');
    });

    it('should extract message property from API response object', () => {
      const error = { message: 'Invalid email' };
      expect(extractErrorMessage(error)).toBe('Invalid email');
    });

    it('should extract detail property when message unavailable', () => {
      const error = { detail: 'Resource not found' };
      expect(extractErrorMessage(error)).toBe('Resource not found');
    });

    it('should extract error property when message and detail unavailable', () => {
      const error = { error: 'Authentication failed' };
      expect(extractErrorMessage(error)).toBe('Authentication failed');
    });

    it('should format field errors from API response', () => {
      const error = {
        errors: {
          email: ['This email is already registered'],
          password: ['Password is too weak']
        }
      };
      const msg = extractErrorMessage(error);
      expect(msg).toContain('email');
      expect(msg).toContain('This email is already registered');
    });

    it('should return fallback message for null/undefined error', () => {
      expect(extractErrorMessage(null)).toBe('An error occurred');
      expect(extractErrorMessage(undefined)).toBe('An error occurred');
      expect(extractErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should return fallback for empty error object', () => {
      expect(extractErrorMessage({})).toBe('An error occurred');
    });

    it('should handle API errors with full response structure', () => {
      const error = {
        status: 'error',
        error_code: 'duplicate_email',
        message: 'A user with this email already exists',
        errors: {
          email: ['This email is already registered. Please use a different email or try logging in.']
        }
      };
      expect(extractErrorMessage(error)).toBe('A user with this email already exists');
    });
  });

  describe('getContextualErrorMessage', () => {
    it('should map duplicate_email error code', () => {
      const msg = getContextualErrorMessage('duplicate_email', 'fallback');
      expect(msg).toContain('email');
      expect(msg).toContain('registered');
    });

    it('should map invalid_credentials error code', () => {
      const msg = getContextualErrorMessage('invalid_credentials', 'fallback');
      expect(msg).toContain('Incorrect');
      expect(msg).toContain('password');
    });

    it('should map weak_password error code', () => {
      const msg = getContextualErrorMessage('weak_password', 'fallback');
      expect(msg).toContain('weak');
      expect(msg).toContain('8 characters');
    });

    it('should map authentication_required error code', () => {
      const msg = getContextualErrorMessage('authentication_required', 'fallback');
      expect(msg).toContain('session');
    });

    it('should return fallback for unknown error code', () => {
      expect(getContextualErrorMessage('unknown_error', 'fallback message')).toBe('fallback message');
      expect(getContextualErrorMessage('', 'fallback')).toBe('fallback');
    });

    it('should be case-insensitive', () => {
      const msg1 = getContextualErrorMessage('DUPLICATE_EMAIL', 'fallback');
      const msg2 = getContextualErrorMessage('duplicate_email', 'fallback');
      expect(msg1).toBe(msg2);
    });
  });

  describe('getActionErrorMessage', () => {
    it('should provide contextual message for login action', () => {
      const msg = getActionErrorMessage('login', new Error('Invalid credentials'));
      expect(msg).toContain('Login');
      expect(msg).toContain('check your credentials');
    });

    it('should provide contextual message for signup action', () => {
      const msg = getActionErrorMessage('signup', new Error('Email already exists'));
      expect(msg).toContain('Signup');
    });

    it('should provide contextual message for save_settings action', () => {
      const msg = getActionErrorMessage('save_settings', new Error('Server error'));
      expect(msg).toContain('Could not save');
      expect(msg).toContain('settings');
    });

    it('should provide contextual message for generate_code action', () => {
      const msg = getActionErrorMessage('generate_code', new Error('Rate limit'));
      expect(msg).toContain('Could not generate');
      expect(msg).toContain('coupling code');
    });

    it('should provide contextual message for uncouple action', () => {
      const msg = getActionErrorMessage('uncouple', new Error('Database error'));
      expect(msg).toContain('Could not disconnect');
    });

    it('should provide contextual message for delete_account action', () => {
      const msg = getActionErrorMessage('delete_account', new Error('Password incorrect'));
      expect(msg).toContain('Could not delete');
    });

    it('should use default message for unknown action', () => {
      const msg = getActionErrorMessage('unknown_action', new Error('error'));
      expect(msg).toContain('An error occurred');
      expect(msg).toContain('try again');
    });

    it('should append specific error if short and different', () => {
      const msg = getActionErrorMessage('login', new Error('Network timeout'));
      expect(msg).toContain('Login');
      expect(msg).toContain('Network timeout');
    });

    it('should not append generic error messages', () => {
      const msg = getActionErrorMessage('login', new Error('error'));
      expect(msg).not.toContain('error)');
    });
  });
});
