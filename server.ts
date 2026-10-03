import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client with provided key:', err);
  }
}

// Helper to calculate date strings
function getDates() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return { todayStr, tomorrowStr };
}

// Helper to extract time from text
function parseTimeFromText(text: string): { startTime: string; endTime: string } | null {
  const clean = text.toLowerCase().trim();

  // Check 12-hour format e.g. "2 pm", "2:30 pm", "10 am"
  const m1 = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m1) {
    let hour = parseInt(m1[1], 10);
    const mins = m1[2] || '00';
    const meridiem = m1[3].toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    const startHour = String(hour).padStart(2, '0');
    const endHour = String(Math.min(23, hour + 1)).padStart(2, '0');
    return { startTime: `${startHour}:${mins}`, endTime: `${endHour}:${mins}` };
  }

  // Check 24-hour format e.g. "14:00", "15:30"
  const m2 = clean.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m2) {
    const hour = parseInt(m2[1], 10);
    const mins = m2[2];
    const startHour = String(hour).padStart(2, '0');
    const endHour = String(Math.min(23, hour + 1)).padStart(2, '0');
    return { startTime: `${startHour}:${mins}`, endTime: `${endHour}:${mins}` };
  }

  // Bengali numerals e.g. "২টা", "দুপুর ৩টা", "বিকাল ৪টায়", "সকাল ৭টা"
  const bnMap: Record<string, number> = {
    '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5,
    '৬': 6, '৭': 7, '৮': 8, '৯': 9, '১০': 10,
    '১১': 11, '১২': 12
  };
  for (const [bnDigit, num] of Object.entries(bnMap)) {
    if (clean.includes(bnDigit)) {
      let hour = num;
      if (clean.includes('সকাল') || clean.includes('ভোর')) {
        // Morning
        if (hour === 12) hour = 0;
      } else if (clean.includes('দুপুর') || clean.includes('বিকেল') || clean.includes('বিকাল') || clean.includes('সন্ধ্যা') || hour <= 7) {
        if (hour < 12) hour += 12;
      }
      const startHour = String(hour).padStart(2, '0');
      const endHour = String(Math.min(23, hour + 1)).padStart(2, '0');
      return { startTime: `${startHour}:00`, endTime: `${endHour}:00` };
    }
  }

  // English plain digits with context e.g. "at 2", "at 3", "around 4"
  const m3 = clean.match(/(?:at|around|by)\s*(\d{1,2})\b/i);
  if (m3) {
    let hour = parseInt(m3[1], 10);
    if (hour <= 7 && !clean.includes('morning')) hour += 12;
    const startHour = String(hour).padStart(2, '0');
    const endHour = String(Math.min(23, hour + 1)).padStart(2, '0');
    return { startTime: `${startHour}:00`, endTime: `${endHour}:00` };
  }

  return null;
}

