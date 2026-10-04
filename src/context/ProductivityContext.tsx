import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Task, 
  CalendarEvent, 
  Note, 
  FocusSession, 
  ActiveTab, 
  Priority, 
  Category, 
  TaskStatus, 
  UserProfile 
} from '../types';
import { 
  auth, 
  db, 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken,
  testFirestoreConnection
} from '../services/firebase';
import { 
  fetchGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent 
} from '../services/googleCalendar';
import { 
  playAlarmSound, 
  playChimeSound, 
  requestNotificationPermission, 
  sendTaskNotification 
} from '../services/soundAlarm';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export interface ToastNotification {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ProductivityContextType {
  // User & Authentication
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoggingIn: boolean;

  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Toast notifications
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: () => void;

  // Cloud Synchronization
  isCloudSyncing: boolean;
  lastCloudSync: string | null;
  refreshCloudData: () => Promise<void>;

  // Google Calendar Synchronization
  syncGoogleCalendar: () => Promise<void>;
  exportToGoogleCalendar: (event: CalendarEvent) => Promise<void>;
  isGoogleCalendarSyncing: boolean;

  // Sound & Task Reminder Alarms
  soundAlarmEnabled: boolean;
  toggleSoundAlarm: () => void;
  activeReminderTask: Task | null;
  dismissReminder: () => void;
  snoozeReminder: (taskId: string, minutes: number) => void;
  testAlarm: () => void;

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

// Helpers
export const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bengaliDigits[parseInt(d, 10)]);
};

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
  isGoogleUser: false,
};

