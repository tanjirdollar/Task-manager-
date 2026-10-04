import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  CalendarDays, 
  Calendar as CalendarIcon, 
  Edit3, 
  Trash2, 
  AlignLeft, 
  CheckCircle2, 
  Circle,
  Tag
} from 'lucide-react';
import { useProductivity, getTodayStr, toBengaliNumber, formatBengaliDate } from '../../context/ProductivityContext';
import { CalendarEvent, EventType } from '../../types';

interface CalendarViewProps {
  onOpenNewEvent: (defaultDate?: string) => void;
  onOpenNewTask: (defaultDate?: string) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenNewEvent,
  onOpenNewTask,
  onEditEvent,
}) => {
  const { events, tasks, deleteEvent, toggleTaskStatus } = useProductivity();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayStr());
  const [viewFilter, setViewFilter] = useState<'all' | 'events_only'>('all');
  const [mobileTab, setMobileTab] = useState<'calendar' | 'schedule'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayJump = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayStr());
  };

  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Build 42 cells (6 weeks) calendar grid
  const calendarDays = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDateStr = formatDateString(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, dayNum);
    calendarDays.push({
      day: dayNum,
      dateStr: prevMonthDateStr,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = formatDateString(year, month, i);
    calendarDays.push({
      day: i,
      dateStr,
      isCurrentMonth: true,
    });
  }

  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDateStr = formatDateString(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, i);
    calendarDays.push({
      day: i,
      dateStr: nextMonthDateStr,
      isCurrentMonth: false,
    });
  }

  // Selected date events and tasks
  const selectedDateEvents = events
    .filter(e => e.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDateTasks = tasks
    .filter(t => t.dueDate === selectedDateStr);

  const selectedDateFormatted = formatBengaliDate(selectedDateStr);

  const getEventTypeBadge = (type: EventType) => {
    switch (type) {
      case 'meeting':
        return <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[11px] font-semibold">মিটিং</span>;
      case 'focus':
        return <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">ডিপ ফোকাস</span>;
      case 'workshop':
        return <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-semibold">কর্মশালা</span>;
      case 'deadline':
        return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[11px] font-semibold">ডেডলাইন</span>;
      case 'personal':
        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-semibold">ব্যক্তিগত</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-1 sm:pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            <span>ক্যালেন্ডার ও ইভেন্ট শিডিউলার</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            তারিখ নির্বাচন করুন, ইভেন্ট শিডিউল ও সম্পাদনা করুন এবং দৈনন্দিন প্রতিশ্রুতি পর্যবেক্ষণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <button
            onClick={handleTodayJump}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors active:scale-95 touch-manipulation"
          >
            আজ
          </button>

          {/* Month Stepper */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl shadow-2xs overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
              aria-label="পূর্ববর্তী মাস"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 sm:px-3 text-xs font-bold text-slate-800 min-w-[110px] sm:min-w-[130px] text-center font-mono">
              {monthNamesBn[month]} {toBengaliNumber(year)}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
              aria-label="পরবর্তী মাস"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Event Button for Selected Date */}
          <button
            onClick={() => onOpenNewEvent(selectedDateStr)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all whitespace-nowrap active:scale-95 touch-manipulation"
            title="নির্বাচিত তারিখে নতুন ইভেন্ট যোগ করুন"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ইভেন্ট</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher: Month Grid vs Selected Day Schedule */}
      <div className="lg:hidden flex items-center bg-slate-200/70 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileTab('calendar')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'calendar'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>মাসিক ক্যালেন্ডার</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('schedule')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'schedule'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>দিনের সূচি ({toBengaliNumber(selectedDateEvents.length)})</span>
        </button>
      </div>

      {/* 2. Main Grid: Calendar Month Grid (8 cols) + Selected Date Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Calendar View (8 cols) */}
        <div className={`lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 sm:p-5 flex flex-col justify-between ${
          mobileTab === 'schedule' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div>
            {/* Weekday headers in Bengali */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-1 border-b border-slate-100">
              <span className="text-rose-600">রবি</span>
              <span>সোম</span>
              <span>মঙ্গল</span>
              <span>বুধ</span>
              <span>বৃহস্পতি</span>
              <span>শুক্র</span>
              <span className="text-indigo-600">শনি</span>
            </div>

            {/* Monthly Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, index) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === getTodayStr();

                const dayEvents = events.filter(e => e.date === cell.dateStr);
                const dayTasks = tasks.filter(t => t.dueDate === cell.dateStr);

                return (
                    <div
                    key={index}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onDoubleClick={() => onOpenNewEvent(cell.dateStr)}
                    className={`min-h-[48px] sm:min-h-[96px] p-1 sm:p-2 rounded-lg sm:rounded-xl text-left transition-all flex flex-col justify-between border cursor-pointer group active:scale-95 sm:active:scale-100 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/30 shadow-xs'
                        : isToday
                        ? 'border-indigo-300 bg-indigo-50/20'
                        : cell.isCurrentMonth
                        ? 'border-slate-200/90 hover:border-slate-400 bg-white hover:bg-slate-50/60'
                        : 'border-slate-100 bg-slate-50/40 opacity-60'
                    }`}
                    title={`${cell.dateStr}: ডাবল-ক্লিক করে নতুন ইভেন্ট যোগ করুন`}
                  >
                    {/* Date Number & Event count */}
                    <div className="flex items-center justify-between w-full mb-0.5 sm:mb-1">
                      <span
                        className={`text-[11px] sm:text-xs font-mono font-bold leading-none ${
                          isToday
                            ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] sm:text-[10px]'
                            : isSelected
                            ? 'text-indigo-900 font-extrabold'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {toBengaliNumber(cell.day)}
                      </span>

                      {/* Quick Add icon on hover (desktop only) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(cell.dateStr);
                          onOpenNewEvent(cell.dateStr);
                        }}
                        className="hidden sm:block opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 p-0.5 rounded transition-opacity"
                        title="এই তারিখে ইভেন্ট যোগ করুন"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Mobile Dot Indicators */}
                    <div className="flex items-center gap-1 justify-center sm:hidden pb-1">
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" title={`${toBengaliNumber(dayEvents.length)}টি ইভেন্ট`} />
                      )}
                      {dayTasks.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title={`${toBengaliNumber(dayTasks.length)}টি টাস্ক`} />
                      )}
                    </div>

                    {/* Display Scheduled Events in Cell (Desktop) */}
                    <div className="space-y-1 w-full overflow-hidden flex-1 hidden sm:block">
                      {dayEvents.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                            if (onEditEvent) onEditEvent(e);
                          }}
                          className="text-[10px] truncate px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-bold hover:bg-sky-100 transition-colors flex items-center gap-1"
                          title={`${e.startTime}: ${e.title} (সম্পাদনা করতে ক্লিক করুন)`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span className="truncate">{e.startTime} {e.title}</span>
                        </div>
                      ))}

                      {/* Display Tasks in Cell */}
                      {dayTasks.slice(0, 1).map(t => (
                        <div
                          key={t.id}
                          className={`text-[10px] truncate px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            t.status === 'completed'
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : 'bg-amber-50 text-amber-900 font-semibold'
                          }`}
                          title={`টাস্ক: ${t.title}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}

                      {/* More items indicator */}
                      {(dayEvents.length + dayTasks.length > 3) && (
                        <div className="text-[9px] text-slate-500 font-bold pl-1">
                          +আরও {toBengaliNumber(dayEvents.length + dayTasks.length - 3)}টি
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom helper tip */}
          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="hidden sm:inline">ক্যালেন্ডারের যেকোনো দিনে ক্লিক করে বিস্তারিত দেখুন বা ডাবল-ক্লিক করে ইভেন্ট যোগ করুন</span>
              <span className="sm:hidden">দিন নির্বাচন করুন</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> ইভেন্ট
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> টাস্ক
                </span>
              </div>
            </div>

            {/* Mobile quick jump to schedule button */}
            <button
              type="button"
              onClick={() => setMobileTab('schedule')}
              className="lg:hidden w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 touch-manipulation active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>নির্বাচিত তারিখের সূচি দেখুন ({selectedDateFormatted}) →</span>
            </button>
          </div>
        </div>

        {/* 3. Selected Date Inspector / Event Manager (4 cols) */}
        <div className={`lg:col-span-4 space-y-4 ${mobileTab === 'calendar' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
            {/* Inspector Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  নির্বাচিত তারিখের শিডিউল
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {selectedDateFormatted}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedDateStr}
                </div>
              </div>

              {/* Quick Action buttons for the selected date */}
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenNewEvent(selectedDateStr)}
                  className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs active:scale-95 touch-manipulation"
                  title="এই তারিখে নতুন ইভেন্ট যোগ করুন"
                >
                  <Plus className="w-3 h-3" />
                  <span>ইভেন্ট</span>
                </button>
                <button
                  onClick={() => onOpenNewTask(selectedDateStr)}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95 touch-manipulation"
                  title="এই তারিখে নতুন টাস্ক যোগ করুন"
                >
                  + টাস্ক
                </button>
              </div>
            </div>

            {/* Events on Selected Date with Title, Date, Time, Description, Edit, Delete */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <span>ইভেন্ট ও মিটিং ({toBengaliNumber(selectedDateEvents.length)}টি)</span>
                </span>
              </div>

              {selectedDateEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-600">এই তারিখে কোনো ইভেন্ট নির্ধারিত নেই</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">উপরে "+ ইভেন্ট" বাটনে ক্লিক করে শিডিউল করুন</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(evt => (
                    <div
                      key={evt.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs space-y-2 group"
                    >
                      {/* Event Header: Time & Type & Edit/Delete actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs font-bold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.startTime} - {evt.endTime}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {getEventTypeBadge(evt.type)}

                          {/* Edit Event Button */}
                          {onEditEvent && (
                            <button
                              onClick={() => onEditEvent(evt)}
                              className="min-w-[34px] min-h-[34px] flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors active:scale-95 touch-manipulation"
                              title="ইভেন্ট সম্পাদনা করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Event Button */}
                          <button
                            onClick={() => deleteEvent(evt.id)}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95 touch-manipulation"
                            title="ইভেন্ট মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {evt.title}
                      </h3>

                      {/* Event Description (Required: Show event title, date, time and description) */}
                      {evt.description ? (
                        <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
                          {evt.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          কোনো অতিরিক্ত বিবরণ নেই
                        </p>
                      )}

                      {/* Event Location if present */}
                      {evt.location && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/50 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Due on Selected Date */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>এই তারিখে নির্ধারিত টাস্ক ({toBengaliNumber(selectedDateTasks.length)}টি)</span>
                </span>
              </div>

              {selectedDateTasks.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  এই তারিখে সমাপ্তির কোনো টাস্ক নেই।
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateTasks.map(task => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs transition-colors hover:border-slate-300"
                      >
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          title={isDone ? 'অসম্পূর্ণ করুন' : 'সম্পন্ন করুন'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {task.category} · {task.priority === 'urgent' ? 'জরুরি' : task.priority === 'high' ? 'উচ্চ' : task.priority === 'low' ? 'সাধারণ' : 'মাঝারি'} অগ্রাধিকার
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
