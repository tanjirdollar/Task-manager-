import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Pin, 
  Heading2, 
  List as ListIcon, 
  CheckSquare, 
  Code, 
  FileText,
  Plus
} from 'lucide-react';
import { Note } from '../../types';
import { toBengaliNumber } from '../../context/ProductivityContext';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  noteToEdit?: Note | null;
  defaultCategory?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  noteToEdit,
  defaultCategory = 'আইডিয়া',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('আইডিয়া');
  const [pinned, setPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const suggestedTags = ['আইডিয়া', 'স্প্রিন্ট', 'প্ল্যানিং', 'আর্কিটেকচার', 'ক্লায়েন্ট', 'জরুরি'];

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category || 'আইডিয়া');
      setPinned(noteToEdit.pinned || false);
      setTags(noteToEdit.tags || []);
    } else {
      setTitle('');
      setContent('');
      setCategory(defaultCategory);
      setPinned(false);
      setTags([]);
    }
    setTagInput('');
  }, [noteToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (rawTag?: string) => {
    const val = (rawTag !== undefined ? rawTag : tagInput).trim().replace(/^#/, '');
    if (!val) return;
    if (!tags.includes(val)) {
      setTags(prev => [...prev, val]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const insertSnippet = (prefix: string, suffix = '') => {
    setContent(prev => `${prev ? prev + '\n' : ''}${prefix} ${suffix}`.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || 'শিরোনামহীন নোট',
      content: content.trim(),
      category,
      pinned,
      tags,
    });
    onClose();
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="note-modal-title" className="text-base font-bold text-slate-900">
                {noteToEdit ? 'নোট সম্পাদনা করুন (Edit Note)' : 'নতুন নোট তৈরি করুন (Create Note)'}
              </h2>
              <p className="text-xs text-slate-500">
                আপনার ভাবনা, মিটিং সারাংশ বা প্রজেক্ট ডকুমেন্টস সংরক্ষণ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              নোটের শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="যেমন: Q4 প্রোডাক্ট রোডম্যাপ ও টেকনিক্যাল স্পেক..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              autoFocus
            />
          </div>

          {/* Category & Pin Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="স্ট্র্যাটেজি">স্ট্র্যাটেজি (Strategy)</option>
                <option value="কাজ">কাজ / প্রজেক্ট (Work)</option>
                <option value="আইডিয়া">আইডিয়া (Idea)</option>
                <option value="মিটিং">মিটিং নোট (Meeting)</option>
                <option value="ব্যক্তিগত">ব্যক্তিগত (Personal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                পিন অপশন
              </label>
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-between transition-all ${
                  pinned 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-indigo-600' : ''}`} />
                  <span>উপরে পিন করে রাখুন</span>
                </span>
                <span className="text-[11px] font-semibold">{pinned ? 'পিন সক্রিয়' : 'সাধারণ'}</span>
              </button>
            </div>
          </div>

          {/* Optional Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ঐচ্ছিক ট্যাগ (Tags)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="ট্যাগ লিখে Enter চাপুন (যেমন: স্প্রিন্ট, ব্যাকলগ)"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                disabled={!tagInput.trim()}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors shrink-0"
              >
                ট্যাগ যোগ
              </button>
            </div>

            {/* Rendered tag chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-indigo-900 hover:bg-indigo-100/80 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick suggested tags */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
              <span className="font-semibold text-slate-400">পরামর্শ:</span>
              {suggestedTags
                .filter(st => !tags.includes(st))
                .slice(0, 4)
                .map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleAddTag(st)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    + #{st}
                  </button>
                ))}
            </div>
          </div>

          {/* Note Content Textarea with Markdown Helper Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                নোটের বিবরণ (Content)
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{toBengaliNumber(wordCount)} শব্দ</span>
                <span aria-hidden="true">·</span>
                <span>{toBengaliNumber(content.length)} অক্ষর</span>
              </div>
            </div>

            {/* Snippet Toolbar */}
            <div className="px-3 py-1.5 bg-slate-100/80 border border-b-0 border-slate-200 rounded-t-xl flex items-center gap-1 text-slate-600 text-xs">
              <button
                type="button"
                onClick={() => insertSnippet('##')}
                className="p-1 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="হেডিং"
              >
                <Heading2 className="w-3.5 h-3.5" />
                <span>হেডিং</span>
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('-')}
                className="p-1 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="বুলেট লিস্ট"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>বুলেট</span>
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('- [ ]')}
                className="p-1 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="চেকলিস্ট"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>চেকলিস্ট</span>
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('```\n\n```')}
                className="p-1 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="কোড ব্লক"
              >
                <Code className="w-3.5 h-3.5" />
                <span>কোড</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="এখানে আপনার সম্পূর্ণ নোট, মিটিং ফলাফল, আর্কিটেকচার ড্রাফট বা কর্মপরিকল্পনা বিস্তারিতভাবে লিখুন..."
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-b-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-sans leading-relaxed transition-all shadow-2xs"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{noteToEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'নোট তৈরি করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
