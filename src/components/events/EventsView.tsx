import React, { useState } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  CalendarDays 
} from 'lucide-react';
import { useProductivity, getTodayStr, toBengaliNumber } from '../../context/ProductivityContext';
import { CalendarEvent, EventType } from '../../types';

interface EventsViewProps {
  onOpenNewEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onOpenNewEvent, onEditEvent }) => {
  const { events, deleteEvent, searchQuery } = useProductivity();
  const [filterType, setFilterType] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');

  const todayStr = getTodayStr();

  const hasTimeConflict = (evt: CalendarEvent): boolean => {
    return events.some(other => {
      if (other.id === evt.id) return false;
      if (other.date !== evt.date) return false;
      return evt.startTime < other.endTime && evt.endTime > other.startTime;
    });
  };

  const filteredEvents = events.filter(evt => {
    if (filterType !== 'all' && evt.type !== filterType) return false;

    if (timeFilter === 'upcoming' && evt.date < todayStr) return false;
    if (timeFilter === 'past' && evt.date >= todayStr) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchDesc = evt.description?.toLowerCase().includes(q);
      const matchLoc = evt.location?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc;
    }
    return true;
  }).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  const eventTypes = [
    { id: 'all', label: 'সব ধরন' },
    { id: 'meeting', label: 'মিটিং' },
    { id: 'focus', label: 'ডিপ ফোকাস' },
    { id: 'workshop', label: 'কর্মশালা' },
    { id: 'deadline', label: 'ডেডলাইন' },
    { id: 'personal', label: 'ব্যক্তিগত' },
  ];

  const getTypeName = (type: EventType) => {
    switch (type) {
      case 'meeting': return 'মিটিং';
      case 'focus': return 'ডিপ ফোকাস';
      case 'workshop': return 'কর্মশালা';
      case 'deadline': return 'ডেডলাইন';
      case 'personal': return 'ব্যক্তিগত';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-1 sm:pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            <span>ইভেন্ট ও মিটিং সূচি</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            মিটিং, ওয়ার্কশপ এবং সংরক্ষিত ডিপ-ফোকাস সময়ের শিডিউল পরিচালনা।
          </p>
        </div>

        <button
          onClick={onOpenNewEvent}
          className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all whitespace-nowrap self-start sm:self-auto touch-manipulation active:scale-95 min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>ইভেন্ট শিডিউল করুন</span>
        </button>
      </div>

      {/* Filter and timeframe controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        {/* Timeframe filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTimeFilter('upcoming')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors touch-manipulation ${
              timeFilter === 'upcoming'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            আসন্ন
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors touch-manipulation ${
              timeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সব ইভেন্ট
          </button>
          <button
            onClick={() => setTimeFilter('past')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors touch-manipulation ${
              timeFilter === 'past'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            অতীত
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium mr-1 hidden sm:inline">ধরন:</span>
          {eventTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap touch-manipulation ${
                filterType === t.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">কোনো ইভেন্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-1">নতুন একটি ইভেন্ট যুক্ত করুন অথবা ফিল্টার পরিবর্তন করুন</p>
            <button
              onClick={onOpenNewEvent}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ইভেন্ট শিডিউল করুন
            </button>
          </div>
        ) : (
          filteredEvents.map(evt => {
            const conflict = hasTimeConflict(evt);
            const isToday = evt.date === todayStr;

            return (
              <div
                key={evt.id}
                className={`p-4 bg-white rounded-xl border transition-all shadow-2xs ${
                  conflict
                    ? 'border-amber-300 ring-1 ring-amber-300/50'
                    : isToday
                    ? 'border-indigo-200 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Date Block */}
                    <div className="px-3 py-2 bg-slate-100 rounded-lg text-center shrink-0 min-w-[64px]">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        {new Date(evt.date + 'T00:00:00').toLocaleDateString('bn-BD', { month: 'short' })}
                      </div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums leading-none mt-0.5">
                        {toBengaliNumber(new Date(evt.date + 'T00:00:00').getDate())}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {evt.title}
                        </h3>

                        {conflict && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            সময়ের ওভারল্যাপ রয়েছে
                          </span>
                        )}
                      </div>

                      {evt.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {evt.description}
                        </p>
                      )}

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono tabular-nums font-bold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {evt.startTime} - {evt.endTime}
                        </span>

                        <span aria-hidden="true">·</span>

                        <span className="font-semibold text-slate-600">
                          {getTypeName(evt.type)}
                        </span>

                        {evt.location && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-slate-600 truncate max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.location}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-start shrink-0">
                    <button
                      onClick={() => onEditEvent(evt)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors touch-manipulation active:scale-95"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors touch-manipulation active:scale-95"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
