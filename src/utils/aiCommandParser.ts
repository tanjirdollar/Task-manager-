import { Task, CalendarEvent, Note, Priority, Category, EventType, TaskStatus } from '../types';

export interface ParsedAction {
  type: 'create_task' | 'update_task' | 'complete_task' | 'create_event' | 'create_note' | 'find_items' | 'productivity_summary';
  data?: any;
}

export interface ParsedAIResponse {
  reply: string;
  actions: ParsedAction[];
  source: 'local_nlp' | 'gemini';
}

// Convert English numbers to Bengali numerals
export const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bengaliDigits[parseInt(d, 10)]);
};

// Bengali word-to-number duration mapping
function extractDurationMinutes(text: string): number {
  const lower = text.toLowerCase();
  
  // Bengali word numbers
  if (lower.includes('পনেরো') || lower.includes('১৫') || lower.includes('15')) return 15;
  if (lower.includes('বিশ') || lower.includes('কুড়ি') || lower.includes('২০') || lower.includes('20')) return 20;
  if (lower.includes('পঁচিশ') || lower.includes('২৫') || lower.includes('25')) return 25;
  if (lower.includes('ত্রিশ') || lower.includes('আধ ঘণ্টা') || lower.includes('৩০') || lower.includes('30')) return 30;
  if (lower.includes('পঁয়তাল্লিশ') || lower.includes('৪৫') || lower.includes('45')) return 45;
  if (lower.includes('এক ঘণ্টা') || lower.includes('৬০') || lower.includes('60')) return 60;
  if (lower.includes('দশ') || lower.includes('১০') || lower.includes('10')) return 10;
  if (lower.includes('পাঁচ') || lower.includes('৫') || lower.includes('5')) return 5;

  // Regex check for numeric minutes e.g. "15 মিনিট", "20 min"
  const m = lower.match(/(\d+)\s*(?:মিনিট|মি\.|min|minutes?)/i);
  if (m) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 30; // default 30 min
}

// Extract time from Bengali or English strings
function parseTime(text: string): { timeStr: string; label: string } | null {
  const lower = text.toLowerCase();

  // Bengali hours mapping
  const bnHours: Record<string, { hour: number; label: string }> = {
    'এগারো': { hour: 11, label: '১১:০০' },
    'বারো': { hour: 12, label: '১২:০০' },
    'এক': { hour: 1, label: '০১:০০' },
    'দুই': { hour: 2, label: '০২:০০' },
    'তিন': { hour: 3, label: '০৩:০০' },
    'চার': { hour: 4, label: '০৪:০০' },
    'পাঁচ': { hour: 5, label: '০৫:০০' },
    'ছয়': { hour: 6, label: '০৬:০০' },
    'ছয়': { hour: 6, label: '০৬:০০' },
    'সাত': { hour: 7, label: '০৭:০০' },
    'আট': { hour: 8, label: '০৮:০০' },
    'নয়': { hour: 9, label: '০৯:০০' },
    'নয়': { hour: 9, label: '০৯:০০' },
    'দশ': { hour: 10, label: '১০:০০' },
    '১১': { hour: 11, label: '১১:০০' },
    '১২': { hour: 12, label: '১২:০০' },
    '১': { hour: 1, label: '০১:০০' },
    '২': { hour: 2, label: '০২:০০' },
    '৩': { hour: 3, label: '০৩:০০' },
    '৪': { hour: 4, label: '০৪:০০' },
    '৫': { hour: 5, label: '০৫:০০' },
    '৬': { hour: 6, label: '০৬:০০' },
    '৭': { hour: 7, label: '০৭:০০' },
    '৮': { hour: 8, label: '০৮:০০' },
    '৯': { hour: 9, label: '০৯:০০' },
    '১০': { hour: 10, label: '১০:০০' },
  };

  const isNight = lower.includes('রাত') || lower.includes('রাত্রি') || lower.includes('সন্ধ্যা') || lower.includes('night') || lower.includes('pm');
  const isMorning = lower.includes('সকাল') || lower.includes('ভোর') || lower.includes('morning') || lower.includes('am');
  const isAfternoon = lower.includes('দুপুর') || lower.includes('বিকাল') || lower.includes('বিকেল') || lower.includes('afternoon');

  for (const [key, val] of Object.entries(bnHours)) {
    // Check if query mentions this hour e.g. "এগারোটায়", "রাত এগারোটা", "১১টায়"
    const pattern = new RegExp(`(?:রাত|সকাল|দুপুর|বিকাল|বিকেল)?\\s*${key}\\s*(?:টা|টায়|টার|টায়|\\s*am|\\s*pm)?`, 'i');
    if (pattern.test(lower)) {
      let finalHour = val.hour;
      let period = '';
      if (isNight) {
        if (finalHour < 12) finalHour += 12;
        period = 'রাত ';
      } else if (isAfternoon) {
        if (finalHour < 12 && finalHour >= 1) finalHour += 12;
        period = 'দুপুর ';
      } else if (isMorning) {
        if (finalHour === 12) finalHour = 0;
        period = 'সকাল ';
      } else {
        // Contextual guess: 8, 9, 10, 11 often night if not specified
        if (finalHour >= 7 && finalHour <= 11 && !isMorning) {
          finalHour += 12;
          period = 'রাত ';
        }
      }

      const formattedHour = String(finalHour).padStart(2, '0');
      return {
        timeStr: `${formattedHour}:00`,
        label: `${period}${toBengaliNumber(val.hour)}:০০`,
      };
    }
  }

  // Check 24h format e.g. "23:00", "15:30"
  const m24 = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const m = m24[2];
    return {
      timeStr: `${String(h).padStart(2, '0')}:${m}`,
      label: `${toBengaliNumber(h)}:${toBengaliNumber(m)}`,
    };
  }

  return null;
}

