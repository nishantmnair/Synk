
export enum TaskStatus {
  BACKLOG = 'Backlog',
  PLANNING = 'Planning',
  UPCOMING = 'Upcoming'
}

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  liked: boolean;
  fired: boolean;
  progress: number; // 0-100
  alexProgress: number; // 0-100
  samProgress: number; // 0-100
  description?: string;
  time?: string;
  location?: string;
  avatars: string[];
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Dreaming';
  samExcitement: number;
  alexExcitement: number;
  icon: string;
}

export interface Activity {
  id: string;
  user: string; // Can be any user name, not just 'Sam' or 'Alex'
  action: string;
  item: string;
  timestamp: string;
  avatar: string;
}

export interface Suggestion {
  id: string;
  title: string;
  suggestedBy: string;
  date: string;
  description: string;
  location: string;
  category: string;
  excitement: number;
  tags: string[];
}
