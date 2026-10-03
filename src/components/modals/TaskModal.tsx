import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Tag, AlignLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task, Priority, Category } from '../../types';
import { getTodayStr, getOffsetDateStr } from '../../context/ProductivityContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  taskToEdit?: Task | null;
  defaultDueDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string>('কাজ');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [dueDate, setDueDate] = useState(defaultDueDate || getTodayStr());
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const standardCategories = ['কাজ', 'ইঞ্জিনিয়ারিং', 'ডিজাইন', 'স্ট্র্যাটেজি', 'ব্যক্তিগত'];

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority === 'urgent' ? 'high' : taskToEdit.priority);
      
      if (standardCategories.includes(taskToEdit.category)) {
        setCategory(taskToEdit.category);
        setIsCustomCategory(false);
      } else {
        setIsCustomCategory(true);
        setCustomCategory(taskToEdit.category);
      }

      setDueDate(taskToEdit.dueDate || getTodayStr());
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 30);
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('কাজ');
      setIsCustomCategory(false);
      setCustomCategory('');
      setDueDate(defaultDueDate || getTodayStr());
      setEstimatedMinutes(30);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setErrorMessage('');
  }, [taskToEdit, defaultDueDate, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('অনুগ্রহ করে টাস্কের একটি শিরোনাম প্রদান করুন');
      return;
    }

    const finalCategory = (isCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : category) as Category;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: taskToEdit ? taskToEdit.status : 'todo',
      category: finalCategory,
      dueDate,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      subtasks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {taskToEdit ? 'টাস্ক সম্পাদনা করুন (Edit Task)' : 'নতুন টাস্ক তৈরি করুন (Create Task)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors active:scale-95 touch-manipulation"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              টাস্কের শিরোনাম (Task Title) *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: Q4 আর্কিটেকচার রোডম্যাপ প্রস্তুত করা বা ক্লায়েন্ট ফিডব্যাক রিভিউ"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              বিবরণ (Description)
            </label>
            <textarea
              rows={3}
              placeholder="কাজের বিস্তারিত বিবরণ, প্রয়োজনীয় লিংক, রেফারেন্স বা করণীয় বিষয়াদি..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Priority Selection: Low, Medium, High */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              অগ্রাধিকার (Priority: Low, Medium or High)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                  priority === 'low'
                    ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs ring-1 ring-slate-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                সাধারণ (Low)
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                  priority === 'medium'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                মাঝারি (Medium)
              </button>
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                  priority === 'high' || priority === 'urgent'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-2xs ring-1 ring-rose-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                উচ্চ (High)
              </button>
            </div>
          </div>

          {/* Category & Custom Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              ক্যাটাগরি (Category)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {standardCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setIsCustomCategory(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-semibold ${
                    !isCustomCategory && category === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomCategory(true)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-semibold ${
                  isCustomCategory
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                + কাস্টম ক্যাটাগরি
              </button>
            </div>

            {isCustomCategory && (
              <input
                type="text"
                placeholder="নতুন ক্যাটাগরির নাম লিখুন (যেমন: ফিন্যান্স, মার্কেটিং)..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 mt-1"
              />
            )}
          </div>

            {/* Due Date & Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                সমাপ্তির তারিখ (Due Date)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDueDate(getTodayStr())}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] text-indigo-700 rounded-md font-semibold transition-colors active:scale-95 touch-manipulation"
                >
                  আজ
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getOffsetDateStr(1))}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] text-indigo-700 rounded-md font-semibold transition-colors active:scale-95 touch-manipulation"
                >
                  আগামীকাল
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getOffsetDateStr(7))}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] text-indigo-700 rounded-md font-semibold transition-colors active:scale-95 touch-manipulation"
                >
                  ৭ দিন পর
                </button>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 shadow-2xs font-semibold"
              />

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(Math.max(5, parseInt(e.target.value) || 30))}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 tabular-nums font-semibold"
                    placeholder="মিনিট"
                  />
                </div>
                <span className="text-xs text-slate-500 shrink-0">মিনিট বরাদ্দ</span>
              </div>
            </div>
          </div>

          {/* Subtasks checklist */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              উপ-টাস্ক চেকলিস্ট (Subtasks: {subtasks.length}টি)
            </label>
            
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                  >
                    <span className="truncate">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors touch-manipulation"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="নতুন উপ-টাস্ক লিখুন (যেমন: কোড রিভিউ)..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs sm:text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 shrink-0 active:scale-95 touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-xl active:scale-95 touch-manipulation"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all whitespace-nowrap active:scale-95 touch-manipulation"
            >
              {taskToEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'টাস্ক তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
