import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlignLeft, Tag, AlertCircle } from 'lucide-react';
import { CalendarEvent, EventType } from '../../types';
import { getTodayStr } from '../../context/ProductivityContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<CalendarEvent, 'id'>, syncToGoogle?: boolean) => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayStr());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<EventType>('meeting');
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setLocation(eventToEdit.location || '');
      setType(eventToEdit.type);
      setSyncToGoogle(!!eventToEdit.googleEventId || !!eventToEdit.isGoogleEvent);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || getTodayStr());
      setStartTime('10:00');
      setEndTime('11:00');
      setLocation('');
      setType('meeting');
      setSyncToGoogle(false);
    }
  }, [eventToEdit, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('অনুগ্রহ করে ইভেন্টের একটি শিরোনাম প্রদান করুন');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime,
      endTime,
      location: location.trim() || undefined,
      type,
    }, syncToGoogle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {eventToEdit ? 'ইভেন্ট সম্পাদনা করুন' : 'নতুন ইভেন্ট শিডিউল করুন'}
          </h2>
          <button
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 touch-manipulation"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              ইভেন্টের শিরোনাম *
            </label>
            <input
              type="text"
              placeholder="যেমন: স্প্রিন্ট আর্কিটেকচার সিঙ্ক বা ক্লায়েন্ট ডেমো"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                তারিখ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                ইভেন্টের ধরন
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as EventType)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
              >
                <option value="meeting">মিটিং</option>
                <option value="focus">ডিপ ফোকাস ব্লক</option>
                <option value="workshop">ওয়ার্কশপ / রিভিউ</option>
                <option value="deadline">মাইলস্টোন / ডেডলাইন</option>
                <option value="personal">ব্যক্তিগত প্রতিশ্রুতি</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                শুরুর সময়
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                শেষের সময়
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              স্থান বা ভিডিও মিটিং লিংক (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: রুম ৩০২ অথবা https://meet.google.com/xyz"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              এজেন্ডা বা বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              placeholder="মিটিংয়ের মূল আলোচ্য বিষয় বা প্রস্তুতি..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          {/* Google Calendar Sync Checkbox */}
          <label className="flex items-center gap-2.5 p-3 bg-sky-50/70 border border-sky-200 rounded-xl cursor-pointer hover:bg-sky-50 transition-colors">
            <input
              type="checkbox"
              checked={syncToGoogle}
              onChange={e => setSyncToGoogle(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                গুগল ক্যালেন্ডারের সাথে সিঙ্ক করুন (Google Calendar Sync)
              </span>
              <span className="text-[11px] text-sky-700">
                ইভেন্টটি স্বয়ংক্রিয়ভাবে আপনার প্রাইমারি Google Calendar-এ যোগ হবে।
              </span>
            </div>
          </label>

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
              {eventToEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'ইভেন্ট শিডিউল করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