// Clean title from command keywords
function cleanTaskTitle(query: string): string {
  let cleaned = query
    // Remove command verbs
    .replace(/(?:টাস্কে|টাস্ক|লিস্টে|তালিকায়|কাজে)\s*(?:যুক্ত|যোগ|অ্যাড|সেভ|লিস্ট|রাখো|করো|করুন|কর)/gi, '')
    .replace(/(?:যুক্ত|যোগ|অ্যাড|তৈরি)\s*(?:করো|করুন|কর)/gi, '')
    .replace(/(?:একটি|একটা)?\s*(?:হাই[- ]?প্রায়োরিটি|উচ্চ অগ্রাধিকারের|লো[- ]?প্রায়োরিটি|জরুরি)?\s*(?:টাস্ক)/gi, '')
    .replace(/করতে হবে/gi, '')
    .replace(/করতে চাই/gi, '')
    .replace(/[।:;!?,-]+$/g, '')
    .replace(/^[।:;!?,-]+/g, '')
    .trim();

  // If after cleaning it's empty, fallback to intelligent extraction
  if (!cleaned || cleaned.length < 3) {
    if (query.includes('মেডিটেশন')) cleaned = 'মেডিটেশন';
    else if (query.includes('চার্জ')) cleaned = 'ফোন চার্জ দেওয়া';
    else if (query.includes('রিভিউ')) cleaned = 'কোড রিভিউ';
    else cleaned = query.replace(/[।:;!?,-]/g, ' ').trim();
  }

  return cleaned;
}

export interface ParserContext {
  tasks: Array<{ id: string; title: string; priority: Priority; status: TaskStatus; category?: Category | string; dueDate: string }>;
  events: Array<{ id: string; title: string; date: string; startTime: string; endTime: string; type?: EventType | string }>;
  notes: Array<{ id: string; title: string; category?: string; tags?: string[] }>;
  todayStr: string;
  tomorrowStr: string;
  focusMinutes: number;
}

