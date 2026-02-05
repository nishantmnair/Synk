/**
 * Error message formatting utility
 * Provides user-friendly error messages based on API responses and error types
 */

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
  errors?: Record<string, string[]>;
  error_code?: string;
  status?: string;
}

/**
 * Extract the most user-friendly error message from various error formats
 */
export function extractErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (!error) return fallback;

  // If it's a string, use it directly
  if (typeof error === 'string') return error;

  // If it's an Error object with a message
  if (error instanceof Error) {
    // Try to parse JSON if the message contains API response
    try {
      const parsed = JSON.parse(error.message) as ApiErrorResponse;
      return getErrorMessageFromResponse(parsed, fallback);
    } catch {
      return error.message || fallback;
    }
  }

  // If it's an object, try to extract message
  if (typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    return getErrorMessageFromResponse(apiError, fallback);
  }

  return fallback;
}

/**
 * Extract and format error message from API error response
 */
function getErrorMessageFromResponse(response: ApiErrorResponse, fallback: string): string {
  // Try in order of preference
  if (response.message) return response.message;
  if (response.detail) return response.detail;
  if (response.error) return response.error;

  // If there are field-level errors, format them nicely
  if (response.errors && typeof response.errors === 'object') {
    const fieldErrors = Object.entries(response.errors)
      .flatMap(([field, messages]) => {
        if (Array.isArray(messages)) {
          return messages.map(msg => `${field}: ${msg}`);
        }
        return [`${field}: ${messages}`];
      })
      .slice(0, 3); // Show first 3 field errors

    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
  }

  return fallback;
}

/**
 * Get contextual error message for specific error codes
 */
export function getContextualErrorMessage(errorCode: string | undefined, defaultMessage: string): string {
  const messages: Record<string, string> = {
    'duplicate_email': 'This email is already registered. Try logging in or use a different email.',
    'duplicate_username': 'This username is taken. Please choose a different username.',
    'invalid_credentials': 'Incorrect username or password. Please try again.',
    'password_mismatch': 'Passwords do not match. Please re-enter.',
    'weak_password': 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.',
    'authentication_required': 'Your session has expired. Please log in again.',
    'not_found': 'The requested item could not be found.',
    'validation_error': 'Please check your input and try again.',
    'server_error': 'Something went wrong on our end. Please try again later.',
    'network_error': 'Network connection failed. Please check your internet and try again.',
  };

  return messages[errorCode?.toLowerCase() || ''] || defaultMessage;
}

/**
 * Parse and format error for specific actions
 */
export function getActionErrorMessage(action: string, error: unknown): string {
  const defaultMessages: Record<string, string> = {
    save_settings: 'Could not save your settings. Please try again.',
    load_settings: 'Could not load your settings. Please refresh the page.',
    generate_code: 'Could not generate a coupling code. Please try again.',
    use_code: 'Could not connect accounts. The code may be expired or invalid.',
    uncouple: 'Could not disconnect from your partner. Please try again.',
    delete_account: 'Could not delete your account. Please try again or contact support.',
    login: 'Login failed. Please check your credentials and try again.',
    signup: 'Signup failed. Please check your information and try again.',
    logout: 'Logout failed. Please try refreshing the page.',
    load_tasks: 'Could not load tasks. Please refresh.',
    save_task: 'Could not save task. Please try again.',
    delete_task: 'Could not delete task. Please try again.',
    load_activities: 'Could not load activity history. Please refresh.',
  };

  const baseMessage = defaultMessages[action] || 'An error occurred. Please try again.';
  const errorMessage = extractErrorMessage(error);

  // Only append specific error if it's different from fallback message
  if (errorMessage && !errorMessage.includes('error') && errorMessage.length < 100) {
    return `${baseMessage} (${errorMessage})`;
  }

  return baseMessage;
}