// Seed data
const initialTasks: Task[] = [
  {
    id: 't-1',
    title: 'কিউ৪ (Q4) আর্কিটেকচার রোডম্যাপ চূড়ান্তকরণ',
    description: 'এপিআই ল্যাটেন্সি বেঞ্চমার্ক, মাইক্রোসার্ভিস বাউন্ডারি ও ডেটাবেজ মাইগ্রেশন চেকলিস্ট প্রস্তুত করুন।',
    priority: 'urgent',
    status: 'in_progress',
    category: 'ইঞ্জিনিয়ারিং',
    dueDate: getTodayStr(),
    reminderTime: '10:00',
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
    reminderTime: '14:30',
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
    title: 'রাত ১১:০০ টায় মেডিটেশন ও মানসিক প্রশান্তি',
    description: 'দিনের ক্লান্তি দূর করতে ১৫ মিনিটের শান্ত মেডিটেশন সেশন।',
    priority: 'high',
    status: 'todo',
    category: 'ব্যক্তিগত',
    dueDate: getTodayStr(),
    reminderTime: '23:00',
    estimatedMinutes: 15,
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
];

const initialNotes: Note[] = [
  {
    id: 'n-1',
    title: 'উচ্চ-উৎপাদনশীল টিম কালচার ও সিস্টেম ডিজাইন',
    content: `## মূলনীতিসমূহ
- **সরলতাই শ্রেষ্ঠ**: অপ্রয়োজনীয় ধাপ পরিহার করে মূল কাজে মনোনিবেশ করুন।
- **ল্যাটেন্সি নিয়ন্ত্রণ**: ইউজার ইন্টারফেসে ১০০ মিলি-সেকেন্ডের নিচে তাৎক্ষণিক রেসপন্স নিশ্চিত করতে হবে।
- **গভীর কাজের নীতি**: মিটিংগুলো দুপুরের পরে রাখুন; সকালের মূল্যবান সময় কঠিন চিন্তাশীল কাজের জন্য সুরক্ষিত রাখুন।`,
    category: 'স্ট্র্যাটেজি',
    tags: ['আর্কিটেকচার', 'গাইডলাইন', 'উৎপাদনশীলতা'],
    pinned: true,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const ProductivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Auth states
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('kroma_user_profile');
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  // Cloud & Calendar sync states
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [isGoogleCalendarSyncing, setIsGoogleCalendarSyncing] = useState(false);

  // Sound Alarm & Reminder states
  const [soundAlarmEnabled, setSoundAlarmEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kroma_sound_alarm') !== 'false';
    } catch {
      return true;
    }
  });
  const [activeReminderTask, setActiveReminderTask] = useState<Task | null>(null);
  const triggeredTaskIdsRef = useRef<Set<string>>(new Set());

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, type });
  };

  const dismissToast = () => setToast(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Tasks, Events, Notes local states
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local storage synchronization
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

  useEffect(() => {
    localStorage.setItem('kroma_user_profile', JSON.stringify(user));
  }, [user]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (fUser) => {
        setFirebaseUser(fUser);
        setIsAuthReady(true);
        const nameParts = (fUser.displayName || defaultUser.name).split(' ');
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (fUser.displayName || 'TD').slice(0, 2).toUpperCase();

        setUser({
          name: fUser.displayName || defaultUser.name,
          email: fUser.email || defaultUser.email,
          role: 'গুগল প্রোফাইল',
          initials,
          uid: fUser.uid,
          photoURL: fUser.photoURL || undefined,
          isGoogleUser: true,
          googleCalendarConnected: true,
        });
      },
      () => {
        setFirebaseUser(null);
        setIsAuthReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // FIRESTORE REAL-TIME TWO-WAY DATA SYNC (When user is logged in)
  useEffect(() => {
    if (!firebaseUser) return;

    // Test Firestore connection on auth
    testFirestoreConnection().catch(() => {});

    setIsCloudSyncing(true);
    const userId = firebaseUser.uid;

    let isInitialTasks = true;
    let isInitialEvents = true;
    let isInitialNotes = true;

    // Listen to user's tasks in real-time
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snapshot) => {
      const cloudTasks: Task[] = [];
      snapshot.forEach(docSnap => {
        cloudTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });

      // On initial snapshot for a brand-new user whose cloud is empty:
      if (isInitialTasks) {
        isInitialTasks = false;
        if (cloudTasks.length === 0 && tasks.length > 0) {
          // Upload local items once to bootstrap user account
          tasks.forEach(t => {
            setDoc(doc(db, 'users', userId, 'tasks', t.id), t, { merge: true }).catch(err => {
              console.error('Task bootstrap error:', err);
            });
          });
          setIsCloudSyncing(false);
          return;
        }
      }

      // Live update from Firestore: this applies additions, edits, and deletions instantly
      cloudTasks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTasks(cloudTasks);
      setLastCloudSync(new Date().toLocaleTimeString());
      setIsCloudSyncing(false);
    }, (error) => {
      console.error('Firestore tasks listener error:', error);
      setIsCloudSyncing(false);
    });

    // Listen to user's events in real-time
    const eventsCol = collection(db, 'users', userId, 'events');
    const unsubEvents = onSnapshot(eventsCol, (snapshot) => {
      const cloudEvents: CalendarEvent[] = [];
      snapshot.forEach(docSnap => {
        cloudEvents.push({ id: docSnap.id, ...docSnap.data() } as CalendarEvent);
      });

      if (isInitialEvents) {
        isInitialEvents = false;
        if (cloudEvents.length === 0 && events.length > 0) {
          events.forEach(e => {
            setDoc(doc(db, 'users', userId, 'events', e.id), e, { merge: true }).catch(err => {
              console.error('Event bootstrap error:', err);
            });
          });
          return;
        }
      }

      setEvents(cloudEvents);
    }, (error) => {
      console.error('Firestore events listener error:', error);
    });

    // Listen to user's notes in real-time
    const notesCol = collection(db, 'users', userId, 'notes');
    const unsubNotes = onSnapshot(notesCol, (snapshot) => {
      const cloudNotes: Note[] = [];
      snapshot.forEach(docSnap => {
        cloudNotes.push({ id: docSnap.id, ...docSnap.data() } as Note);
      });

      if (isInitialNotes) {
        isInitialNotes = false;
        if (cloudNotes.length === 0 && notes.length > 0) {
          notes.forEach(n => {
            setDoc(doc(db, 'users', userId, 'notes', n.id), n, { merge: true }).catch(err => {
              console.error('Note bootstrap error:', err);
            });
          });
          return;
        }
      }

      setNotes(cloudNotes);
    }, (error) => {
      console.error('Firestore notes listener error:', error);
    });

    return () => {
      unsubTasks();
      unsubEvents();
      unsubNotes();
    };
  }, [firebaseUser]);

  // TASK REMINDER & ALARM ENGINE
  useEffect(() => {
    // Request permission once on interaction
    requestNotificationPermission().catch(() => {});

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const today = getTodayStr();

      tasks.forEach(task => {
        if (
          task.status !== 'completed' &&
          task.reminderTime &&
          task.dueDate <= today &&
          !triggeredTaskIdsRef.current.has(task.id)
        ) {
          // Compare times
          if (currentTimeStr >= task.reminderTime) {
            triggeredTaskIdsRef.current.add(task.id);
            setActiveReminderTask(task);

            if (soundAlarmEnabled) {
              playAlarmSound();
            }

            sendTaskNotification(
              `🔔 টাস্ক রিমাইন্ডার: ${task.title}`,
              `কাজের সময় হয়েছে (${task.reminderTime})! ক্যাটাগরি: ${task.category}`
            );
          }
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [tasks, soundAlarmEnabled]);

  const toggleSoundAlarm = () => {
    setSoundAlarmEnabled(prev => {
      const next = !prev;
      localStorage.setItem('kroma_sound_alarm', String(next));
      if (next) {
        playChimeSound();
        showToast('রিমাইন্ডার সাউন্ড অ্যালার্ম চালু করা হয়েছে', 'success');
      } else {
        showToast('রিমাইন্ডার সাউন্ড মিউট করা হয়েছে', 'info');
      }
      return next;
    });
  };

  const testAlarm = () => {
    playAlarmSound();
    showToast('অ্যালার্ম সাউন্ড পরীক্ষা সম্পন্ন হয়েছে', 'info');
  };

  const dismissReminder = () => {
    setActiveReminderTask(null);
  };

  const snoozeReminder = (taskId: string, minutes: number) => {
    const now = new Date(Date.now() + minutes * 60000);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const newTime = `${h}:${m}`;

    updateTask(taskId, { reminderTime: newTime, reminderTriggered: false });
    triggeredTaskIdsRef.current.delete(taskId);
    setActiveReminderTask(null);
    showToast(`টাস্কটি ${toBengaliNumber(minutes)} মিনিটের জন্য স্নুজ করা হয়েছে (${newTime})`, 'info');
  };

  // Google Login / Logout
  const signInWithGoogle = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        showToast(`স্বাগতম, ${result.user.displayName || 'তানজির'}! গুগল অ্যাকাউন্টে লগইন সফল হয়েছে।`, 'success');
        // Trigger calendar sync automatically after login
        if (result.accessToken) {
          setTimeout(() => syncGoogleCalendar(), 800);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      showToast('গুগল লগইন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signOutUser = async () => {
    try {
      await logout();
      setFirebaseUser(null);
      setUser(defaultUser);
      showToast('সফলভাবে লগআউট করা হয়েছে', 'info');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Google Calendar Synchronization
  const syncGoogleCalendar = async () => {
    try {
      setIsGoogleCalendarSyncing(true);
      const token = await getAccessToken();

      if (!token) {
        showToast('গুগল ক্যালেন্ডার সিঙ্ক করতে প্রথমে গুগল লগইন করুন', 'info');
        await signInWithGoogle();
        return;
      }

      const googleEvents = await fetchGoogleCalendarEvents(token);
      
      // Merge with local events avoiding duplicates
      setEvents(prev => {
        const nonGoogleEvents = prev.filter(e => !e.id.startsWith('gcal-'));
        const merged = [...nonGoogleEvents, ...googleEvents];
        // Also persist to Firestore if logged in
        if (firebaseUser) {
          googleEvents.forEach(evt => {
            setDoc(doc(db, 'users', firebaseUser.uid, 'events', evt.id), evt, { merge: true }).catch(() => {});
          });
        }
        return merged;
      });

      showToast(`✓ ${toBengaliNumber(googleEvents.length)}টি গুগল ক্যালেন্ডার ইভেন্ট সিঙ্ক হয়েছে!`, 'success');
      playChimeSound();
    } catch (err: any) {
      console.error('Google Calendar Sync Error:', err);
      showToast('গুগল ক্যালেন্ডার সিঙ্ক করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsGoogleCalendarSyncing(false);
    }
  };

  // Manual Cloud Data Refresh
  const refreshCloudData = async () => {
    if (!firebaseUser) {
      showToast('ক্লাউড সিঙ্ক করতে প্রথমে Google লগইন করুন', 'info');
      await signInWithGoogle();
      return;
    }
    setIsCloudSyncing(true);
    try {
      const [tasksSnap, eventsSnap, notesSnap] = await Promise.all([
        getDocs(collection(db, 'users', firebaseUser.uid, 'tasks')),
        getDocs(collection(db, 'users', firebaseUser.uid, 'events')),
        getDocs(collection(db, 'users', firebaseUser.uid, 'notes')),
      ]);

      const cloudTasks: Task[] = [];
      tasksSnap.forEach(d => cloudTasks.push({ id: d.id, ...d.data() } as Task));
      cloudTasks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTasks(cloudTasks);

      const cloudEvents: CalendarEvent[] = [];
      eventsSnap.forEach(d => cloudEvents.push({ id: d.id, ...d.data() } as CalendarEvent));
      setEvents(cloudEvents);

      const cloudNotes: Note[] = [];
      notesSnap.forEach(d => cloudNotes.push({ id: d.id, ...d.data() } as Note));
      setNotes(cloudNotes);

      const timeStr = new Date().toLocaleTimeString();
      setLastCloudSync(timeStr);
      showToast('✓ ক্লাউড ডেটাবেজ থেকে রিয়েল-টাইমে সফলভাবে রিফ্রেশ হয়েছে!', 'success');
    } catch (err) {
      console.error('Cloud refresh error:', err);
      showToast('ক্লাউড রিফ্রেশ করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const exportToGoogleCalendar = async (event: CalendarEvent) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast('গুগল ক্যালেন্ডারে এক্সপোর্ট করতে প্রথমে গুগল লগইন করুন', 'info');
        await signInWithGoogle();
        return;
      }

      const res = await createGoogleCalendarEvent(token, {
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
      });

      updateEvent(event.id, { googleEventId: res.id, isGoogleEvent: true });
      showToast('✓ গুগল ক্যালেন্ডারে সফলভাবে ইভেন্ট যোগ করা হয়েছে!', 'success');
      playChimeSound();
    } catch (err: any) {
      console.error('Export event error:', err);
      showToast('গুগল ক্যালেন্ডারে এক্সপোর্ট ব্যর্থ হয়েছে', 'error');
    }
  };

  // Task Actions
  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>): Task => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [task, ...prev]);

    // Save to Firestore if authenticated
    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid, 'tasks', task.id), task, { merge: true }).catch(() => {});
    }

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
          // Save to Firestore if authenticated
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'tasks', id), updated, { merge: true }).catch(() => {});
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
    // Delete from Firestore if authenticated
    if (firebaseUser) {
      deleteDoc(doc(db, 'users', firebaseUser.uid, 'tasks', id)).catch(() => {});
    }
    showToast('টাস্ক মুছে ফেলা হয়েছে', 'info');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const isDone = t.status === 'completed';
          const nextStatus: TaskStatus = isDone ? 'todo' : 'completed';
          const updated = {
            ...t,
            status: nextStatus,
            completedAt: isDone ? undefined : new Date().toISOString(),
          };

          if (!isDone) {
            showToast('অভিনন্দন! টাস্ক সম্পন্ন হয়েছে', 'success');
            playChimeSound();
          } else {
            showToast('টাস্ক পুনরায় প্রক্রিয়াধীন হিসেবে সেট করা হয়েছে', 'info');
          }

          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'tasks', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
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
          const updated = {
            ...t,
            subtasks: nextSubtasks,
            status: allCompleted ? ('completed' as TaskStatus) : t.status,
            completedAt: allCompleted ? new Date().toISOString() : t.completedAt,
          };

          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'tasks', taskId), updated, { merge: true }).catch(() => {});
          }
          return updated;
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

    setEvents(prev => [...prev, event]);

    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid, 'events', event.id), event, { merge: true }).catch(() => {});
    }

    showToast('নতুন ইভেন্ট শিডিউল করা হয়েছে', 'success');
    return event;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev =>
      prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'events', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
        }
        return e;
      })
    );
    showToast('ইভেন্টের তথ্য হালনাগাদ করা হয়েছে', 'success');
  };

  const deleteEvent = async (id: string) => {
    const target = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));

    if (firebaseUser) {
      deleteDoc(doc(db, 'users', firebaseUser.uid, 'events', id)).catch(() => {});
    }

    // If it was a Google Calendar event, delete remotely too
    if (target?.id.startsWith('gcal-') || target?.googleEventId) {
      const token = await getAccessToken();
      if (token) {
        deleteGoogleCalendarEvent(token, target.googleEventId || target.id).catch(() => {});
      }
    }

    showToast('ইভেন্ট মুছে ফেলা হয়েছে', 'info');
  };

  // Note Actions
  const addNote = (newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const note: Note = {
      ...newNote,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => [note, ...prev]);

    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid, 'notes', note.id), note, { merge: true }).catch(() => {});
    }

    showToast('নোট সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    return note;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const updated = {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'notes', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
        }
        return n;
      })
    );
    showToast('নোটের পরিবর্তন সংরক্ষিত হয়েছে', 'success');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'users', firebaseUser.uid, 'notes', id)).catch(() => {});
    }
    showToast('নোট মুছে ফেলা হয়েছে', 'info');
  };

  const togglePinNote = (id: string) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const updated = { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() };
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'notes', id), updated, { merge: true }).catch(() => {});
          }
          return updated;
        }
        return n;
      })
    );
  };

  // Focus Session
  const logFocusSession = (minutes: number, taskId?: string) => {
    const session: FocusSession = {
      id: `fs-${Date.now()}`,
      date: getTodayStr(),
      minutes,
      taskId,
      completedAt: new Date().toISOString(),
    };

    setFocusSessions(prev => [session, ...prev]);
    showToast(`অভিনন্দন! ${toBengaliNumber(minutes)} মিনিটের ফোকাস সেশন সফল হয়েছে`, 'success');
    playChimeSound();
  };

  // Derived Metrics
  const todayStr = getTodayStr();

  const todayFocusMinutes = focusSessions
    .filter(s => s.date === todayStr)
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const todayEvents = events.filter(e => e.date === todayStr);

  return (
    <ProductivityContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthReady,
        signInWithGoogle,
        signOutUser,
        isLoggingIn,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        dismissToast,
        isCloudSyncing,
        lastCloudSync,
        refreshCloudData,
        syncGoogleCalendar,
        exportToGoogleCalendar,
        isGoogleCalendarSyncing,
        soundAlarmEnabled,
        toggleSoundAlarm,
        activeReminderTask,
        dismissReminder,
        snoozeReminder,
        testAlarm,
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

export const useProductivity = (): ProductivityContextType => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
};
