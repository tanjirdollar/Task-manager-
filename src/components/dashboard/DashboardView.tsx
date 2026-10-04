import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar as CalendarIcon, 
  FileText, 
  Sparkles, 
  Plus, 
  Play, 
  Flame, 
  Check, 
  ChevronRight, 
  CalendarDays,
  Target,
  ListTodo,
  CheckCheck,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { useProductivity, formatBengaliDate, toBengaliNumber, getTodayStr } from '../../context/ProductivityContext';
import { Task, CalendarEvent } from '../../types';

interface DashboardViewProps {
  onOpenNewTask: () => void;
  onOpenNewEvent: () => void;
  onOpenNewNote?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTask,
  onOpenNewEvent,
  onOpenNewNote,
}) => {
  const { 
    user,
    firebaseUser,
    signInWithGoogle,
    isCloudSyncing,
    refreshCloudData,
    lastCloudSync,
    tasks, 
    toggleTaskStatus, 
    events, 
    notes, 
    addNote, 
    todayFocusMinutes, 
    setActiveTab, 
    todayEvents, 
    completedTasksCount,
    pendingTasksCount,
    setActiveFocusTaskId,
    addTask
  } = useProductivity();

  const [scratchpadText, setScratchpadText] = useState('');
  const [scratchpadSaved, setScratchpadSaved] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [dashboardTaskView, setDashboardTaskView] = useState<'today' | 'pending'>('today');
  const [dashboardEventView, setDashboardEventView] = useState<'today' | 'upcoming'>('today');

  // Time-based Bengali greeting
  const today = new Date();
  const hours = today.getHours();
  const timeGreeting = hours < 12 
    ? 'শুভ সকাল' 
    : hours < 16 
    ? 'শুভ দুপুর' 
    : hours < 19 
    ? 'শুভ অপরাহ্ন' 
    : 'শুভ সন্ধ্যা';

  const todayStr = getTodayStr();
  const formattedToday = formatBengaliDate(todayStr);

  // Filter tasks
  // All pending tasks due today or earlier (overdue), in progress, or created today:
  const todayTasksList = tasks.filter(t => 
    t.status !== 'completed' && (
      t.dueDate <= todayStr || 
      t.status === 'in_progress' || 
      (t.createdAt && t.createdAt.split('T')[0] === todayStr)
    )
  );
  const pendingTasksList = tasks.filter(t => t.status !== 'completed');
  const completedTasksList = tasks.filter(t => t.status === 'completed');

  // Currently displayed tasks on dashboard based on toggle
  // Seamlessly shows pending tasks if today tasks are empty so newly created tasks are never hidden
  const displayedTasks = dashboardTaskView === 'today' 
    ? (todayTasksList.length > 0 ? todayTasksList : pendingTasksList) 
    : pendingTasksList;

  // Events list for today and upcoming
  const todayEventsList = events
    .filter(e => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingEventsList = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  const displayedEvents = dashboardEventView === 'today' 
    ? (todayEventsList.length > 0 ? todayEventsList : upcomingEventsList)
    : upcomingEventsList;

  const completionRate = tasks.length > 0 
    ? Math.round((completedTasksCount / tasks.length) * 100) 
    : 0;

  const handleSaveScratchpad = () => {
    if (!scratchpadText.trim()) return;
    const lines = scratchpadText.trim().split('\n');
    const title = lines[0].slice(0, 50);
    const content = scratchpadText.trim();
    addNote({
      title: title || 'দ্রুত নোট',
      content,
      category: 'আইডিয়া',
      tags: ['দ্রুত-নোট'],
      pinned: false,
    });
    setScratchpadText('');
    setScratchpadSaved(true);
    setTimeout(() => setScratchpadSaved(false), 2500);
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
      category: 'কাজ',
      dueDate: todayStr,
      estimatedMinutes: 30,
      subtasks: [],
    });
    setQuickTaskTitle('');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <span className="text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">উচ্চ (High)</span>;
      case 'medium':
        return <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md">মাঝারি (Med)</span>;
      default:
        return <span className="text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">সাধারণ (Low)</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Personalized Header & Profile Strip */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>{formattedToday}</span>
            <span aria-hidden="true">·</span>
            <span>{timeGreeting}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>স্বাগতম, {user.name}</span>
          </h1>

          {/* User profile details */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">{user.role}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-mono">{user.email}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-indigo-600 font-medium">আজকের লক্ষ্য: সর্বোচ্চ মনোযোগ</span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenNewTask}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all whitespace-nowrap active:scale-95"
            title="নতুন টাস্ক তৈরি করুন"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন টাস্ক</span>
          </button>

          <button
            onClick={onOpenNewEvent}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap active:scale-95"
            title="নতুন ইভেন্ট শিডিউল করুন"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>নতুন ইভেন্ট</span>
          </button>

          <button
            onClick={onOpenNewNote}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap active:scale-95"
            title="নতুন নোট লিখুন"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>নতুন নোট</span>
          </button>

          <button
            onClick={() => setActiveTab('focus')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition-colors whitespace-nowrap active:scale-95"
            title="ফোকাস টাইমার শুরু করুন"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-700" />
            <span>টাইমার</span>
          </button>
        </div>
      </div>

      {/* 2. Clear KPI Cards for Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* আজকের টাস্ক */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">আজকের টাস্ক</span>
            <ListTodo className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {toBengaliNumber(todayTasksList.length)}
            </span>
            <span className="text-xs text-slate-500">টি নির্ধারিত</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>টাস্ক লিস্ট খুলুন →</span>
          </div>
        </div>

        {/* অপেক্ষমাণ টাস্ক */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">অপেক্ষমাণ টাস্ক</span>
            <Circle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {toBengaliNumber(pendingTasksCount)}
            </span>
            <span className="text-xs text-slate-500">টি বাকি</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-bold">
            কাজের তালিকা দেখুন
          </div>
        </div>

        {/* সম্পন্ন করা টাস্ক */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">সম্পন্ন করা টাস্ক</span>
            <CheckCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {toBengaliNumber(completedTasksCount)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {toBengaliNumber(tasks.length)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold">
            {toBengaliNumber(completionRate)}% সম্পন্ন হয়েছে
          </div>
        </div>

        {/* আসন্ন ইভেন্ট */}
        <div 
          onClick={() => setActiveTab('events')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">আসন্ন ইভেন্ট</span>
            <CalendarDays className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {toBengaliNumber(todayEvents.length)}
            </span>
            <span className="text-xs text-slate-500">আজকের সূচি</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {todayEvents[0] ? `${todayEvents[0].startTime} · শুরু` : 'আজ নতুন মিটিং নেই'}
          </div>
        </div>

        {/* ফোকাস টাইমার সারাংশ */}
        <div 
          onClick={() => setActiveTab('focus')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">ফোকাস টাইমার সারাংশ</span>
            <Flame className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {toBengaliNumber(todayFocusMinutes)}
            </span>
            <span className="text-xs text-slate-500">মিনিট ফোকাস</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-bold flex items-center justify-between">
            <span>লক্ষ্য: ১২০ মিনিট</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Visual Hierarchy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Most Important Task Views (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* টাস্ক তালিকা (Task Queue Card with Toggle) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-indigo-600" />
                  <span>কাজের তালিকা (Task Queue)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  টাস্ক তৈরি করলে তা সঙ্গে সঙ্গে এখানে প্রদর্শিত হয়
                </p>
              </div>

              {/* Segmented view switch: আজকের টাস্ক vs অপেক্ষমাণ টাস্ক */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDashboardTaskView('today')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    dashboardTaskView === 'today'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  আজকের টাস্ক ({toBengaliNumber(todayTasksList.length)})
                </button>
                <button
                  onClick={() => setDashboardTaskView('pending')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    dashboardTaskView === 'pending'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সব বাকি ({toBengaliNumber(pendingTasksCount)})
                </button>
              </div>
            </div>

            {/* Quick add inline task input */}
            <form onSubmit={handleQuickAddTask} className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="নতুন টাস্ক লিখুন এবং সরাসরি যোগ করুন... *"
                value={quickTaskTitle}
                onChange={e => setQuickTaskTitle(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 disabled:opacity-40 hover:bg-slate-800 rounded-xl transition-all shrink-0 active:scale-95"
              >
                যোগ করুন
              </button>
            </form>

            {/* Task rows */}
            {displayedTasks.length === 0 ? (
              <div className="py-10 px-4 text-center bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {dashboardTaskView === 'today' ? 'আজকের জন্য কোনো কাজ বাকি নেই' : 'সব কাজ সম্পন্ন হয়েছে'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  {dashboardTaskView === 'today'
                    ? 'উপরের ইনপুট দিয়ে দ্রুত নতুন টাস্ক যোগ করুন অথবা "সব বাকি" তালিকা দেখুন।'
                    : 'চমৎকার! আপনি সব নির্ধারিত কাজ সম্পন্ন করেছেন।'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedTasks.slice(0, 6).map((task: Task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-slate-50/70 border-slate-200/60 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation active:scale-90"
                          aria-label={isCompleted ? 'অসম্পূর্ণ করুন' : 'সম্পন্ন করুন'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-xs sm:text-sm font-bold break-words line-clamp-2 sm:truncate ${
                              isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                              {task.category}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            {getPriorityBadge(task.priority)}
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-mono tabular-nums text-slate-600">
                              তারিখ: {task.dueDate}
                            </span>
                            {task.subtasks.length > 0 && (
                              <>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="font-mono tabular-nums">
                                  {toBengaliNumber(task.subtasks.filter(s => s.completed).length)}/
                                  {toBengaliNumber(task.subtasks.length)} উপ-টাস্ক
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setActiveFocusTaskId(task.id);
                            setActiveTab('focus');
                          }}
                          className="px-2.5 py-1.5 min-h-[36px] text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1 shrink-0 touch-manipulation active:scale-95"
                          title="এই টাস্কে ফোকাস টাইমার শুরু করুন"
                        >
                          <Play className="w-3 h-3 fill-indigo-700" />
                          <span>ফোকাস</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {displayedTasks.length > 6 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  আরও {toBengaliNumber(displayedTasks.length - 6)}টি টাস্ক দেখুন →
                </button>
              </div>
            )}
          </div>

          {/* সম্পন্ন করা টাস্ক (Completed Tasks Summary Section) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>সম্পন্ন করা টাস্ক ({toBengaliNumber(completedTasksCount)})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  আজ এবং সাম্প্রতিক সময়ে সম্পন্ন হওয়া কাজের সাফল্য
                </p>
              </div>

              {completedTasksList.length > 3 && (
                <button
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  {showAllCompleted ? 'কম দেখান' : 'সব দেখুন'}
                </button>
              )}
            </div>

            {completedTasksList.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                এখনো কোনো টাস্ক সম্পন্ন হয়নি। কাজগুলো সম্পন্ন করে চেক করুন!
              </div>
            ) : (
              <div className="space-y-2">
                {(showAllCompleted ? completedTasksList : completedTasksList.slice(0, 3)).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="text-emerald-600 shrink-0"
                        title="পুনরায় সক্রিয় করতে ক্লিক করুন"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <span className="line-through text-slate-500 truncate font-semibold">
                        {task.title}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0 ml-2">
                      {task.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Events, Focus Timer Summary, & Scratchpad (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* আসন্ন ইভেন্ট (Upcoming Events Card) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <span>ইভেন্ট ও মিটিং সূচি</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  আজ ও আসন্ন দিনগুলোর নির্ধারিত টাইমব্লক
                </p>
              </div>

              <button
                onClick={onOpenNewEvent}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ইভেন্ট যোগ</span>
              </button>
            </div>

            {/* Event Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-bold">
              <button
                onClick={() => setDashboardEventView('today')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  dashboardEventView === 'today'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আজকের ({toBengaliNumber(todayEventsList.length)})
              </button>
              <button
                onClick={() => setDashboardEventView('upcoming')}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  dashboardEventView === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আসন্ন ({toBengaliNumber(upcomingEventsList.length)})
              </button>
            </div>

            {displayedEvents.length === 0 ? (
              <div className="py-10 px-4 text-center bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {dashboardEventView === 'today' ? 'আজকের কোনো নির্ধারিত ইভেন্ট নেই' : 'আসন্ন কোনো ইভেন্ট নেই'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  {dashboardEventView === 'today'
                    ? 'আসন্ন ইভেন্ট দেখতে উপরের ট্যাবে ক্লিক করুন অথবা নতুন ইভেন্ট যুক্ত করুন।'
                    : 'আপনার কোনো আসন্ন মিটিং নেই। নতুন ইভেন্ট শিডিউল করতে পারেন।'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedEvents.slice(0, 4).map((evt: CalendarEvent) => {
                  const isToday = evt.date === todayStr;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setActiveTab('calendar')}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-100/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums font-bold text-slate-800">
                          {!isToday && (
                            <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[10px] font-sans font-bold">
                              {evt.date}
                            </span>
                          )}
                          <span>{evt.startTime} - {evt.endTime}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-bold capitalize">
                          {evt.type === 'meeting' ? 'মিটিং' : evt.type === 'focus' ? 'ডিপ ফোকাস' : evt.type === 'workshop' ? 'কর্মশালা' : evt.type}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">
                        {evt.title}
                      </div>

                      {evt.location && (
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          স্থান: {evt.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {displayedEvents.length > 0 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
                >
                  সম্পূর্ণ ক্যালেন্ডারে দেখুন →
                </button>
              </div>
            )}
          </div>

          {/* ফোকাস টাইমার সারাংশ (Focus Timer Summary Card) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>ফোকাস টাইমার সারাংশ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  আজকের গভীর কাজের অগ্রগতি ও সেশন
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {toBengaliNumber(todayFocusMinutes)} / ১২০ মি.
              </span>
            </div>

            {/* Visual Gauge */}
            <div className="space-y-2 mt-3">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayFocusMinutes / 120) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>আজকের অগ্রগতি: {toBengaliNumber(Math.round(Math.min(100, (todayFocusMinutes / 120) * 100)))}%</span>
                <span className="text-slate-600 font-bold">দৈনিক লক্ষ্য ১২০ মিনিট</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-medium">
                ২৫ মিনিটের পোমোডোরো সেশন
              </div>
              <button
                onClick={() => setActiveTab('focus')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>টাইমার চালু করুন</span>
              </button>
            </div>
          </div>

          {/* দ্রুত নোট (Quick Scratchpad) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>দ্রুত নোট ও ভাবনা</span>
              </h2>
              {scratchpadSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> সংরক্ষিত
                </span>
              )}
            </div>

            <textarea
              rows={3}
              placeholder="যেকোনো তাৎক্ষণিক ভাবনা, মিটিং নোট বা আইডিয়া টুকে রাখুন..."
              value={scratchpadText}
              onChange={e => setScratchpadText(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 resize-none transition-all shadow-2xs"
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">
                {scratchpadText.length > 0 ? `${toBengaliNumber(scratchpadText.length)} অক্ষর` : 'সরাসরি নোটসে সেভ হবে'}
              </span>
              <button
                type="button"
                onClick={handleSaveScratchpad}
                disabled={!scratchpadText.trim()}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors"
              >
                নোটসে সংরক্ষণ
              </button>
            </div>
          </div>

          {/* সাম্প্রতিক সংরক্ষিত নোটসমূহ (Recent Saved Notes Card) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>সাম্প্রতিক সংরক্ষিত নোট ({toBengaliNumber(notes.length)})</span>
              </h2>

              <button
                onClick={() => setActiveTab('notes')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                সব নোট দেখুন →
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                এখনো কোনো নোট নেই। নতুন নোট তৈরি করুন!
              </div>
            ) : (
              <div className="space-y-2">
                {notes.slice(0, 3).map(n => (
                  <div
                    key={n.id}
                    onClick={() => setActiveTab('notes')}
                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                      <span className="truncate">{n.title || 'শিরোনামহীন নোট'}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded shrink-0 ml-2">
                        {n.category}
                      </span>
                    </div>

                    {n.tags && n.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {n.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
