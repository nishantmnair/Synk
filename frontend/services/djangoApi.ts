// API service for Django backend
import { djangoAuthService } from './djangoAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiError {
  message?: string;
  detail?: string;
  error?: string;
  errors?: Record<string, string[]>;
  error_code?: string;
  status?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let token = await djangoAuthService.getAccessToken();
  
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401 && token) {
    try {
      await djangoAuthService.refreshAccessToken();
      token = await djangoAuthService.getAccessToken();
      if (token) {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options?.headers,
          },
        });
      }
    } catch (err) {
      console.error('[API] Token refresh failed:', err);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' })) as ApiError;
    
    // Create a custom error with the full response data
    const error = new Error(errorData.message || errorData.detail || errorData.error || 'Request failed');
    // Attach the full error response for better error handling
    Object.assign(error, { data: errorData, status: response.status });
    throw error;
  }

  const data = await response.json();
  
  // Handle paginated responses from DRF - extract results array if present
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results as T;
  }
  
  return data;
}

// Tasks API
export const tasksApi = {
  getAll: () => request('/api/tasks/'),
  create: (task: any) => request('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  update: (id: number, updates: any) => request(`/api/tasks/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id: number) => request(`/api/tasks/${id}/`, {
    method: 'DELETE',
  }),
};

// Milestones API
export const milestonesApi = {
  getAll: () => request('/api/milestones/'),
  create: (milestone: any) => request('/api/milestones/', {
    method: 'POST',
    body: JSON.stringify(milestone),
  }),
  update: (id: number, updates: any) => request(`/api/milestones/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id: number) => request(`/api/milestones/${id}/`, {
    method: 'DELETE',
  }),
};

// Activities API
export const activitiesApi = {
  getAll: (limit: number = 50) => request(`/api/activities/?limit=${limit}`),
  create: (activity: any) => request('/api/activities/', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
};

// Suggestions API
export const suggestionsApi = {
  getAll: () => request('/api/suggestions/'),
  create: (suggestion: any) => request('/api/suggestions/', {
    method: 'POST',
    body: JSON.stringify(suggestion),
  }),
  delete: (id: number) => request(`/api/suggestions/${id}/`, {
    method: 'DELETE',
  }),
};

// Collections API
export const collectionsApi = {
  getAll: () => request('/api/collections/'),
  create: (collection: any) => request('/api/collections/', {
    method: 'POST',
    body: JSON.stringify(collection),
  }),
  update: (id: number, updates: any) => request(`/api/collections/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id: number) => request(`/api/collections/${id}/`, {
    method: 'DELETE',
  }),
};

// Preferences API
export const preferencesApi = {
  get: () => request('/api/preferences/'),
  update: (id: number, preferences: any) => request(`/api/preferences/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  }),
};

// Couple API
export const coupleApi = {
  get: () => request('/api/couple/'),
  uncouple: () => request('/api/couple/uncouple/', {
    method: 'DELETE',
  }),
};

// Coupling Code API
export const couplingCodeApi = {
  create: () => request('/api/coupling-codes/', {
    method: 'POST',
  }),
  getAll: () => request('/api/coupling-codes/'),
  use: (code: string) => request('/api/coupling-codes/use/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
};
// Account API
export const accountApi = {
  deleteAccount: (password: string) => request('/api/users/delete_account/', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};