
export enum TaskStatus {
  BACKLOG = 'Backlog',
  PLANNING = 'Planning',
  UPCOMING = 'Upcoming',
  COMPLETED = 'Completed'
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
  date?: string; // YYYY-MM-DD format
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
  icon: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  milestone?: string | null;
  milestoneId?: string | null;
  milestoneName?: string | null;
  photos: string[];
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
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

export interface DailyConnectionAnswer {
  id: string;
  connectionId: string;
  userId: number;
  userName: string;
  answerText: string;
  answeredAt: string;
  updatedAt: string;
}

export interface DailyConnection {
  id: string | null;
  date: string;
  prompt: string;
  answers: DailyConnectionAnswer[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface InboxItem {
  id: string;
  itemType: 'connection_answer' | 'milestone_update' | 'task_shared' | 'message';
  title: string;
  description: string;
  content: Record<string, any>;
  senderName: string;
  connectionAnswer?: DailyConnectionAnswer;
  isRead: boolean;
  hasReacted: boolean;
  response: string;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