// Helper to extract task info from Bengali/English queries
function extractTaskInfo(query: string, todayStr: string, tomorrowStr: string) {
  const lower = query.toLowerCase();

  // Priority detection
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (
    lower.includes('হাই-প্রায়োরিটি') ||
    lower.includes('হাই প্রায়োরিটি') ||
    lower.includes('হাই-প্রয়োরিটি') ||
    lower.includes('হাই-প্রাধিকার') ||
    lower.includes('হাই প্রায়োরিটি') ||
    lower.includes('high priority') ||
    lower.includes('উচ্চ অগ্রাধিকার') ||
    lower.includes('জরুরি') ||
    lower.includes('urgent') ||
    lower.includes('priority high')
  ) {
    priority = 'high';
  } else if (
    lower.includes('লো-প্রায়োরিটি') ||
    lower.includes('লো প্রায়োরিটি') ||
    lower.includes('low priority') ||
    lower.includes('কম অগ্রাধিকার') ||
    lower.includes('কম প্রায়োরিটি')
  ) {
    priority = 'low';
  }

  // Due Date detection
  let dueDate = todayStr;
  if (lower.includes('tomorrow') || lower.includes('আগামীকাল') || lower.includes('কালকে') || lower.includes('পরশু')) {
    dueDate = tomorrowStr;
  }

  // Category detection
  let category = 'কাজ';
  if (lower.includes('ফোন') || lower.includes('চার্জ') || lower.includes('ব্যক্তিগত') || lower.includes('বাজার') || lower.includes('বাসা')) {
    category = 'ব্যক্তিগত';
  } else if (lower.includes('কোড') || lower.includes('বাগ') || lower.includes('এপিআই') || lower.includes('ডেটাবেজ')) {
    category = 'ইঞ্জিনিয়ারিং';
  } else if (lower.includes('ডিজাইন') || lower.includes('ইউআই') || lower.includes('কালার')) {
    category = 'ডিজাইন';
  }

  // Title extraction:
  let title = '';

  // Check if there are multiple clauses separated by period (।) or newline or colon
  const clauses = query.split(/[।\n;:]+/).map(s => s.trim()).filter(Boolean);
  if (clauses.length >= 2) {
    const isFirstInstruction = /টাস্ক|task|যুক্ত|যোগ|অ্যাড|করো|করুন|বানাও|add|create/i.test(clauses[0]);
    if (isFirstInstruction) {
      title = clauses.slice(1).join(' ').trim();
    } else {
      title = clauses[0];
    }
  }

  if (!title) {
    const quoteMatch = query.match(/["'“]([^"'”]+)["'”]/);
    if (quoteMatch) {
      title = quoteMatch[1].trim();
    }
  }

  if (!title) {
    title = query
      .replace(/^(দয়া করে\s+|অনুগ্রহ করে\s+)?(একটি\s+)?(হাই[- ]?প্রায়োরিটি|উচ্চ অগ্রাধিকারের|লো[- ]?প্রায়োরিটি|জরুরি)?\s*টাস্ক\s*(যুক্ত|যোগ|অ্যাড|তৈরি|ক্রিয়েট)?\s*(করো|করুন|বানাও|রাখো|দাও)?[\s।:.-]*/gi, '')
      .replace(/^(create|add)\s+(a\s+)?(high|medium|low|urgent)?\s*(priority\s+)?task\s*(to\s+|called\s+|for\s+)?/gi, '')
      .replace(/^remind\s+me\s+to\s+/gi, '')
      .replace(/^(একটি\s+)?কাজ\s*(যুক্ত|যোগ|অ্যাড|তৈরি)\s*(করো|করুন)?[\s।:.-]*/gi, '')
      .replace(/(টাস্কে?\s*(যুক্ত|যোগ|অ্যাড|রাখো|দাও|করো|করুন|বানাও))$/gi, '')
      .replace(/(আজকের\s+জন্য|আজকে|আজ|today|tomorrow|আগামীকাল)$/gi, '')
      .trim();
  }

  // Clean punctuation
  title = title.replace(/^[।:.-]+|[।:.-]+$/g, '').trim();

  if (!title || title.length < 2) {
    title = query.replace(/[।:.-]/g, ' ').trim();
  }

  return { title, priority, dueDate, category };
}

