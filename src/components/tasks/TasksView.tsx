import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Trash2, 
  Edit3, 
  Kanban, 
  List, 
  Check, 
  Calendar,
  Clock,
  Tag,
  AlignLeft,
  ListTodo,
  CheckCheck,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useProductivity, toBengaliNumber, getTodayStr, getOffsetDateStr } from '../../context/ProductivityContext';
import { Task, Priority, Category } from '../../types';

interface TasksViewProps {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask, onEditTask }) => {
  const { 
    tasks, 
    addTask,
    toggleTaskStatus, 
    toggleSubtask, 
    deleteTask, 
    updateTask, 
    searchQuery, 
    setSearchQuery,
    setActiveFocusTaskId, 
    setActiveTab 
  } = useProductivity();

  // Status view filter: 'all' | 'pending' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Inline Quick Add Task state
  const [isInlineFormOpen, setIsInlineFormOpen] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDescription, setInlineDescription] = useState('');
  const [inlinePriority, setInlinePriority] = useState<Priority>('medium');
  const [inlineCategory, setInlineCategory] = useState<string>('কাজ');
  const [inlineDueDate, setInlineDueDate] = useState(getTodayStr());

  const toggleExpand = (id: string) => {
    setExpandedTaskIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    addTask({
      title: inlineTitle.trim(),
      description: inlineDescription.trim() || undefined,
      priority: inlinePriority,
      status: 'todo',
      category: inlineCategory as Category,
      dueDate: inlineDueDate,
      estimatedMinutes: 30,
      subtasks: [],
    });

    setInlineTitle('');
    setInlineDescription('');
    setInlinePriority('medium');
    setInlineCategory('কাজ');
    setInlineDueDate(getTodayStr());
    setIsInlineFormOpen(false);
  };

  // Filter tasks based on status, category, priority, and search
  const filteredTasks = tasks.filter(task => {
    // Status Filter (Pending vs Completed)
    if (statusFilter === 'pending' && task.status === 'completed') return false;
    if (statusFilter === 'completed' && task.status !== 'completed') return false;

    // Category Filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

    // Priority Filter
    if (selectedPriority !== 'all') {
      if (selectedPriority === 'high' && !(task.priority === 'high' || task.priority === 'urgent')) return false;
      if (selectedPriority === 'medium' && task.priority !== 'medium') return false;
      if (selectedPriority === 'low' && task.priority !== 'low') return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCategory = task.category.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCategory;
    }

    return true;
  });

  const categories = [
    { id: 'all', label: 'সব ক্যাটাগরি' },
    { id: 'কাজ', label: 'কাজ' },
    { id: 'ইঞ্জিনিয়ারিং', label: 'ইঞ্জিনিয়ারিং' },
    { id: 'ডিজাইন', label: 'ডিজাইন' },
    { id: 'স্ট্র্যাটেজি', label: 'স্ট্র্যাটেজি' },
    { id: 'ব্যক্তিগত', label: 'ব্যক্তিগত' },
  ];

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">উচ্চ অগ্রাধিকার (High)</span>;
      case 'medium':
        return <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">মাঝারি অগ্রাধিকার (Medium)</span>;
      case 'low':
        return <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">সাধারণ অগ্রাধিকার (Low)</span>;
    }
  };

  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const isExpanded = expandedTaskIds[task.id];
    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
    const isDueToday = task.dueDate === getTodayStr();

    return (
      <div
        key={task.id}
        className={`p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border transition-all shadow-2xs group ${
          isCompleted 
            ? 'border-slate-200/70 bg-slate-50/50' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
            {/* Mark as Completed Toggle Button */}
            <button
              onClick={() => toggleTaskStatus(task.id)}
              className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -ml-1 rounded-xl active:scale-95 touch-manipulation"
              aria-label={isCompleted ? 'টাস্কটি অসম্পূর্ণ করুন' : 'টাস্কটি সম্পন্ন করুন'}
              title={isCompleted ? 'পুনরায় সক্রিয় করতে ক্লিক করুন' : 'সম্পন্ন হিসেবে চিহ্নিত করতে ক্লিক করুন'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-bold break-words line-clamp-2 ${
                    isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </h3>
              </div>

              {task.description && (
                <p className={`text-xs mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none break-words ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                  {task.description}
                </p>
              )}

              {/* Task Metadata: Priority, Category, Due Date, Est. Minutes */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 text-[11px] sm:text-xs text-slate-500">
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {task.category}
                </span>

                <span aria-hidden="true" className="text-slate-300">·</span>

                {getPriorityBadge(task.priority)}

                <span aria-hidden="true" className="text-slate-300">·</span>

                <span className={`flex items-center gap-1 font-mono tabular-nums font-semibold ${
                  isDueToday && !isCompleted ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md' : 'text-slate-600'
                }`}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {task.dueDate} {isDueToday && '(আজ)'}
                </span>

                {task.estimatedMinutes && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {toBengaliNumber(task.estimatedMinutes)} মি.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons: Focus, Edit, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <button
                onClick={() => {
                  setActiveFocusTaskId(task.id);
                  setActiveTab('focus');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1 min-h-[36px] min-w-[36px] active:scale-95 touch-manipulation"
                title="এই টাস্কে ফোকাস টাইমার শুরু করুন"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-700" />
                <span className="hidden sm:inline">ফোকাস</span>
              </button>
            )}

            <button
              onClick={() => onEditTask(task)}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 touch-manipulation"
              title="সম্পাদনা করুন (Edit)"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => deleteTask(task.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 touch-manipulation"
              title="মুছে ফেলুন (Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtasks Accordion */}
        {task.subtasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => toggleExpand(task.id)}
              className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 transition-colors font-semibold py-1 touch-manipulation"
            >
              <span className="flex items-center gap-1.5">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                উপ-টাস্ক চেকলিস্ট ({toBengaliNumber(completedSubtasks)}/{toBengaliNumber(task.subtasks.length)}টি সম্পন্ন)
              </span>
              <span className="font-mono text-[11px] tabular-nums font-bold">
                {toBengaliNumber(Math.round((completedSubtasks / task.subtasks.length) * 100))}%
              </span>
            </button>

            {isExpanded && (
              <div className="mt-2.5 space-y-1.5 pl-2 sm:pl-4">
                {task.subtasks.map(st => (
                  <div
                    key={st.id}
                    onClick={() => toggleSubtask(task.id, st.id)}
                    className="flex items-center gap-2.5 text-xs cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 touch-manipulation"
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        st.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 group-hover:border-slate-400 bg-white'
                      }`}
                    >
                      {st.completed && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <span
                      className={`break-words ${
                        st.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Primary Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-1 sm:pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ListTodo className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            <span>টাস্ক ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            নতুন টাস্ক তৈরি, সম্পাদনা, অগ্রাধিকার ও ক্যাটাগরি নির্ধারণ এবং অগ্রগতি পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* View Toggle: List / Kanban Board */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors active:scale-95 touch-manipulation ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>তালিকা</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors active:scale-95 touch-manipulation ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>বোর্ড</span>
            </button>
          </div>

          {/* Clean Add Task Form Toggle & Full Modal Trigger */}
          <button
            onClick={() => setIsInlineFormOpen(!isInlineFormOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-all whitespace-nowrap active:scale-95 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isInlineFormOpen ? 'লুকান' : 'সহজ ফরম'}</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all whitespace-nowrap active:scale-95 touch-manipulation ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন টাস্ক</span>
          </button>
        </div>
      </div>

      {/* Clean In-Page Add Task Form */}
      {isInlineFormOpen && (
        <div className="p-5 bg-white border border-indigo-200 rounded-2xl shadow-sm transition-all animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>দ্রুত টাস্ক তৈরি করুন (Add Task Form)</span>
            </h3>
            <button
              onClick={() => setIsInlineFormOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              বন্ধ করুন ✕
            </button>
          </div>

          <form onSubmit={handleInlineSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                required
                placeholder="টাস্কের শিরোনাম লিখুন (Title)... *"
                value={inlineTitle}
                onChange={e => setInlineTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <textarea
                rows={2}
                placeholder="কাজের বিস্তারিত বিবরণ যোগ করুন (Description - ঐচ্ছিক)..."
                value={inlineDescription}
                onChange={e => setInlineDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  অগ্রাধিকার (Priority: Low, Med, High)
                </label>
                <select
                  value={inlinePriority}
                  onChange={e => setInlinePriority(e.target.value as Priority)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold"
                >
                  <option value="low">সাধারণ (Low)</option>
                  <option value="medium">মাঝারি (Medium)</option>
                  <option value="high">উচ্চ (High)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ক্যাটাগরি (Category)
                </label>
                <select
                  value={inlineCategory}
                  onChange={e => setInlineCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold"
                >
                  <option value="কাজ">কাজ</option>
                  <option value="ইঞ্জিনিয়ারিং">ইঞ্জিনিয়ারিং</option>
                  <option value="ডিজাইন">ডিজাইন</option>
                  <option value="স্ট্র্যাটেজি">স্ট্র্যাটেজি</option>
                  <option value="ব্যক্তিগত">ব্যক্তিগত</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  সমাপ্তির তারিখ (Due Date)
                </label>
                <input
                  type="date"
                  value={inlineDueDate}
                  onChange={e => setInlineDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsInlineFormOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={!inlineTitle.trim()}
                className="px-5 py-1.5 text-xs font-bold text-white bg-slate-900 disabled:opacity-40 hover:bg-slate-800 rounded-lg transition-colors"
              >
                তৈরি করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prominent Status Filter Tabs: সব টাস্ক | অপেক্ষমাণ টাস্ক | সম্পন্ন করা টাস্ক */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        {/* Status segmented tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap active:scale-95 touch-manipulation ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>সব টাস্ক</span>
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              ({toBengaliNumber(tasks.length)})
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap active:scale-95 touch-manipulation ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>অপেক্ষমাণ টাস্ক</span>
            <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md">
              {toBengaliNumber(pendingCount)}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap active:scale-95 touch-manipulation ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>সম্পন্ন টাস্ক</span>
            <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">
              {toBengaliNumber(completedCount)}
            </span>
          </button>
        </div>

        {/* Secondary Category & Priority Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">ক্যাটাগরি:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden font-semibold"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">অগ্রাধিকার:</span>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden font-semibold"
            >
              <option value="all">সব অগ্রাধিকার</option>
              <option value="high">উচ্চ (High)</option>
              <option value="medium">মাঝারি (Medium)</option>
              <option value="low">সাধারণ (Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List / Kanban View Render */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <ListTodo className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-800">কোনো টাস্ক পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter === 'completed'
                  ? 'এখনো কোনো টাস্ক সম্পন্ন হিসেবে চিহ্নিত করা হয়নি।'
                  : 'বর্তমান ফিল্টারের অধীনে কোনো টাস্ক নেই। নতুন টাস্ক তৈরি করে কাজ শুরু করুন!'}
              </p>
              <button
                onClick={onOpenNewTask}
                className="mt-4 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5 touch-manipulation active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন টাস্ক তৈরি করুন</span>
              </button>
            </div>
          ) : (
            filteredTasks.map(task => renderTaskCard(task))
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column: করতে হবে */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                করতে হবে (To Do)
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 font-bold">
                {toBengaliNumber(todoTasks.length)}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto flex flex-col">
              {todoTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 mb-1 text-slate-300" />
                  <span className="text-xs font-medium">কোনো কাজ বাকি নেই</span>
                </div>
              ) : (
                todoTasks.map(task => (
                  <div key={task.id} className="relative group">
                    {renderTaskCard(task)}
                    <button
                      onClick={() => updateTask(task.id, { status: 'in_progress' })}
                      className="mt-1.5 w-full py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors font-semibold"
                    >
                      চলমান তালিকায় নিন →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column: চলমান */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                চলমান (In Progress)
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 font-bold">
                {toBengaliNumber(inProgressTasks.length)}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto flex flex-col">
              {inProgressTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <Clock className="w-6 h-6 mb-1 text-slate-300" />
                  <span className="text-xs font-medium">কোনো কাজ চলমান নেই</span>
                </div>
              ) : (
                inProgressTasks.map(task => (
                  <div key={task.id} className="relative group">
                    {renderTaskCard(task)}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateTask(task.id, { status: 'todo' })}
                        className="flex-1 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors text-left pl-1 font-semibold"
                      >
                        ← বাকি আছে
                      </button>
                      <button
                        onClick={() => updateTask(task.id, { status: 'completed' })}
                        className="flex-1 py-1 text-[11px] text-emerald-700 hover:text-emerald-900 hover:bg-slate-200/60 rounded-lg transition-colors text-right pr-1 font-semibold"
                      >
                        সম্পন্ন ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column: সম্পন্ন */}
          <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                সম্পন্ন (Completed)
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 font-bold">
                {toBengaliNumber(completedTasks.length)}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto flex flex-col">
              {completedTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <CheckCheck className="w-6 h-6 mb-1 text-slate-300" />
                  <span className="text-xs font-medium">কোনো কাজ এখনো সম্পন্ন হয়নি</span>
                </div>
              ) : (
                completedTasks.map(task => (
                  <div key={task.id} className="relative group">
                    {renderTaskCard(task)}
                    <button
                      onClick={() => updateTask(task.id, { status: 'in_progress' })}
                      className="mt-1.5 w-full py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors font-semibold"
                    >
                      ← পুনরায় চালু করুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
