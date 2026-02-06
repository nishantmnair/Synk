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
      if (!token) {
        throw new Error('Token refresh failed');
      }
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options?.headers,
        },
      });
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

  // Handle 204 No Content responses (e.g., from DELETE requests)
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  
  // Handle paginated responses from DRF - extract results array if present
  return (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results))
    ? (data.results as T)
    : data;
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

// Daily Connection API
export const dailyConnectionApi = {
  getAll: () => request('/api/daily-connections/'),
  getToday: () => request('/api/daily-connections/today/'),
  submitAnswer: (connectionId: number, answerText: string) => request(`/api/daily-connections/${connectionId}/answer/`, {
    method: 'POST',
    body: JSON.stringify({ answer_text: answerText }),
  }),
};

// Inbox API
export const inboxApi = {
  getAll: () => request('/api/inbox/'),
  getUnread: () => request('/api/inbox/unread/'),
  markAsRead: (itemId: number) => request(`/api/inbox/${itemId}/mark_as_read/`, {
    method: 'POST',
  }),
  markAllAsRead: () => request('/api/inbox/mark_all_as_read/', {
    method: 'POST',
  }),
  react: (itemId: number) => request(`/api/inbox/${itemId}/react/`, {
    method: 'POST',
  }),
  shareResponse: (itemId: number, response: string) => request(`/api/inbox/${itemId}/share_response/`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  }),
};
// Memories API
export const memoriesApi = {
  getAll: () => request('/api/memories/'),
  create: (memory: any) => request('/api/memories/', {
    method: 'POST',
    body: JSON.stringify(memory),
  }),
  update: (id: number, updates: any) => request(`/api/memories/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id: number) => request(`/api/memories/${id}/`, {
    method: 'DELETE',
  }),
  toggleFavorite: (id: number) => request(`/api/memories/${id}/toggle_favorite/`, {
    method: 'POST',
  }),
};