export function parseLocalAICommand(
  rawQuery: string,
  context: ParserContext,
  history?: { sender: string; text: string }[]
): ParsedAIResponse {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();
  const { tasks, events, notes, todayStr, tomorrowStr, focusMinutes } = context;

  // 1. Check if user wants a summary / status
  const isSummaryQuery =
    (lower.includes('সারাংশ') || lower.includes('আজকের কাজ') || lower.includes('কী কাজ আছে') || lower.includes('কি কাজ আছে') || lower.includes('summary')) &&
    !lower.includes('যুক্ত') && !lower.includes('যোগ') && !lower.includes('করো') && !lower.includes('করুন');

  if (isSummaryQuery) {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const todayEvents = events.filter(e => e.date === todayStr);

    let reply = `### 📊 তানজিরের দৈনিক প্রোডাক্টিভিটি সারাংশ (${todayStr})\n\n`;
    reply += `• **অপেক্ষমাণ কাজ:** ${toBengaliNumber(pendingTasks.length)}টি টাস্ক বাকি আছে।\n`;
    if (pendingTasks.length > 0) {
      reply += pendingTasks.slice(0, 3).map(t => `  - ${t.title} (${t.priority === 'high' ? 'উচ্চ অগ্রাধিকার' : 'মাঝারি'})`).join('\n') + '\n';
    }
    reply += `• **আজকের মিটিং ও ইভেন্ট:** ${toBengaliNumber(todayEvents.length)}টি নির্ধারিত।\n`;
    if (todayEvents.length > 0) {
      reply += todayEvents.slice(0, 2).map(e => `  - ${e.startTime}: ${e.title}`).join('\n') + '\n';
    }
    reply += `• **আজকের ফোকাস সেশন:** ${toBengaliNumber(focusMinutes)} মিনিট সম্পন্ন হয়েছে।`;

    return {
      reply,
      actions: [{ type: 'productivity_summary', data: { focusMinutes } }],
      source: 'local_nlp',
    };
  }

  // 2. Check if user wants to complete a task
  const isCompleteTask =
    (lower.includes('সম্পন্ন') || lower.includes('শেষ হয়েছে') || lower.includes('complete') || lower.includes('done') || lower.includes('টিক দাও')) &&
    !lower.includes('নতুন') && !lower.includes('যুক্ত') && !lower.includes('যোগ');

  if (isCompleteTask) {
    // Find target task by title similarity or first pending task
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    let matched = pendingTasks.find(t => lower.includes(t.title.toLowerCase()));

    if (!matched && pendingTasks.length > 0) {
      // Pick first matching word
      const words = lower.split(/\s+/).filter(w => w.length > 2);
      matched = pendingTasks.find(t => words.some(w => t.title.toLowerCase().includes(w)));
    }

    if (matched) {
      return {
        reply: `✓ সফলভাবে সম্পন্ন হয়েছে! **"${matched.title}"** টাস্কটি সমাপ্ত হিসেবে চিহ্নিত করা হয়েছে।`,
        actions: [{ type: 'complete_task', data: { taskId: matched.id, title: matched.title } }],
        source: 'local_nlp',
      };
    } else if (pendingTasks.length > 0) {
      const first = pendingTasks[0];
      return {
        reply: `✓ টাস্ক সম্পন্ন হয়েছে! তালিকার শীর্ষ কাজ **"${first.title}"** সম্পন্ন হিসেবে আপডেট করা হয়েছে।`,
        actions: [{ type: 'complete_task', data: { taskId: first.id, title: first.title } }],
        source: 'local_nlp',
      };
    }
  }

  // 3. Check if user wants to schedule an event / meeting
  const isEventRequest =
    (lower.includes('মিটিং') || lower.includes('ইভেন্ট') || lower.includes('meeting') || lower.includes('event') || lower.includes('ওয়েবিনার') || lower.includes('কল')) &&
    (lower.includes('শিডিউল') || lower.includes('যোগ') || lower.includes('যুক্ত') || lower.includes('রাখো') || lower.includes('করো') || lower.includes('করুন')) &&
    !lower.includes('টাস্কে');

  if (isEventRequest) {
    const parsedTime = parseTime(query);
    const eventDate = (lower.includes('কাল') || lower.includes('tomorrow') || lower.includes('আগামীকাল')) ? tomorrowStr : todayStr;
    const startTime = parsedTime ? parsedTime.timeStr : '15:00';
    const startHourNum = parseInt(startTime.split(':')[0], 10);
    const endTime = `${String(Math.min(23, startHourNum + 1)).padStart(2, '0')}:${startTime.split(':')[1]}`;

    let eventTitle = query
      .replace(/(?:মিটিং|ইভেন্ট|শিডিউল|যোগ|যুক্ত|করো|করুন|কাল|আজ|রাত|সকাল|দুপুর|বিকেল|বিকাল|\d+টায়?)+/gi, '')
      .replace(/[।:;!?,-]+/g, '')
      .trim();

    if (!eventTitle || eventTitle.length < 2) {
      eventTitle = lower.includes('ক্লায়েন্ট') ? 'ক্লায়েন্ট মিটিং' : lower.includes('টিম') ? 'টিম সিঙ্ক মিটিং' : 'জরুরি মিটিং';
    }

    return {
      reply: `✓ ইভেন্ট শিডিউল সম্পন্ন হয়েছে! **"${eventTitle}"** ইভেন্টটি ${eventDate === todayStr ? 'আজ' : 'আগামীকাল'} ${parsedTime ? parsedTime.label : startTime}-এ আপনার ক্যালেন্ডারে যুক্ত করা হয়েছে।`,
      actions: [
        {
          type: 'create_event',
          data: {
            title: eventTitle,
            date: eventDate,
            startTime,
            endTime,
            type: 'meeting',
            description: `এআই সহকারী দ্বারা শিডিউল করা হয়েছে (${query})`,
          },
        },
      ],
      source: 'local_nlp',
    };
  }

  // 4. Check if user wants to create a Note
  const isNoteRequest =
    (lower.includes('নোট') || lower.includes('note')) &&
    (lower.includes('লেখ') || lower.includes('তৈরি') || lower.includes('যুক্ত') || lower.includes('যোগ') || lower.includes('সেভ') || lower.includes('রাখো'));

  if (isNoteRequest) {
    let noteTitle = query
      .replace(/(?:নোট|নোটস|তৈরি|করো|করুন|যোগ|যুক্ত|সেভ|রাখো|লিখো|লেখো)+/gi, '')
      .replace(/[।:;!?,-]+/g, '')
      .trim();

    if (!noteTitle || noteTitle.length < 2) noteTitle = 'আইডিয়া ও দ্রুত ভাবনা';

    return {
      reply: `✓ নোট সংরক্ষণ সম্পন্ন হয়েছে! **"${noteTitle}"** শিরোনামে একটি নতুন নোট আপনার স্টুডিওতে যুক্ত করা হয়েছে।`,
      actions: [
        {
          type: 'create_note',
          data: {
            title: noteTitle,
            content: query,
            category: 'আইডিয়া',
            tags: ['এআই নোট'],
          },
        },
      ],
      source: 'local_nlp',
    };
  }

  // 5. TASK CREATION (PRIMARY & MOST FREQUENT: e.g. "রাত এগারোটায় পনেরো মিনিটের মেডিটেশন করতে হবে। টাস্কে যুক্ত করো।")
  // Check for task intent
  const hasTaskKeyword =
    lower.includes('টাস্ক') ||
    lower.includes('task') ||
    lower.includes('করতে হবে') ||
    lower.includes('করতে চাই') ||
    lower.includes('কাজ যুক্ত') ||
    lower.includes('কাজ যোগ') ||
    lower.includes('লিস্টে রাখো') ||
    lower.includes('তালিকায় রাখো') ||
    lower.includes('মেডিটেশন') ||
    lower.includes('চার্জ দিতে হবে') ||
    lower.includes('রিভিউ করতে হবে') ||
    lower.includes('পড়তে হবে');

  if (hasTaskKeyword) {
    // 5a. Determine priority
    let priority: Priority = 'medium';
    if (lower.includes('হাই') || lower.includes('high') || lower.includes('জরুরি') || lower.includes('জরুরী') || lower.includes('উচ্চ')) {
      priority = 'high';
    } else if (lower.includes('লো') || lower.includes('low') || lower.includes('কম')) {
      priority = 'low';
    }

    // 5b. Determine date
    const dueDate = (lower.includes('কাল') || lower.includes('tomorrow') || lower.includes('কালকে') || lower.includes('আগামীকাল')) ? tomorrowStr : todayStr;

    // 5c. Determine duration (estimatedMinutes)
    const estimatedMinutes = extractDurationMinutes(query);

    // 5d. Determine time string
    const parsedTime = parseTime(query);

    // 5e. Determine category
    let category: Category = 'কাজ';
    if (
      lower.includes('মেডিটেশন') ||
      lower.includes('চার্জ') ||
      lower.includes('নামাজ') ||
      lower.includes('ব্যায়াম') ||
      lower.includes('ব্যক্তিগত') ||
      lower.includes('ঘুম') ||
      lower.includes('ডাক্তার') ||
      lower.includes('বাজার')
    ) {
      category = 'ব্যক্তিগত';
    } else if (lower.includes('ডিজাইন') || lower.includes('ইউআই') || lower.includes('স্কেচ')) {
      category = 'ডিজাইন';
    } else if (lower.includes('স্ট্র্যাটেজি') || lower.includes('রোডম্যাপ')) {
      category = 'স্ট্র্যাটেজি';
    }

    // 5f. Clean up and build descriptive title
    let baseTitle = cleanTaskTitle(query);

    // If time was parsed (e.g. "রাত এগারোটায় মেডিটেশন"), make a neat clean title
    let finalTitle = baseTitle;
    if (parsedTime && !baseTitle.includes(parsedTime.label) && !baseTitle.includes('রাত') && !baseTitle.includes('সকাল')) {
      finalTitle = `${parsedTime.label} ${baseTitle}`;
    }

    // Clean any trailing or double spaces
    finalTitle = finalTitle.replace(/\s+/g, ' ').trim();
    if (!finalTitle || finalTitle.length < 2) {
      finalTitle = lower.includes('মেডিটেশন') ? 'রাত ১১:০০ টায় মেডিটেশন' : 'নতুন টাস্ক';
    }

    const priorityLabel = priority === 'high' ? 'উচ্চ অগ্রাধিকার' : priority === 'low' ? 'সাধারণ অগ্রাধিকার' : 'মাঝারি অগ্রাধিকার';
    const dateLabel = dueDate === todayStr ? 'আজ' : 'আগামীকাল';
    const timeInfo = parsedTime ? ` সময়: ${parsedTime.label},` : '';

    return {
      reply: `✓ টাস্ক তৈরি সম্পন্ন হয়েছে! **"${finalTitle}"** (${timeInfo} আনুমানিক ${toBengaliNumber(estimatedMinutes)} মিনিট, ${priorityLabel}) সফলভাবে আপনার ${dateLabel}কের কাজের তালিকায় যুক্ত করা হয়েছে।`,
      actions: [
        {
          type: 'create_task',
          data: {
            title: finalTitle,
            priority,
            dueDate,
            category,
            estimatedMinutes,
            description: `সময়: ${parsedTime ? parsedTime.label : 'নির্দিষ্ট নয়'} | সময়কাল: ${toBengaliNumber(estimatedMinutes)} মিনিট (${query})`,
          },
        },
      ],
      source: 'local_nlp',
    };
  }

  // 6. DEFAULT HELPFUL FALLBACK: If intent is conversational
  return {
    reply: `আমি আপনার নির্দেশটি বুঝতে পেরেছি। আপনি যা করতে পারেন:
• **টাস্ক যুক্ত করুন:** যেমন "রাত এগারোটায় পনেরো মিনিটের মেডিটেশন করতে হবে। টাস্কে যুক্ত করো।"
• **মিটিং শিডিউল:** যেমন "কাল দুপুর ৩টায় ক্লায়েন্ট মিটিং শিডিউল করো"
• **নোট তৈরি:** যেমন "প্রজেক্ট আর্কিটেকচার নিয়ে একটি নোট তৈরি করো"
• **টাস্ক সম্পন্ন:** যেমন "মেডিটেশন টাস্কটি সম্পন্ন হিসেবে চিহ্নিত করো"`,
    actions: [],
    source: 'local_nlp',
  };
}
