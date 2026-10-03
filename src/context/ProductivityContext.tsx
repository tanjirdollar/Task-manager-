import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, CalendarEvent, Note, FocusSession, ActiveTab, Priority, Category, TaskStatus, UserProfile } from '../types';

export interface ToastNotification {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ProductivityContextType {
  user: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Toast notifications
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: () => void;
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  // Focus Sessions
  focusSessions: FocusSession[];
  logFocusSession: (minutes: number, taskId?: string) => void;
  activeFocusTaskId: string | null;
  setActiveFocusTaskId: (taskId: string | null) => void;
  // Metrics & Helpers
  todayFocusMinutes: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  todayTasks: Task[];
  todayEvents: CalendarEvent[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ProductivityContext = createContext<ProductivityContextType | undefined>(undefined);

// Helper to convert English digits to Bengali digits
export const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bengaliDigits[parseInt(d, 10)]);
};

// Helper to format ISO date YYYY-MM-DD in local time
export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getOffsetDateStr = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Bengali Date formatting helper
export const formatBengaliDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const days = [
      'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
    ];
    const dayName = days[d.getDay()];
    const day = toBengaliNumber(d.getDate());
    const monthName = months[d.getMonth()];
    const year = toBengaliNumber(d.getFullYear());
    return `${dayName}, ${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
};

const defaultUser: UserProfile = {
  name: 'তানজির',
  email: 'tanjir.dollar@gmail.com',
  role: 'প্রোডাক্ট ও সফটওয়্যার লিড',
  initials: 'TD',
};

// Initial realistic Bengali seed tasks for Tanjir
const initialTasks: Task[] = [
  {
    id: 't-1',
    title: 'কিউ৪ (Q4) আর্কিটেকচার রোডম্যাপ চূড়ান্তকরণ',
    description: 'এপিআই ল্যাটেন্সি বেঞ্চমার্ক, মাইক্রোসার্ভিস বাউন্ডারি ও ডেটাবেজ মাইগ্রেশন চেকলিস্ট প্রস্তুত করুন।',
    priority: 'urgent',
    status: 'in_progress',
    category: 'ইঞ্জিনিয়ারিং',
    dueDate: getTodayStr(),
    estimatedMinutes: 60,
    subtasks: [
      { id: 'st-1', title: 'বেঞ্চমার্ক ল্যাটেন্সি ডেটা সংকলন করা', completed: true },
      { id: 'st-2', title: 'সিকিউরিটি অথেনটিকেশন বাউন্ডারি ডায়াগ্রাম রিভিউ', completed: true },
      { id: 'st-3', title: 'পিয়ার আর্কিটেকচার রিভিউ মিটিং সম্পন্ন করা', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-2',
    title: 'ডিজাইন সিস্টেমের এক্সেসিবিলিটি অডিট করা',
    description: 'WCAG 4.5:1 কালার কনট্রাস্ট এবং টাচ টার্গেট মাপ নিশ্চিত করুন।',
    priority: 'high',
    status: 'todo',
    category: 'ডিজাইন',
    dueDate: getTodayStr(),
    estimatedMinutes: 45,
    subtasks: [
      { id: 'st-4', title: 'ফোকাস রিং স্টাইল ভেরিফাই করা', completed: false },
      { id: 'st-5', title: 'টোকেন ভেরিয়েবল টেইলউইন্ডে সিঙ্ক করা', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    title: 'এন্টারপ্রাইজ ক্লায়েন্ট ইন্টিগ্রেশন চুক্তি পর্যালোচনা',
    description: 'এসএলএ (SLA) শর্তাবলি ও রেট লিমিট টিয়ার যাচাই করুন।',
    priority: 'medium',
    status: 'todo',
    category: 'স্ট্র্যাটেজি',
    dueDate: getOffsetDateStr(1),
    estimatedMinutes: 30,
    subtasks: [
      { id: 'st-6', title: 'আইনি শর্তাবলির ৪ নম্বর ধারা পর্যালোচনা', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-4',
    title: 'ডেটাবেজ ইনডেক্স অপটিমাইজেশন',
    description: 'কোয়েরি এক্সিকিউশন টাইম ১৫ মিলি-সেকেন্ডের নিচে নামিয়ে আনা।',
    priority: 'high',
    status: 'completed',
    category: 'ইঞ্জিনিয়ারিং',
    dueDate: getOffsetDateStr(-1),
    estimatedMinutes: 45,
    completedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-7', title: 'EXPLAIN ANALYZE দিয়ে স্লো কুয়েরি চেক করা', completed: true },
      { id: 'st-8', title: 'স্টেজিয়ে কম্পোজিট ইনডেক্স প্রয়োগ করা', completed: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-5',
    title: 'সাপ্তাহিক শরীরচর্চা ও রিকভারি ওয়াক',
    description: 'গভীর কাজের ব্লকের পর ৩০ মিনিট সান্ধ্যকালীন হাঁটা ও হালকা স্ট্রেচিং।',
    priority: 'low',
    status: 'todo',
    category: 'ব্যক্তিগত',
    dueDate: getOffsetDateStr(2),
    estimatedMinutes: 30,
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
];

const initialEvents: CalendarEvent[] = [
  {
    id: 'e-1',
    title: 'দৈনিক প্রোডাক্ট ও ইঞ্জিনিয়ারিং স্ট্যান্ডআপ',
    description: '১৫ মিনিটের কুইক সিঙ্ক: রিলিজ স্ট্যাটাস ও অগ্রাধিকার সমন্বয়।',
    date: getTodayStr(),
    startTime: '০৯:৩০',
    endTime: '১০:০০',
    location: 'মিটিং রুম আলফা / গুগল মিট',
    type: 'meeting',
  },
  {
    id: 'e-2',
    title: 'ডিপ ফোকাস: কোর আর্কিটেকচার রিফ্যাক্টরিং',
    description: 'সম্পূর্ণ মনোযোগের ব্লক। নোটিফিকেশন বন্ধ থাকবে।',
    date: getTodayStr(),
    startTime: '১০:৩০',
    endTime: '১২:০০',
    location: 'ওয়ার্কস্টেশন / ফোকাস জোন',
    type: 'focus',
  },
  {
    id: 'e-3',
    title: 'ডিজাইন সিস্টেম ও ইউএক্স রিভিউ',
    description: 'রেসপনসিভ ব্রেকপয়েন্ট ও কম্পোনেন্ট লাইব্রেরি নিয়ে টিম সেশন।',
    date: getTodayStr(),
    startTime: '১৪:০০',
    endTime: '১৫:০০',
    location: 'ডিজাইন স্টুডিও বি',
    type: 'workshop',
  },
  {
    id: 'e-4',
    title: 'স্প্রিন্ট ডেমো ও স্টেকহোল্ডার ব্রিফিং',
    description: 'চলতি স্প্রিন্টের অগ্রগতি ও রিলিজ ক্যান্ডিডেট উপস্থাপন।',
    date: getOffsetDateStr(2),
    startTime: '১১:০০',
    endTime: '১২:০০',
    location: 'কনফারেন্স হল ১',
    type: 'meeting',
  },
  {
    id: 'e-5',
    title: 'স্প্রিন্ট ডেলিভারেবল ফাইনাল ডেডলাইন',
    description: 'কোড ফ্রিজ ও প্রোডাকশন রিলিজ সম্পন্ন করা।',
    date: getOffsetDateStr(4),
    startTime: '১৭:০০',
    endTime: '১৭:৩০',
    location: 'ডিপ্লয়মেন্ট পাইপলাইন',
    type: 'deadline',
  },
];

const initialNotes: Note[] = [
  {
    id: 'n-1',
    title: 'প্রোডাক্ট আর্কিটেকচারের মূল মূলনীতি ২০২৬',
    content: `## মূল নির্দেশিকা
- **সরলতাই শ্রেষ্ঠ**: অপ্রয়োজনীয় ধাপ পরিহার করে মূল কাজে মনোনিবেশ করুন।
- **ল্যাটেন্সি নিয়ন্ত্রণ**: ইউজার ইন্টারফেসে ১০০ মিলি-সেকেন্ডের নিচে তাৎক্ষণিক রেসপন্স নিশ্চিত করতে হবে।
- **গভীর কাজের নীতি**: মিটিংগুলো দুপুরের পরে রাখুন; সকালের মূল্যবান সময় কঠিন চিন্তাশীল কাজের জন্য সুরক্ষিত রাখুন।
- **চেকলিস্ট ব্যবহার**: যেসব কাজ একাধিকবার করতে হয়, তার জন্য পুনরাবৃত্তিমূলক চেকলিস্ট তৈরি করুন।`,
    category: 'স্ট্র্যাটেজি',
    tags: ['আর্কিটেকচার', 'গাইডলাইন', 'উৎপাদনশীলতা'],
    pinned: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-2',
    title: 'স্প্রিন্ট রেট্রোস্পেক্টিভ পর্যালোচনা',
    content: `### যা ভালো হয়েছে
- বিল্ড ক্যাশ অপটিমাইজেশনের মাধ্যমে সিআই/সিডি সময় ৪০% কমেছে।
- ডিজাইন ও ইঞ্জিনিয়ারিং টিমের মধ্যে কাজের সমন্বয় খুব মসৃণ ছিল।

### করণীয়
১. থার্ড পার্টি এপিআই এর জন্য মক টেস্টিং চালু করা।
২. ৫০ মিনিটের ডিপ-ফোকাস ইন্টারভ্যাল অনুসরণ করা।`,
    category: 'কাজ',
    tags: ['স্প্রিন্ট', 'পর্যালোচনা', 'ইঞ্জিনিয়ারিং'],
    pinned: true,
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-3',
    title: 'আইডিয়া: গভীর কাজের জন্য অ্যাম্বিয়েন্ট সাউন্ডস্কেপ',
    content: `পিঙ্ক নয়েজের সাথে সূক্ষ্ম লো-পাস ফিল্টার মানসিক ক্লান্তি দূর করে এবং দীর্ঘক্ষণ ফোকাস ধরে রাখতে সাহায্য করে।`,
    category: 'আইডিয়া',
    tags: ['আইডিয়া', 'ফোকাস', 'সাউন্ডস্কেপ'],
    pinned: false,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const initialFocusSessions: FocusSession[] = [
  {
    id: 'fs-1',
    date: getTodayStr(),
    minutes: 25,
    taskId: 't-1',
    completedAt: new Date().toISOString(),
  },
  {
    id: 'fs-2',
    date: getTodayStr(),
    minutes: 25,
    taskId: 't-1',
    completedAt: new Date().toISOString(),
  },
  {
    id: 'fs-3',
    date: getOffsetDateStr(-1),
    minutes: 50,
    taskId: 't-4',
    completedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const ProductivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, type });
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // User details
  const [user] = useState<UserProfile>(defaultUser);

  // Load from local storage or fallback to seed data
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('kroma_tasks_bn');
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('kroma_events_bn');
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('kroma_notes_bn');
      return saved ? JSON.parse(saved) : initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    try {
      const saved = localStorage.getItem('kroma_focus_sessions_bn');
      return saved ? JSON.parse(saved) : initialFocusSessions;
    } catch {
      return initialFocusSessions;
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('kroma_tasks_bn', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kroma_events_bn', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('kroma_notes_bn', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('kroma_focus_sessions_bn', JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Task Actions
  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>): Task => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [task, ...prev]);
    showToast('নতুন টাস্ক সফলভাবে তৈরি হয়েছে', 'success');
    return task;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status === 'completed' && t.status !== 'completed') {
            updated.completedAt = new Date().toISOString();
          } else if (updates.status && updates.status !== 'completed') {
            updated.completedAt = undefined;
          }
          return updated;
        }
        return t;
      })
    );
    showToast('টাস্ক হালনাগাদ করা হয়েছে', 'success');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeFocusTaskId === id) {
      setActiveFocusTaskId(null);
    }
    showToast('টাস্ক মুছে ফেলা হয়েছে', 'info');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const isDone = t.status === 'completed';
          const nextStatus: TaskStatus = isDone ? 'todo' : 'completed';
          if (!isDone) {
            showToast('অভিনন্দন! টাস্ক সম্পন্ন হয়েছে', 'success');
          } else {
            showToast('টাস্ক পুনরায় প্রক্রিয়াধীন হিসেবে সেট করা হয়েছে', 'info');
          }
          return {
            ...t,
            status: nextStatus,
            completedAt: isDone ? undefined : new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextSubtasks = t.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allCompleted = nextSubtasks.length > 0 && nextSubtasks.every(st => st.completed);
          return {
            ...t,
            subtasks: nextSubtasks,
            status: allCompleted ? 'completed' : t.status === 'completed' ? 'in_progress' : t.status,
            completedAt: allCompleted ? (t.completedAt || new Date().toISOString()) : undefined,
          };
        }
        return t;
      })
    );
  };

  // Event Actions
  const addEvent = (newEvent: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const event: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setEvents(prev => [...prev, event].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)));
    showToast('ইভেন্ট সফলভাবে শিডিউল করা হয়েছে', 'success');
    return event;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    );
    showToast('ইভেন্ট আপডেট করা হয়েছে', 'success');
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('ইভেন্ট মুছে ফেলা হয়েছে', 'info');
  };

  // Note Actions
  const addNote = (newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = new Date().toISOString();
    const note: Note = {
      ...newNote,
      tags: newNote.tags || [],
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [note, ...prev]);
    showToast('নোট সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    return note;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
    showToast('নোট আপডেট করা হয়েছে', 'success');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    showToast('নোট মুছে ফেলা হয়েছে', 'info');
  };

  const togglePinNote = (id: string) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  // Focus Session Actions
  const logFocusSession = (minutes: number, taskId?: string) => {
    const session: FocusSession = {
      id: `fs-${Date.now()}`,
      date: getTodayStr(),
      minutes,
      taskId: taskId || activeFocusTaskId || undefined,
      completedAt: new Date().toISOString(),
    };
    setFocusSessions(prev => [session, ...prev]);
    showToast(`${toBengaliNumber(minutes)} মিনিটের ফোকাস সেশন সফলভাবে সম্পন্ন!`, 'success');
  };

  // Metrics
  const todayStr = getTodayStr();
  const todayFocusMinutes = focusSessions
    .filter(s => s.date === todayStr)
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const todayTasks = tasks.filter(t => 
    t.status !== 'completed' && (
      t.dueDate <= todayStr || 
      t.status === 'in_progress' || 
      (t.createdAt && t.createdAt.split('T')[0] === todayStr)
    )
  );

  const todayEvents = events
    .filter(e => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <ProductivityContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        dismissToast,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        notes,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        focusSessions,
        logFocusSession,
        activeFocusTaskId,
        setActiveFocusTaskId,
        todayFocusMinutes,
        completedTasksCount,
        pendingTasksCount,
        todayTasks,
        todayEvents,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ProductivityContext.Provider>
  );
};

export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
};
