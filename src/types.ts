export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type Category = 'কাজ' | 'ইঞ্জিনিয়ারিং' | 'ডিজাইন' | 'স্ট্র্যাটেজি' | 'ব্যক্তিগত' | 'Work' | 'Engineering' | 'Design' | 'Strategy' | 'Personal';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  initials: string;
  uid?: string;
  photoURL?: string;
  isGoogleUser?: boolean;
  googleCalendarConnected?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  category: Category;
  dueDate: string; // YYYY-MM-DD
  estimatedMinutes?: number;
  reminderTime?: string; // HH:mm or timestamp
  reminderTriggered?: boolean;
  subtasks: Subtask[];
  completedAt?: string;
  createdAt: string;
}

export type EventType = 'meeting' | 'focus' | 'workshop' | 'deadline' | 'personal';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  location?: string;
  type: EventType;
  color?: string;
  googleEventId?: string;
  isGoogleEvent?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
}

export type FocusMode = 'pomodoro' | 'deep_50' | 'short_break' | 'long_break' | 'custom';

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  taskId?: string;
  completedAt: string;
}

export interface AIAction {
  type: 'create_task' | 'update_task' | 'complete_task' | 'create_event' | 'create_note' | 'find_items' | 'productivity_summary';
  data: any;
}

export interface ExecutedAction {
  type: string;
  description: string;
  targetTab?: ActiveTab;
  itemTitle?: string;
}

export interface SearchResultBlock {
  type: 'tasks' | 'events' | 'notes';
  title: string;
  items: any[];
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionableTasks?: { title: string; priority: Priority; category: Category }[];
  executedActions?: ExecutedAction[];
  searchResults?: SearchResultBlock;
}

export type ActiveTab = 'dashboard' | 'tasks' | 'calendar' | 'events' | 'focus' | 'notes' | 'assistant';
