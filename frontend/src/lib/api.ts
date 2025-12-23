import axios from 'axios';
import { auth } from './firebase';

// API base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  firebase_uid: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: number;
  user: number;
  full_name: string;
  bio?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: number;
  user1: number;
  user2?: number;
  invite_code: string;
  created_at: string;
}

export interface Section {
  id: number;
  couple: number;
  title: string;
  parent_section?: number;
  display_order: number;
  subsections?: Section[];
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  couple: number;
  section?: number | null;
  section_title?: string;
  title: string;
  description: string;
  status: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  order: number;
  is_deleted: boolean;
  last_completed_at?: string;
  history?: ActivityHistory[];
  created_at: string;
  updated_at: string;
}

export interface ActivityHistory {
  id: number;
  activity: number;
  completed_by: number;
  notes: string;
  completed_at: string;
}

export interface ActivityReminder {
  id: number;
  couple: number;
  activity: number;
  activity_title: string;
  dismissed: boolean;
  created_at: string;
  updated_at: string;
}

// API Functions

// Users
export const getUsers = () => api.get<User[]>('/users/users/');
export const getUser = (id: number) => api.get<User>(`/users/users/${id}/`);
export const getCurrentUser = () => api.get<User>('/users/users/me/');

// Profiles
export const getProfiles = () => api.get<Profile[]>('/users/profiles/');
export const getProfile = (id: number) => api.get<Profile>(`/users/profiles/${id}/`);
export const createProfile = (data: Partial<Profile>) => api.post<Profile>('/users/profiles/', data);
export const updateProfile = (id: number, data: Partial<Profile>) => api.patch<Profile>(`/users/profiles/${id}/`, data);
export const getMyProfile = () => api.get<Profile[]>('/users/profiles/');

// Couples
export const getCouples = () => api.get<Couple[]>('/users/couples/');
export const getCouple = (id: number) => api.get<Couple>(`/users/couples/${id}/`);
export const createCouple = () => api.post<Couple>('/users/couples/');
export const joinCouple = (inviteCode: string) => api.post<Couple>('/users/couples/join/', { invite_code: inviteCode });
export const getMyCouples = () => api.get<Couple[]>('/users/couples/');

// Sections
export const getSections = (coupleId?: number) => {
  const params = coupleId ? { couple_id: coupleId } : {};
  return api.get<Section[]>('/activities/sections/', { params }).then(res => {
    // Handle paginated response
    const data = res.data as any;
    return data.results || data;
  });
};
export const getSection = (id: number) => api.get<Section>(`/activities/sections/${id}/`);
export const createSection = (data: Partial<Section>) => api.post<Section>('/activities/sections/', data);
export const updateSection = (id: number, data: Partial<Section>) => api.patch<Section>(`/activities/sections/${id}/`, data);
export const deleteSection = (id: number) => api.delete(`/activities/sections/${id}/`);
export const getSectionsByCouple = (coupleId: number) => api.get<Section[]>(`/activities/sections/by_couple/?couple_id=${coupleId}`);

// Activities
export const getActivities = (coupleId?: number, params?: {
  section_id?: number;
  status?: string;
  show_deleted?: boolean;
}) => {
  const queryParams = coupleId ? { couple_id: coupleId, ...params } : params;
  return api.get<Activity[]>('/activities/activities/', { params: queryParams }).then(res => {
    // Handle paginated response
    const data = res.data as any;
    return data.results || data;
  });
};

export const getActivity = (id: number) => api.get<Activity>(`/activities/activities/${id}/`);
export const createActivity = (data: Partial<Activity>) => api.post<Activity>('/activities/activities/', data);
export const updateActivity = (id: number, data: Partial<Activity>) => api.patch<Activity>(`/activities/activities/${id}/`, data);
export const deleteActivity = (id: number) => api.patch<Activity>(`/activities/activities/${id}/`, { is_deleted: true });
export const deleteActivityPermanently = (id: number) => api.delete(`/activities/activities/${id}/`);
export const markActivityComplete = (activityId: number, notes?: string) => 
  api.post<Activity>(`/activities/activities/${activityId}/mark_complete/`, { notes });
export const restoreActivity = (id: number) => api.patch<Activity>(`/activities/activities/${id}/`, { is_deleted: false });
export const reorderActivities = (activities: Array<{ id: number; order: number }>) =>
  api.post('/activities/activities/reorder/', { activities });

// Activity Reminders
export const getActivityReminders = (coupleId?: number) => {
  const params = coupleId ? { couple_id: coupleId } : {};
  return api.get<ActivityReminder[]>('/activities/reminders/', { params }).then(res => {
    // Handle paginated response
    const data = res.data as any;
    return data.results || data;
  });
};
export const getReminder = (id: number) => api.get<ActivityReminder>(`/activities/reminders/${id}/`);
export const dismissReminder = (id: number) => api.post<ActivityReminder>(`/activities/reminders/${id}/dismiss/`);

export default api;
