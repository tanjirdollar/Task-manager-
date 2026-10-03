import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Plus, 
  Check, 
  Clock, 
  CheckSquare, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  CheckCircle2, 
  Circle, 
  Tag, 
  Flame, 
  CalendarDays,
  ListTodo
} from 'lucide-react';
import { useProductivity, getTodayStr, getOffsetDateStr, toBengaliNumber } from '../../context/ProductivityContext';
import { AssistantMessage, Priority, Category, ActiveTab, ExecutedAction, SearchResultBlock } from '../../types';

export const AssistantView: React.FC = () => {
  const { 
    user,
    tasks, 
    events, 
    notes, 
    todayFocusMinutes, 
    addTask,
    updateTask,
    toggleTaskStatus,
    addEvent,
    addNote,
    setActiveTab,
    completedTasksCount,
    pendingTasksCount
  } = useProductivity();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `স্বাগতম ${user.name}! আমি আপনার এআই প্রোডাক্টিভিটি সহকারী। 
আমি সরাসরি আপনার অ্যাপ্লিকেশনের ভেতরে অ্যাকশন সম্পাদন করতে পারি। 

যেমন:
• নতুন টাস্ক যোগ করা বা প্রায়োরিটি সেট করা
• ক্যালেন্ডারে মিটিং ও ইভেন্ট শিডিউল করা
• নতুন নোট তৈরি ও সংরক্ষণ করা
• পেন্ডিং টাস্ক, ইভেন্ট বা নোট খুঁজে বের করা
• সম্পূর্ণ প্রোডাক্টিভিটি সারাংশ প্রদান করা`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Suggested prompt chips for the user
  const promptSuggestions = [
    { label: 'ফোন চার্জ টাস্ক (উচ্চ অগ্রাধিকার)', prompt: 'একটি হাই-প্রায়োরিটি টাস্ক যুক্ত করো। সকাল সাতটায় ফোন চার্জ দিতে হবে।' },
    { label: 'মিটিং শিডিউল (স্পষ্টীকরণ প্রশ্ন)', prompt: 'Schedule my client meeting tomorrow afternoon.' },
    { label: 'সময় উল্লেখ: দুপুর ২:০০', prompt: 'At 2 PM' },
    { label: 'প্রেজেন্টেশন টাস্ক তৈরি', prompt: 'Create a task to finish my presentation.' },
    { label: 'AI Ideas নোট তৈরি', prompt: 'Create a note called AI Ideas.' },
    { label: 'পেন্ডিং হাই প্রায়োরিটি টাস্ক', prompt: 'Show me my pending high priority tasks.' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const todayStr = getTodayStr();
      const tomorrowStr = getOffsetDateStr(1);

      const contextPayload = {
        tasks: tasks.slice(0, 15).map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          category: t.category,
          dueDate: t.dueDate,
          subtasksCount: t.subtasks.length,
        })),
        events: events.slice(0, 10).map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          type: e.type,
          location: e.location,
        })),
        notes: notes.slice(0, 10).map(n => ({
          id: n.id,
          title: n.title,
          category: n.category,
          tags: n.tags,
          pinned: n.pinned,
        })),
        focusMinutes: todayFocusMinutes,
        todayStr,
        tomorrowStr,
      };

      // Pass conversation history so multi-turn clarifications work seamlessly
      const conversationHistory = [...messages, userMsg].slice(-6).map(m => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: contextPayload,
          history: conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error('সার্ভার রেসপন্স দিতে ব্যর্থ হয়েছে');
      }

      const data = await res.json();
      let replyText = data.reply || 'আপনার নির্দেশ অনুযায়ী অ্যাকশন পর্যালোচনা করা হয়েছে।';
      const receivedActions: any[] = Array.isArray(data.actions) ? data.actions : [];

      const executedList: ExecutedAction[] = [];
      let searchBlock: SearchResultBlock | undefined = undefined;

      // EXECUTE ACTIONS IN PRODUCTIVITY CONTEXT WITH STRICT DUPLICATE PREVENTION
      for (const act of receivedActions) {
        if (act.type === 'create_task' && act.data) {
          const taskData = act.data;
          let dueDate = taskData.dueDate || todayStr;
          if (dueDate === 'today') dueDate = todayStr;
          if (dueDate === 'tomorrow') dueDate = tomorrowStr;
          const cleanTitle = (taskData.title || 'নতুন টাস্ক').trim();

          // Check if identical task already exists to prevent duplicate creation
          const isDuplicate = tasks.some(t => 
            t.title.toLowerCase().trim() === cleanTitle.toLowerCase() && t.dueDate === dueDate
          );

          if (!isDuplicate) {
            const created = addTask({
              title: cleanTitle,
              priority: (taskData.priority as Priority) || 'medium',
              status: 'todo',
              category: (taskData.category as Category) || 'কাজ',
              dueDate,
              description: taskData.description || 'এআই সহকারী দ্বারা তৈরি',
              estimatedMinutes: 30,
              subtasks: [],
            });

            executedList.push({
              type: 'টাস্ক তৈরি',
              description: `"${created.title}" টাস্ক সফলভাবে তৈরি ও ড্যাশবোর্ডে যোগ করা হয়েছে (${taskData.priority === 'high' ? 'উচ্চ অগ্রাধিকার' : 'মাঝারি অগ্রাধিকার'})`,
              targetTab: 'dashboard',
              itemTitle: created.title,
            });
          }
        } 
        else if (act.type === 'update_task' && act.data) {
          const { taskId, title, priority, dueDate, status } = act.data;
          const target = tasks.find(t => t.id === taskId || (title && t.title.toLowerCase().includes(title.toLowerCase())));
          if (target) {
            const updates: any = {};
            if (priority) updates.priority = priority;
            if (dueDate) updates.dueDate = dueDate;
            if (status) updates.status = status;
            updateTask(target.id, updates);

            executedList.push({
              type: 'টাস্ক আপডেট',
              description: `"${target.title}" টাস্কের তথ্য আপডেট করা হয়েছে`,
              targetTab: 'tasks',
              itemTitle: target.title,
            });
          }
        } 
        else if (act.type === 'complete_task' && act.data) {
          const { taskId, title } = act.data;
          const target = tasks.find(t => t.id === taskId || (title && t.title.toLowerCase().includes(title.toLowerCase()))) || tasks.find(t => t.status !== 'completed');
          if (target) {
            updateTask(target.id, { status: 'completed', completedAt: new Date().toISOString() });
            executedList.push({
              type: 'টাস্ক সম্পন্ন',
              description: `"${target.title}" টাস্কটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে`,
              targetTab: 'tasks',
              itemTitle: target.title,
            });
          }
        } 
        else if (act.type === 'create_event' && act.data) {
          const evtData = act.data;
          let date = evtData.date || todayStr;
          if (date === 'today') date = todayStr;
          if (date === 'tomorrow') date = tomorrowStr;
          const cleanTitle = (evtData.title || 'ক্লায়েন্ট মিটিং').trim();

          // Check if identical event already exists on that date to prevent duplicate
          const isDuplicate = events.some(e => 
            e.title.toLowerCase().trim() === cleanTitle.toLowerCase() && e.date === date
          );

          if (!isDuplicate) {
            const created = addEvent({
              title: cleanTitle,
              date,
              startTime: evtData.startTime || '14:00',
              endTime: evtData.endTime || '15:00',
              type: evtData.type || 'meeting',
              location: evtData.location || 'ভার্চুয়াল মিটিং (Google Meet)',
              description: evtData.description || 'এআই সহকারী দ্বারা ক্যালেন্ডারে শিডিউল করা হয়েছে',
            });

            executedList.push({
              type: 'ইভেন্ট শিডিউল',
              description: `"${created.title}" ক্যালেন্ডারে শিডিউল করা হয়েছে (${date} ${created.startTime})`,
              targetTab: 'calendar',
              itemTitle: created.title,
            });
          }
        } 
        else if (act.type === 'create_note' && act.data) {
          const noteData = act.data;
          const cleanTitle = (noteData.title || 'AI Ideas').trim();

          // Check if identical note already exists
          const isDuplicate = notes.some(n => n.title.toLowerCase().trim() === cleanTitle.toLowerCase());

          if (!isDuplicate) {
            const created = addNote({
              title: cleanTitle,
              content: noteData.content || `## ${cleanTitle}\n- তারিখ: ${todayStr}\n- ভাবনাসমূহ ও মূল পয়েন্ট...`,
              category: noteData.category || 'আইডিয়া',
              tags: noteData.tags || ['এআই', 'আইডিয়া'],
              pinned: false,
            });

            executedList.push({
              type: 'নোট তৈরি',
              description: `"${created.title}" শিরোনামে নোট সংরক্ষণ করা হয়েছে`,
              targetTab: 'notes',
              itemTitle: created.title,
            });
          }
        } 
        else if (act.type === 'find_items' && act.data) {
          const { itemType, priority, status } = act.data;
          if (itemType === 'events') {
            searchBlock = {
              type: 'events',
              title: 'ক্যালেন্ডার ইভেন্ট ও মিটিং',
              items: events.slice(0, 5),
            };
          } else if (itemType === 'notes') {
            searchBlock = {
              type: 'notes',
              title: 'সংরক্ষিত প্রাসঙ্গিক নোটসমূহ',
              items: notes.slice(0, 5),
            };
          } else {
            let matched = tasks.filter(t => t.status !== 'completed');
            if (priority === 'high') {
              matched = matched.filter(t => t.priority === 'high' || t.priority === 'urgent');
            }
            if (status) {
              matched = matched.filter(t => t.status === status);
            }
            searchBlock = {
              type: 'tasks',
              title: priority === 'high' ? 'অপেক্ষমাণ উচ্চ অগ্রাধিকারের টাস্ক' : 'অপেক্ষমাণ টাস্ক তালিকা',
              items: matched.slice(0, 6),
            };
          }
        }
      }

      // CLIENT-SIDE SAFETY NET:
      // If no action was returned by the server, but the user explicitly requested a task creation:
      if (executedList.length === 0) {
        const lowerQ = query.toLowerCase();
        const hasTaskWord = lowerQ.includes('টাস্ক') || lowerQ.includes('task') || lowerQ.includes('কাজ যুক্ত') || lowerQ.includes('লিস্টে রাখো') || lowerQ.includes('চার্জ দিতে হবে');
        const notSearchOrComplete = !lowerQ.includes('দেখাও') && !lowerQ.includes('খুঁজ') && !lowerQ.includes('সম্পন্ন') && !lowerQ.includes('complete');

        if (hasTaskWord && notSearchOrComplete) {
          let priority: Priority = 'medium';
          if (lowerQ.includes('হাই') || lowerQ.includes('high') || lowerQ.includes('জরুরি') || lowerQ.includes('উচ্চ')) {
            priority = 'high';
          } else if (lowerQ.includes('লো') || lowerQ.includes('low') || lowerQ.includes('কম')) {
            priority = 'low';
          }

          let dueDate = todayStr;
          if (lowerQ.includes('কাল') || lowerQ.includes('tomorrow')) dueDate = tomorrowStr;

          // Extract title
          const clauses = query.split(/[।\n;:]+/).map(s => s.trim()).filter(Boolean);
          let taskTitle = '';
          if (clauses.length >= 2) {
            if (/টাস্ক|task|যুক্ত|যোগ|করো|করুন|add|create/i.test(clauses[0])) {
              taskTitle = clauses.slice(1).join(' ').trim();
            } else {
              taskTitle = clauses[0];
            }
          }
          if (!taskTitle) {
            taskTitle = query
              .replace(/^(একটি\s+)?(হাই[- ]?প্রায়োরিটি|উচ্চ অগ্রাধিকারের)?\s*টাস্ক\s*(যুক্ত|যোগ|অ্যাড|তৈরি)?\s*(করো|করুন)?[\s।:.-]*/gi, '')
              .replace(/(টাস্কে?\s*(যুক্ত|যোগ|রাখো|করো|করুন))$/gi, '')
              .trim();
          }
          taskTitle = taskTitle.replace(/^[।:.-]+|[।:.-]+$/g, '').trim() || 'নতুন টাস্ক';

          const isDuplicate = tasks.some(t => t.title.toLowerCase().trim() === taskTitle.toLowerCase().trim() && t.dueDate === dueDate);
          if (!isDuplicate) {
            const category: Category = (lowerQ.includes('ফোন') || lowerQ.includes('চার্জ')) ? 'ব্যক্তিগত' : 'কাজ';
            const created = addTask({
              title: taskTitle,
              priority,
              status: 'todo',
              category,
              dueDate,
              description: 'এআই সহকারী দ্বারা তৈরি',
              estimatedMinutes: 30,
              subtasks: [],
            });

            executedList.push({
              type: 'টাস্ক তৈরি',
              description: `"${created.title}" টাস্ক সফলভাবে তৈরি ও ড্যাশবোর্ডে যোগ করা হয়েছে (${priority === 'high' ? 'উচ্চ অগ্রাধিকার' : 'মাঝারি অগ্রাধিকার'})`,
              targetTab: 'dashboard',
              itemTitle: created.title,
            });

            replyText = `✓ টাস্ক তৈরি সম্পন্ন হয়েছে! **"${created.title}"** টাস্কটি ${priority === 'high' ? 'উচ্চ অগ্রাধিকার (High Priority)' : 'মাঝারি অগ্রাধিকার'} সহ সফলভাবে আপনার ড্যাশবোর্ড ও কাজের তালিকায় যোগ করা হয়েছে।`;
          }
        }
      }

      let finalReplyText = replyText;
      if (executedList.length > 0 && replyText.includes('### 📊 তানজিরের দৈনিক প্রোডাক্টিভিটি সারাংশ')) {
        finalReplyText = `✓ অ্যাকশন সম্পন্ন হয়েছে! আপনার নির্দেশ অনুযায়ী টাস্কটি তৈরি করা হয়েছে।`;
      }

      const botMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: finalReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executedActions: executedList.length > 0 ? executedList : undefined,
        searchResults: searchBlock,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('Assistant error:', err);
      // Fallback local processing
      const botMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'আপনার অনুরোধটি গ্রহণ করা হয়েছে। নেটওয়ার্ক সংযোগ যাচাই করে পুনরায় নির্দেশ দিতে পারেন।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 max-w-4xl mx-auto h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-9.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-base sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span>এআই সহকারী</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            প্রাকৃতিক ভাষায় নির্দেশ দিয়ে টাস্ক, ইভেন্ট ও নোট পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">সক্রিয় ও প্রস্তুত</span>
            <span className="sm:hidden">সক্রিয়</span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Chat Bubble */}
                <div
                  className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-medium break-words">
                    {msg.text}
                  </div>

                  <div className={`text-[10px] mt-1.5 font-mono tabular-nums ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* Executed Actions Badge & Links */}
                {msg.executedActions && msg.executedActions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.executedActions.map((act, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in slide-in-from-bottom-1"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold">{act.description}</span>
                        </div>

                        {act.targetTab && (
                          <button
                            onClick={() => setActiveTab(act.targetTab!)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] flex items-center gap-1 transition-colors shrink-0"
                          >
                            <span>দেখুন</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Search Results Card */}
                {msg.searchResults && (
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        {msg.searchResults.type === 'tasks' && <ListTodo className="w-4 h-4 text-indigo-600" />}
                        {msg.searchResults.type === 'events' && <CalendarDays className="w-4 h-4 text-sky-600" />}
                        {msg.searchResults.type === 'notes' && <FileText className="w-4 h-4 text-amber-600" />}
                        <span>{msg.searchResults.title}</span>
                      </span>
                      <button
                        onClick={() => setActiveTab(msg.searchResults!.type as ActiveTab)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        সবগুলো দেখুন →
                      </button>
                    </div>

                    {msg.searchResults.items.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 text-center">
                        কোনো ফলাফল পাওয়া যায়নি।
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {msg.searchResults.type === 'tasks' && msg.searchResults.items.map((t: any) => (
                          <div 
                            key={t.id} 
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button 
                                onClick={() => toggleTaskStatus(t.id)}
                                className="text-slate-400 hover:text-emerald-600"
                              >
                                {t.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={`font-semibold truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {t.title}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              t.priority === 'urgent' || t.priority === 'high' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-slate-200/80 text-slate-600'
                            }`}>
                              {t.priority === 'high' ? 'উচ্চ' : t.priority === 'urgent' ? 'জরুরি' : 'মাঝারি'}
                            </span>
                          </div>
                        ))}

                        {msg.searchResults.type === 'events' && msg.searchResults.items.map((e: any) => (
                          <div 
                            key={e.id} 
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{e.title}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {e.date} · {e.startTime} - {e.endTime}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded">
                              {e.type}
                            </span>
                          </div>
                        ))}

                        {msg.searchResults.type === 'notes' && msg.searchResults.items.map((n: any) => (
                          <div 
                            key={n.id} 
                            onClick={() => setActiveTab('notes')}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100"
                          >
                            <span className="font-bold text-slate-800 truncate">{n.title}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                              {n.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                  {user.initials}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="font-medium text-slate-600">নির্দেশ বিশ্লেষণ ও অ্যাপ্লিকেশন অ্যাকশন সম্পাদন করা হচ্ছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">পরামর্শ:</span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(item.prompt)}
            className="px-3 py-1.5 min-h-[34px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 whitespace-nowrap text-xs font-medium transition-colors active:scale-95 touch-manipulation"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-1.5 sm:p-2 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder="প্রাকৃতিক ভাষায় নির্দেশ লিখুন (টাস্ক, ইভেন্ট বা নোট)..."
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-hidden text-slate-900 placeholder:text-slate-400 font-medium"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 sm:p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 touch-manipulation"
          title="পাঠান"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
