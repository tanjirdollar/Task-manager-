import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  PinOff, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Heading2, 
  List as ListIcon, 
  CheckSquare, 
  Code, 
  LayoutGrid, 
  List, 
  Columns, 
  Tag as TagIcon, 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  ArrowUpDown,
  Filter,
  ChevronLeft
} from 'lucide-react';
import { useProductivity, toBengaliNumber } from '../../context/ProductivityContext';
import { Note } from '../../types';
import { NoteModal } from '../modals/NoteModal';

interface NotesViewProps {
  onOpenNewNote?: () => void;
}

type ViewMode = 'cards' | 'list' | 'split';
type SortOrder = 'updated_desc' | 'pinned_first' | 'title_asc';

export const NotesView: React.FC<NotesViewProps> = () => {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, searchQuery, setSearchQuery } = useProductivity();

  // Local state
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortOrder, setSortOrder] = useState<SortOrder>('pinned_first');
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileSplitView, setMobileSplitView] = useState<'list' | 'editor'>('list');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Inline tag input in split editor
  const [inlineTagInput, setInlineTagInput] = useState('');

  const categories = [
    { id: 'all', label: 'সব নোট' },
    { id: 'স্ট্র্যাটেজি', label: 'স্ট্র্যাটেজি' },
    { id: 'কাজ', label: 'কাজ / প্রজেক্ট' },
    { id: 'আইডিয়া', label: 'আইডিয়া' },
    { id: 'মিটিং', label: 'মিটিং নোট' },
    { id: 'ব্যক্তিগত', label: 'ব্যক্তিগত' },
  ];

  // Extract all unique tags across notes
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => {
      n.tags?.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [notes]);

  // Combined search query from local or global
  const activeSearch = localSearch.trim() || searchQuery.trim();

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // Category filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;

      // Tag filter
      if (selectedTag && (!n.tags || !n.tags.includes(selectedTag))) return false;

      // Search query (title, content, tags)
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTags = n.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'pinned_first') {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOrder === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOrder === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [notes, selectedCategory, selectedTag, activeSearch, sortOrder]);

  const activeNote = notes.find(n => n.id === activeNoteId) || filteredNotes[0] || null;

  // Handlers
  const handleOpenCreateModal = () => {
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  const handleSaveModalNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (noteToEdit) {
      updateNote(noteToEdit.id, noteData);
      setActiveNoteId(noteToEdit.id);
    } else {
      const created = addNote(noteData);
      setActiveNoteId(created.id);
    }
  };

  const handleDeleteConfirm = (id: string) => {
    deleteNote(id);
    setDeleteCandidateId(null);
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveNoteId(remaining[0]?.id || '');
    }
  };

  const handleCopyNote = (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertSnippet = (prefix: string, suffix = '') => {
    if (!activeNote) return;
    const current = activeNote.content || '';
    updateNote(activeNote.id, { content: `${current}\n${prefix} ${suffix}`.trim() });
  };

  // Inline Tag actions in split editor
  const handleAddInlineTag = (rawTag?: string) => {
    if (!activeNote) return;
    const val = (rawTag !== undefined ? rawTag : inlineTagInput).trim().replace(/^#/, '');
    if (!val) return;
    const existing = activeNote.tags || [];
    if (!existing.includes(val)) {
      updateNote(activeNote.id, { tags: [...existing, val] });
    }
    setInlineTagInput('');
  };

  const handleRemoveInlineTag = (tagToRemove: string) => {
    if (!activeNote) return;
    const existing = activeNote.tags || [];
    updateNote(activeNote.id, { tags: existing.filter(t => t !== tagToRemove) });
  };

  const wordCount = activeNote?.content ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;

  const formatDateBn = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('bn-BD', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              <span>নোটসমূহ ও নথিপত্র</span>
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold font-mono bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {toBengaliNumber(notes.length)}টি
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            গুরুত্বপূর্ণ ভাবনা, মিটিং ডিসিশন, স্পেক এবং ডকুমেন্টস গুছিয়ে রাখুন ও ট্যাগ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* View Mode Switcher: Cards, List, Split Studio */}
          <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation ${
                viewMode === 'cards'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="কার্ড গ্রিড ভিউ (Card Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">কার্ড</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="লিস্ট ভিউ (List Layout)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লিস্ট</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 touch-manipulation ${
                viewMode === 'split'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="স্প্লিট এডিটর ভিউ (Studio Editor)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">স্প্লিট</span>
            </button>
          </div>

          {/* New Note Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all active:scale-95 touch-manipulation whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন নোট</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder="নোটের শিরোনাম, বিবরণ বা ট্যাগ দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="pinned_first">পিন করা প্রথমে (Pinned First)</option>
              <option value="updated_desc">সর্বশেষ সম্পাদিত (Recent)</option>
              <option value="title_asc">শিরোনাম অনুযায়ী (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map(cat => {
            const count = cat.id === 'all' 
              ? notes.length 
              : notes.filter(n => n.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {toBengaliNumber(count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tags Bar Filter */}
        {allUniqueTags.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
              <TagIcon className="w-3 h-3 text-slate-400" />
              <span>ট্যাগ ফিল্টার:</span>
            </span>

            {allUniqueTags.map(tag => {
              const isTagActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isTagActive ? null : tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    isTagActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <span>#{tag}</span>
                  {isTagActive && <X className="w-3 h-3" />}
                </button>
              );
            })}

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline ml-1"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Empty Search / Filter State */}
      {filteredNotes.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">কোনো নোট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeSearch || selectedCategory !== 'all' || selectedTag
              ? 'আপনার বর্তমান ফিল্টারের সাথে মিলে এমন কোনো নোট পাওয়া যায়নি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।'
              : 'এখনো কোনো নোট সংরক্ষণ করেননি। আপনার প্রথম নোটটি লিখুন!'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(activeSearch || selectedCategory !== 'all' || selectedTag) && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors touch-manipulation active:scale-95"
              >
                সব ফিল্টার মুছুন
              </button>
            )}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন নোট তৈরি করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Display Saved Notes in Chosen Layout */}
      {filteredNotes.length > 0 && (
        <>
          {/* LAYOUT A: CARD GRID VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const isCopied = copiedId === note.id;
                const noteWordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenEditModal(note)}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div>
                      {/* Top Bar: Category & Pin / Action */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-md">
                          {note.category}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              togglePinNote(note.id);
                            }}
                            className={`p-1 rounded-lg transition-colors ${
                              note.pinned
                                ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={note.pinned ? 'আনপিন করুন' : 'উপরে পিন করুন'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-indigo-600' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={e => handleCopyNote(note, e)}
                            className="p-1 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="লেখা কপি করুন"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {note.title || 'শিরোনামহীন নোট'}
                      </h3>

                      {/* Content Snippet */}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-4 leading-relaxed font-normal">
                        {note.content ? note.content.replace(/[#*`_-]/g, '') : 'কোনো বিবরণ নেই...'}
                      </p>

                      {/* Optional Tags list */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-3.5">
                          {note.tags.map(t => (
                            <span
                              key={t}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedTag(t);
                              }}
                              className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer with timestamp and quick edit/delete buttons */}
                    <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono tabular-nums">{formatDateBn(note.updatedAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{toBengaliNumber(noteWordCount)} শব্দ</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenEditModal(note);
                          }}
                          className="min-h-[36px] min-w-[36px] p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteCandidateId(note.id);
                          }}
                          className="min-h-[36px] min-w-[36px] p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
                          title="নোটটি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LAYOUT B: CLEAN LIST VIEW */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredNotes.map(note => {
                  const isCopied = copiedId === note.id;
                  const noteWordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

                  return (
                    <div
                      key={note.id}
                      onClick={() => handleOpenEditModal(note)}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              togglePinNote(note.id);
                            }}
                            className={`p-1 rounded-md transition-colors ${
                              note.pinned ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-600'
                            }`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-indigo-600' : ''}`} />
                          </button>

                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                            {note.title || 'শিরোনামহীন নোট'}
                          </h3>

                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {note.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 pl-6">
                          {note.content ? note.content.replace(/[#*`_-]/g, '') : 'কোনো বিবরণ নেই...'}
                        </p>

                        {/* Optional tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2 pl-6">
                            {note.tags.map(t => (
                              <span
                                key={t}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedTag(t);
                                }}
                                className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded hover:bg-indigo-100"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs text-slate-400">
                        <div className="text-right">
                          <span className="font-mono tabular-nums text-slate-600 font-medium">
                            {formatDateBn(note.updatedAt)}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {toBengaliNumber(noteWordCount)} শব্দ
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => handleCopyNote(note, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="কপি করুন"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenEditModal(note);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteCandidateId(note.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LAYOUT C: SPLIT STUDIO VIEW (Left master list + right live markdown editor) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-16rem)] min-h-[500px] sm:min-h-[550px]">
              {/* Left Pane: Notes Master List (4 cols) */}
              <div className={`md:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex-col overflow-hidden ${
                mobileSplitView === 'list' ? 'flex' : 'hidden md:flex'
              }`}>
                <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>নোট তালিকা ({toBengaliNumber(filteredNotes.length)})</span>
                  <button
                    onClick={handleOpenCreateModal}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold p-1 rounded-lg hover:bg-indigo-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotes.map(n => {
                    const isSelected = activeNote?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setActiveNoteId(n.id);
                          setMobileSplitView('editor');
                        }}
                        className={`p-3.5 cursor-pointer transition-colors text-left relative ${
                          isSelected
                            ? 'bg-slate-100/90 text-slate-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold truncate flex-1">
                            {n.title || 'শিরোনামহীন নোট'}
                          </h4>
                          {n.pinned && (
                            <Pin className="w-3 h-3 text-indigo-600 shrink-0 fill-indigo-600" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-normal">
                          {n.content ? n.content.replace(/[#*`_-]/g, '') : 'খালি নোট...'}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600">{n.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{formatDateBn(n.updatedAt)}</span>
                          {n.tags && n.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-600 font-mono">#{n.tags[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Live Editor (8 cols) */}
              <div className={`md:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex-col overflow-hidden ${
                mobileSplitView === 'editor' ? 'flex' : 'hidden md:flex'
              }`}>
                {activeNote ? (
                  <>
                    {/* Note Editor Header */}
                    <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {/* Mobile back to list button */}
                          <button
                            type="button"
                            onClick={() => setMobileSplitView('list')}
                            className="md:hidden flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg shrink-0 touch-manipulation active:scale-95"
                            title="তালিকায় ফিরে যান"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>তালিকা</span>
                          </button>
                          <input
                            type="text"
                            value={activeNote.title}
                            onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                            placeholder="নোটের শিরোনাম লিখুন..."
                            className="w-full text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden placeholder:text-slate-400 truncate"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                          <select
                            value={activeNote.category}
                            onChange={e => updateNote(activeNote.id, { category: e.target.value })}
                            className="bg-transparent border-none text-slate-700 font-bold p-0 focus:ring-0 cursor-pointer text-xs"
                          >
                            <option value="স্ট্র্যাটেজি">স্ট্র্যাটেজি</option>
                            <option value="কাজ">কাজ / প্রজেক্ট</option>
                            <option value="আইডিয়া">আইডিয়া</option>
                            <option value="মিটিং">মিটিং নোট</option>
                            <option value="ব্যক্তিগত">ব্যক্তিগত</option>
                          </select>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            সর্বশেষ সম্পাদন: {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{toBengaliNumber(wordCount)} শব্দ</span>
                        </div>
                      </div>

                      {/* Editor Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePinNote(activeNote.id)}
                          className={`p-2 rounded-xl transition-colors ${
                            activeNote.pinned 
                              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={activeNote.pinned ? 'আনপিন করুন' : 'উপরে পিন করুন'}
                        >
                          <Pin className={`w-4 h-4 ${activeNote.pinned ? 'fill-indigo-600' : ''}`} />
                        </button>

                        <button
                          onClick={e => handleCopyNote(activeNote, e)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="নোটের লেখা কপি করুন"
                        >
                          {copiedId === activeNote.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => setDeleteCandidateId(activeNote.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="নোটটি মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tags Bar inside Split Editor */}
                    <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                      <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {activeNote.tags && activeNote.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {activeNote.tags.map(t => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md"
                            >
                              <span>#{t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInlineTag(t)}
                                className="hover:text-indigo-900"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={inlineTagInput}
                          onChange={e => setInlineTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              handleAddInlineTag();
                            }
                          }}
                          placeholder="+ নতুন ট্যাগ..."
                          className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-24"
                        />
                        {inlineTagInput && (
                          <button
                            type="button"
                            onClick={() => handleAddInlineTag()}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            যোগ
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatting Toolbar */}
                    <div className="px-4 py-1.5 bg-white border-b border-slate-100 flex items-center gap-1 text-slate-600 text-xs">
                      <button
                        type="button"
                        onClick={() => insertSnippet('##')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="হেডিং ২"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                        <span>হেডিং</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('-')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="বুলেট তালিকা"
                      >
                        <ListIcon className="w-3.5 h-3.5" />
                        <span>বুলেট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('- [ ]')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="চেকলিস্ট আইটেম"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>চেকলিস্ট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('```\n\n```')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="কোড ব্লক"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>কোড</span>
                      </button>
                    </div>

                    {/* Note Content Textarea */}
                    <textarea
                      value={activeNote.content}
                      onChange={e => updateNote(activeNote.id, { content: e.target.value })}
                      placeholder="এখানে আপনার নোট বা বিস্তারিত ভাবনা লিখুন..."
                      className="w-full flex-1 p-5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none font-sans leading-relaxed"
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <FileText className="w-10 h-10 mb-2 stroke-1" />
                    <p className="text-sm font-semibold">একটি নোট নির্বাচন করুন বা নতুন নোট তৈরি করুন</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Create / Edit Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNoteToEdit(null);
        }}
        onSave={handleSaveModalNote}
        noteToEdit={noteToEdit}
        defaultCategory={selectedCategory === 'all' ? 'আইডিয়া' : selectedCategory}
      />

      {/* 6. Delete Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">নোটটি মুছে ফেলতে চান?</h3>
                <p className="text-xs text-slate-500 mt-0.5">এই অ্যাকশনটি ফিরিয়ে আনা যাবে না।</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(deleteCandidateId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