// AI Assistant endpoint
app.post('/api/assistant', async (req, res) => {
  try {
    const { message, context, action, history } = req.body;

    if (!message && !action) {
      return res.status(400).json({ error: 'Message or action is required' });
    }

    const dates = getDates();
    const todayStr = context?.todayStr || dates.todayStr;
    const tomorrowStr = context?.tomorrowStr || dates.tomorrowStr;
    const query = (message || '').trim();
    const existingTasks = context?.tasks || [];
    const existingEvents = context?.events || [];
    const existingNotes = context?.notes || [];
    const focusMin = context?.focusMinutes || 0;

    // Previous message context for multi-turn conversational clarifications
    const lastBotMessage = Array.isArray(history) 
      ? [...history].reverse().find((m: any) => m.sender === 'assistant')?.text || ''
      : '';
    const lastUserMessage = Array.isArray(history)
      ? [...history].reverse().filter((m: any) => m.sender === 'user')[1]?.text || ''
      : '';

    // If Gemini client is available, call gemini-3.8-flash with conversational intelligence
    if (aiClient) {
      try {
        const systemInstruction = `You are a high-performance productivity executive AI Assistant inside Kroma Productivity Studio for user "তানজির" (Tanjir).
Current date today is: ${todayStr}.
Tomorrow's date is: ${tomorrowStr}.

CRITICAL TASK HANDLING INSTRUCTION:
- If user requests creating/adding a task in Bengali (e.g. "একটি হাই-প্রায়োরিটি টাস্ক যুক্ত করো। সকাল সাতটায় ফোন চার্জ দিতে হবে।" or "টাস্ক যোগ করো..."), extract the task title and priority ("high" for হাই-প্রায়োরিটি / জরুরি / high priority) and IMMEDIATELY return action "create_task".
- Do NOT output a productivity summary when the user asks to add or create a task!

RULES:
1. Understand casual and conversational instructions in both Bengali and English.
2. If request contains enough information to perform an action, EXECUTE IT DIRECTLY.
   - For Tasks: Title is extracted from user prompt. Defaults: priority = "medium", dueDate = "${todayStr}", category = "কাজ" (or "ব্যক্তিগত" if personal like phone charge).
   - For Notes: Create note immediately with category "আইডিয়া".
3. If IMPORTANT information is missing to perform an action properly (e.g. scheduling a meeting without exact hour), ask a short clarification question and set actions: [].
4. MULTI-TURN MEMORY: If answering previous clarification for meeting time, execute create_event with that time.
5. NEVER CREATE DUPLICATES: If an identical item already exists on the date, inform user politely.
6. ALWAYS CONFIRM WHAT ACTION WAS COMPLETED in the reply text.

Action Types:
- "create_task": { title: string, priority: 'low'|'medium'|'high'|'urgent', dueDate: string, category: 'কাজ'|'ইঞ্জিনিয়ারিং'|'ডিজাইন'|'স্ট্র্যাটেজি'|'ব্যক্তিগত', description?: string }
- "update_task": { taskId: string, title?: string, priority?: string, dueDate?: string, status?: string }
- "complete_task": { taskId: string, title: string }
- "create_event": { title: string, date: string, startTime: string, endTime: string, type: 'meeting'|'focus'|'workshop'|'deadline'|'personal', location?: string, description?: string }
- "create_note": { title: string, content?: string, category?: string, tags?: string[] }
- "find_items": { itemType: 'tasks'|'events'|'notes'|'all', query?: string, priority?: string, status?: string }
- "productivity_summary": { focusMinutes: number }

User's Existing Data Context:
Tasks: ${JSON.stringify(existingTasks)}
Events: ${JSON.stringify(existingEvents)}
Notes: ${JSON.stringify(existingNotes)}
Today Focus Minutes: ${focusMin}

ALWAYS respond with valid JSON:
{
  "reply": "Polite Bengali response confirming the exact action completed or asking clarification.",
  "actions": [ ... ]
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const rawText = response.text?.trim() || '';
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed.reply === 'string' && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            return res.json({
              reply: parsed.reply,
              actions: parsed.actions,
              source: 'gemini',
            });
          }
        } catch {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
              return res.json({
                reply: parsed.reply || rawText,
                actions: parsed.actions,
                source: 'gemini',
              });
            }
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call error, applying enhanced conversational rule engine:', geminiError?.message || geminiError);
      }
    }

    // Comprehensive Natural Language Rule Engine (Active Fallback)
    const lower = query.toLowerCase();
    const actions: any[] = [];
    let reply = '';

    // A. Check if user is answering a previous meeting time clarification
    const isFollowupTimeAnswer = 
      (lastBotMessage.includes('কয়টার সময়') || lastBotMessage.includes('সময়') || lastBotMessage.includes('time') || lastBotMessage.includes('শিডিউল')) &&
      parseTimeFromText(query) !== null;

    if (isFollowupTimeAnswer) {
      const parsedTime = parseTimeFromText(query)!;
      let meetingTitle = 'ক্লায়েন্ট মিটিং (Client Meeting)';
      if (lastUserMessage.toLowerCase().includes('client')) meetingTitle = 'ক্লায়েন্ট মিটিং (Client Meeting)';
      else if (lastUserMessage) {
        meetingTitle = lastUserMessage
          .replace(/schedule (my |a )?/i, '')
          .replace(/tomorrow afternoon|tomorrow|today|বিকেল|কালকে/gi, '')
          .trim() || 'ক্লায়েন্ট মিটিং';
      }

      const date = (lastUserMessage.toLowerCase().includes('tomorrow') || lastUserMessage.includes('কাল') || lastUserMessage.includes('আগামীকাল'))
        ? tomorrowStr
        : todayStr;

      actions.push({
        type: 'create_event',
        data: {
          title: meetingTitle,
          date,
          startTime: parsedTime.startTime,
          endTime: parsedTime.endTime,
          type: 'meeting',
          location: 'ভার্চুয়াল মিটিং (Google Meet)',
          description: 'AI সহকারী দ্বারা শিডিউল করা হয়েছে।',
        },
      });
      reply = `✓ নিশ্চিত করা হয়েছে! **"${meetingTitle}"** ইভেন্টটি ${date === todayStr ? 'আজ' : 'আগামীকাল'} ${parsedTime.startTime} থেকে ${parsedTime.endTime} সময়ে আপনার ক্যালেন্ডারে সফলভাবে শিডিউল করা হয়েছে।`;

      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // B. Check if user wants to mark a task as completed
    const isCompleteIntent =
      lower.includes('সম্পন্ন') ||
      lower.includes('শেষ হয়েছে') ||
      lower.includes('complete') ||
      lower.includes('mark complete') ||
      lower.includes('mark as completed');

    if (isCompleteIntent) {
      const match = existingTasks.find((t: any) => 
        t.status !== 'completed' && lower.includes(t.title.toLowerCase())
      ) || existingTasks.find((t: any) => t.status !== 'completed');

      if (match) {
        actions.push({
          type: 'complete_task',
          data: { taskId: match.id, title: match.title },
        });
        reply = `✓ অ্যাকশন সম্পন্ন! **"${match.title}"** টাস্কটি সম্পন্ন (Completed) হিসেবে চিহ্নিত করা হয়েছে।`;
      } else {
        reply = 'সম্পন্ন হিসেবে চিহ্নিত করার মতো কোনো অপেক্ষমাণ টাস্ক পাওয়া যায়নি।';
      }
      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // C. Check if user wants to find/search tasks, events or notes
    const isFindIntent =
      lower.includes('দেখাও') ||
      lower.includes('খুঁজ') ||
      lower.includes('পেন্ডিং') ||
      lower.startsWith('show') ||
      lower.startsWith('find') ||
      lower.startsWith('list');

    if (isFindIntent) {
      if (lower.includes('event') || lower.includes('meeting') || lower.includes('মিটিং') || lower.includes('ইভেন্ট')) {
        actions.push({ type: 'find_items', data: { itemType: 'events' } });
        reply = `আপনার ক্যালেন্ডারের আসন্ন মিটিং ও ইভেন্ট তালিকা নিচে প্রদর্শিত হলো:`;
      } else if (lower.includes('note') || lower.includes('নোট')) {
        actions.push({ type: 'find_items', data: { itemType: 'notes' } });
        reply = `আপনার সংরক্ষিত নোটগুলোর তালিকা নিচে প্রদর্শিত হলো:`;
      } else {
        const priorityFilter = (lower.includes('high') || lower.includes('হাই') || lower.includes('উচ্চ')) ? 'high' : undefined;
        actions.push({ type: 'find_items', data: { itemType: 'tasks', priority: priorityFilter, status: 'todo' } });
        reply = `আপনার অপেক্ষমাণ ${priorityFilter === 'high' ? 'উচ্চ অগ্রাধিকারের' : ''} টাস্কগুলো নিচে খুঁজে বের করা হয়েছে:`;
      }
      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // D. Check TASK INTENT (HIGH PRIORITY MATCH)
    // Matches: "একটি হাই-প্রায়োরিটি টাস্ক যুক্ত করো। সকাল সাতটায় ফোন চার্জ দিতে হবে।"
    // Matches: "টাস্ক যুক্ত করো", "টাস্ক যোগ করো", "টাস্ক বানাও", "কাজটি লিস্টে রাখো", "Create a task..."
    const isTaskIntent =
      lower.includes('টাস্ক') ||
      lower.includes('task') ||
      lower.includes('কাজ যুক্ত') ||
      lower.includes('কাজ যোগ') ||
      lower.includes('কাজ অ্যাড') ||
      lower.includes('কাজ তৈরি') ||
      lower.includes('লিস্টে রাখো') ||
      lower.includes('লিস্টে তোলো') ||
      lower.includes('লিস্টে যোগ') ||
      lower.includes('চার্জ দিতে হবে') ||
      lower.includes('করতে হবে') ||
      lower.startsWith('remind me to');

    if (isTaskIntent) {
      const { title, priority, dueDate, category } = extractTaskInfo(query, todayStr, tomorrowStr);

      // Check if duplicate exists
      const isDuplicate = existingTasks.some((t: any) => 
        t.title.toLowerCase().trim() === title.toLowerCase().trim() && t.dueDate === dueDate
      );

      if (isDuplicate) {
        reply = `আপনার কাজের তালিকায় ইতিমধ্যে **"${title}"** নামে একটি টাস্ক রয়েছে (${dueDate === todayStr ? 'আজকের' : 'আগামীকালের'} জন্য)। ডুপ্লিকেট এড়াতে পুনরায় যোগ করা হয়নি।`;
      } else {
        actions.push({
          type: 'create_task',
          data: {
            title,
            priority,
            dueDate,
            category,
            description: `এআই সহকারী দ্বারা তৈরি (${priority === 'high' ? 'উচ্চ অগ্রাধিকার' : 'মাঝারি'})`,
          },
        });
        const priorityBn = priority === 'high' ? 'উচ্চ অগ্রাধিকার (High Priority)' : priority === 'low' ? 'কম অগ্রাধিকার' : 'মাঝারি অগ্রাধিকার';
        reply = `✓ টাস্ক তৈরি সম্পন্ন হয়েছে! **"${title}"** টাস্কটি ${priorityBn} সহ সফলভাবে আপনার কাজের তালিকায় যোগ করা হয়েছে।`;
      }

      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // E. Check MEETING / EVENT INTENT
    const isMeetingIntent = 
      lower.includes('schedule') || 
      lower.includes('meeting') || 
      lower.includes('মিটিং') || 
      lower.includes('শিডিউল') ||
      lower.includes('ইভেন্ট');

    if (isMeetingIntent) {
      const hasSpecificTime = parseTimeFromText(query) !== null;

      if (!hasSpecificTime) {
        // Ask clarification question
        const isAfternoon = lower.includes('afternoon') || lower.includes('বিকেল') || lower.includes('দুপুর');
        const isTomorrow = lower.includes('tomorrow') || lower.includes('আগামীকাল') || lower.includes('কাল');

        if (isAfternoon) {
          reply = `${isTomorrow ? 'আগামীকাল' : 'আজ'} বিকেলে মিটিংটি ঠিক কয়টার সময় শিডিউল করতে চান? যেমন: দুপুর ২:০০ বা বিকেল ৩:৩০?`;
        } else {
          reply = `মিটিংটি ঠিক কয়টার সময় শিডিউল করতে চান? অনুগ্রহ করে সময়টি জানান (যেমন: সকাল ১১:০০ বা দুপুর ২:০০)।`;
        }
        return res.json({ reply, actions: [], source: 'conversational_clarification' });
      }

      // Schedule meeting directly
      const parsedTime = parseTimeFromText(query)!;
      const isTomorrow = lower.includes('tomorrow') || lower.includes('আগামীকাল') || lower.includes('কাল');
      const date = isTomorrow ? tomorrowStr : todayStr;

      let title = query
        .replace(/schedule (my |a )?/i, '')
        .replace(/tomorrow afternoon|tomorrow|today|at \d+.*|আগামীকাল.*|বিকেল.*/gi, '')
        .trim();
      title = title.replace(/^["']|["']$/g, '').trim();
      if (!title || title.length < 3) title = 'ক্লায়েন্ট মিটিং (Client Meeting)';

      actions.push({
        type: 'create_event',
        data: {
          title,
          date,
          startTime: parsedTime.startTime,
          endTime: parsedTime.endTime,
          type: 'meeting',
          location: 'ভার্চুয়াল মিটিং (Google Meet)',
          description: 'AI সহকারী দ্বারা শিডিউল করা হয়েছে।',
        },
      });
      reply = `✓ সম্পন্ন হয়েছে! **"${title}"** ইভেন্টটি ${date === todayStr ? 'আজ' : 'আগামীকাল'} ${parsedTime.startTime} থেকে ${parsedTime.endTime} সময়ে ক্যালেন্ডারে যোগ করা হয়েছে।`;

      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // F. Check NOTE INTENT
    const isNoteIntent =
      lower.includes('নোট') ||
      lower.includes('note') ||
      lower.includes('jot down');

    if (isNoteIntent) {
      let title = query
        .replace(/create (a )?note (called |titled |about )?/i, '')
        .replace(/add (a )?note (called |titled |about )?/i, '')
        .replace(/(নোট তৈরি করুন|নতুন নোট লিখুন|নোট বানান|নামক নোট|নোট লিখুন)/i, '')
        .trim();
      title = title.replace(/^["']|["']$/g, '').trim();
      if (!title) title = 'AI Ideas';

      actions.push({
        type: 'create_note',
        data: {
          title,
          content: `## ${title}\n- তারিখ: ${todayStr}\n- ভাবনাসমূহ ও মূল পয়েন্ট...`,
          category: 'আইডিয়া',
          tags: ['এআই', 'আইডিয়া'],
        },
      });
      reply = `✓ নোট তৈরি সম্পন্ন হয়েছে! **"${title}"** শিরোনামে একটি নতুন নোট তৈরি করে সংরক্ষণ করা হয়েছে।`;

      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // G. Explicit SUMMARY INTENT (ONLY when user explicitly asks for summary)
    const isSummaryIntent = 
      lower.includes('সারাংশ') ||
      lower.includes('summary') ||
      lower.includes('রিপোর্ট') ||
      lower.includes('overview') ||
      lower.includes('প্রোডাক্টিভিটি কেমন');

    if (isSummaryIntent) {
      const pendingCount = existingTasks.filter((t: any) => t.status !== 'completed').length;
      const completedCount = existingTasks.filter((t: any) => t.status === 'completed').length;

      actions.push({
        type: 'productivity_summary',
        data: { focusMinutes: focusMin, pendingCount, completedCount },
      });

      reply = `### 📊 তানজিরের দৈনিক প্রোডাক্টিভিটি সারাংশ
- **সম্পন্ন কাজ**: ${completedCount}টি টাস্ক শেষ হয়েছে।
- **অপেক্ষমাণ কাজ**: ${pendingCount}টি টাস্ক বাকি রয়েছে।
- **ফোকাস সেশন**: আজ মোট ${focusMin} মিনিট গভীর মনোযোগ বজায় রেখেছেন।
- **ক্যালেন্ডার**: আজকের জন্য ${existingEvents.length}টি ইভেন্ট নির্ধারিত রয়েছে।`;

      return res.json({ reply, actions, source: 'conversational_engine' });
    }

    // H. General conversational helpful response (Default fallback)
    reply = `আমি আপনাকে কীভাবে সাহায্য করতে পারি? আপনি প্রাকৃতিক ভাষায় নির্দেশ দিয়ে নিচের কাজগুলো করতে পারেন:
• টাস্ক তৈরি: যেমন "একটি হাই-প্রায়োরিটি টাস্ক যুক্ত করো: সকাল সাতটায় ফোন চার্জ দিতে হবে"
• মিটিং শিডিউল: যেমন "কাল বিকেল ৩টায় ক্লায়েন্ট মিটিং শিডিউল করো"
• নোট লেখা: যেমন "AI Ideas নামে একটি নোট তৈরি করো"
• তথ্য খোঁজা: যেমন "আমার পেন্ডিং হাই প্রায়োরিটি টাস্কগুলো দেখাও"`;

    return res.json({ reply, actions: [], source: 'conversational_engine' });

  } catch (error: any) {
    console.error('Server error handling assistant request:', error);
    res.status(500).json({ error: 'Internal assistant error' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
