import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  Flame, 
  Headphones, 
  Check, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  BellRing
} from 'lucide-react';
import { useProductivity, getTodayStr, toBengaliNumber } from '../../context/ProductivityContext';
import { FocusMode } from '../../types';
import { soundManager } from '../../utils/audio';

export const FocusTimerView: React.FC = () => {
  const { 
    tasks, 
    activeFocusTaskId, 
    setActiveFocusTaskId, 
    logFocusSession, 
    todayFocusMinutes,
    focusSessions,
    toggleTaskStatus
  } = useProductivity();

  // Presets: 'pomodoro' (25m), 'deep_50' (50m), 'custom'
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Ambient sound state
  const [ambientType, setAmbientType] = useState<'none' | 'rain' | 'whitenoise' | 'binaural'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState(false);
  const [lastLoggedSessionDuration, setLastLoggedSessionDuration] = useState<number>(25);

  const initialTimeMap: Record<FocusMode, number> = {
    pomodoro: 25 * 60,
    deep_50: 50 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
    custom: customMinutes * 60,
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch modes: 25m, 50m, Custom, Breaks
  const handleModeChange = (newMode: FocusMode) => {
    setIsRunning(false);
    setIsPaused(false);
    setMode(newMode);
    if (newMode === 'custom') {
      setTimeLeft(customMinutes * 60);
    } else {
      setTimeLeft(initialTimeMap[newMode]);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    soundManager.playChime();

    // Log focus minutes for 25m, 50m or custom sessions
    let completedMinutes = 25;
    if (mode === 'pomodoro') completedMinutes = 25;
    else if (mode === 'deep_50') completedMinutes = 50;
    else if (mode === 'custom') completedMinutes = customMinutes;

    setLastLoggedSessionDuration(completedMinutes);
    logFocusSession(completedMinutes, activeFocusTaskId || undefined);

    setSessionCompletedNotice(true);

    // Switch automatically to a refreshing short break after deep work
    if (mode === 'pomodoro' || mode === 'deep_50') {
      setMode('short_break');
      setTimeLeft(5 * 60);
    } else {
      setMode('pomodoro');
      setTimeLeft(25 * 60);
    }
  };

  // Start Button (starts from beginning)
  const handleStart = () => {
    if (ambientType !== 'none') {
      soundManager.startAmbient(ambientType, ambientVolume);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  // Pause Button (pauses mid-way)
  const handlePause = () => {
    soundManager.stopAmbient();
    setIsRunning(false);
    setIsPaused(true);
  };

  // Resume Button (continues countdown when paused)
  const handleResume = () => {
    if (ambientType !== 'none') {
      soundManager.startAmbient(ambientType, ambientVolume);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  // Reset Button (returns timer to current mode's preset time)
  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    soundManager.stopAmbient();
    setTimeLeft(mode === 'custom' ? customMinutes * 60 : initialTimeMap[mode]);
  };

  const handleAmbientChange = (type: 'none' | 'rain' | 'whitenoise' | 'binaural') => {
    setAmbientType(type);
    if (type === 'none') {
      soundManager.stopAmbient();
    } else if (isRunning) {
      soundManager.startAmbient(type, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundManager.setAmbientVolume(vol);
  };

  useEffect(() => {
    return () => {
      soundManager.stopAmbient();
    };
  }, []);

  // Format MM:SS for countdown display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${toBengaliNumber(String(minutes).padStart(2, '0'))}:${toBengaliNumber(String(seconds).padStart(2, '0'))}`;

  const totalDuration = mode === 'custom' ? customMinutes * 60 : initialTimeMap[mode];
  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  const activeTask = tasks.find(t => t.id === activeFocusTaskId);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  const todayStr = getTodayStr();
  const todaySessions = focusSessions.filter(s => s.date === todayStr);

  return (
    <div className={`space-y-6 transition-all duration-300 ${zenMode ? 'fixed inset-0 z-50 bg-slate-900 text-white p-6 sm:p-12 overflow-y-auto flex flex-col items-center justify-center' : 'max-w-4xl mx-auto'}`}>
      {/* Zen Mode Header / Regular Header */}
      {!zenMode ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              <span>ফোকাস টাইমার (Focus Timer)</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              ২৫ মিনিট বা ৫০ মিনিটের ফোকাস সেশন নির্বাচন করুন এবং বিঘ্নহীনভাবে কাজ সম্পন্ন করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Zen Mode Toggle Button */}
            <button
              onClick={() => setZenMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
              title="সম্পূর্ণ মনোযোগের জন্য ফুলস্ক্রিন জেন মোড চালু করুন"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>জেন মোড</span>
            </button>

            {/* Daily stats badges */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-800">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-mono tabular-nums">{toBengaliNumber(todayFocusMinutes)} মিনিট</span>
            </div>

            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-800">
              <span className="font-mono tabular-nums">{toBengaliNumber(todaySessions.length)}টি</span>
              <span className="text-slate-500 font-normal"> সেশন</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>জেন ফোকাস মোড (Zen Focus Mode)</span>
          </div>
          <button
            onClick={() => setZenMode(false)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>স্বাভাবিক ভিউ</span>
          </button>
        </div>
      )}

      {/* Completion Notification & Visual Indication Modal / Banner */}
      {sessionCompletedNotice && (
        <div className="w-full max-w-md p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">অভিনন্দন তানজির! ফোকাস সেশন সমাপ্ত!</h4>
              <p className="text-xs text-emerald-100">
                {toBengaliNumber(lastLoggedSessionDuration)} মিনিট সফলভাবে লগ করা হয়েছে। হালকা বিরতি নিন।
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSessionCompletedNotice(false)}
            className="px-3 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shrink-0"
          >
            ধন্যবাদ
          </button>
        </div>
      )}

      {/* Main Timer Dial Card */}
      <div className={`p-8 rounded-3xl border shadow-sm flex flex-col items-center justify-center transition-all ${zenMode ? 'bg-slate-800/90 border-slate-700 w-full max-w-xl' : 'bg-white border-slate-200'}`}>
        {/* Preset Selector Tabs: 25-minute, 50-minute, Custom, Breaks */}
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl mb-8 flex-wrap justify-center ${zenMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-100'}`}>
          {/* 25-minute preset */}
          <button
            onClick={() => handleModeChange('pomodoro')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'pomodoro'
                ? zenMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-2xs'
                : zenMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ২৫ মিনিট (25-Min Preset)
          </button>

          {/* 50-minute preset */}
          <button
            onClick={() => handleModeChange('deep_50')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'deep_50'
                ? zenMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-2xs'
                : zenMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ৫০ মিনিট (50-Min Preset)
          </button>

          {/* Custom timer duration */}
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'custom'
                ? zenMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-2xs'
                : zenMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            কাস্টম সময় (Custom)
          </button>

          {/* Optional Short Break */}
          <button
            onClick={() => handleModeChange('short_break')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'short_break'
                ? zenMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-2xs'
                : zenMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ৫ মি. বিরতি
          </button>
        </div>

        {/* Custom Timer Duration Input */}
        {mode === 'custom' && (
          <div className={`flex items-center gap-2 mb-6 text-xs p-2 rounded-xl border ${zenMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <span className="font-semibold">কাস্টম মিনিট নির্ধারণ করুন:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              onChange={e => {
                const val = Math.max(1, parseInt(e.target.value) || 25);
                setCustomMinutes(val);
                if (!isRunning && !isPaused) setTimeLeft(val * 60);
              }}
              className={`w-16 px-2 py-1 text-center font-mono tabular-nums text-xs font-bold rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${zenMode ? 'bg-slate-800 text-white border border-slate-600' : 'bg-white text-slate-900 border border-slate-300'}`}
            />
            <span className="font-semibold">মিনিট</span>
          </div>
        )}

        {/* Countdown Display with SVG Circular Progress Indicator */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={zenMode ? 'text-slate-700 stroke-current' : 'text-slate-100 stroke-current'}
              strokeWidth="4"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`${zenMode ? 'text-indigo-500' : 'text-slate-900'} stroke-current transition-all duration-500 ease-linear`}
              strokeWidth="4.5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Countdown Display Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-5xl sm:text-6xl font-bold font-mono tracking-tight tabular-nums select-none ${zenMode ? 'text-white' : 'text-slate-900'}`}>
              {timeFormatted}
            </span>
            <span className={`text-xs uppercase font-bold tracking-wider mt-2.5 ${zenMode ? 'text-indigo-400' : 'text-slate-400'}`}>
              {mode === 'pomodoro' 
                ? '২৫ মিনিট ডিপ ফোকাস' 
                : mode === 'deep_50' 
                ? '৫০ মিনিট গভীর কাজ' 
                : mode === 'custom' 
                ? `${toBengaliNumber(customMinutes)} মিনিট কাস্টম সেশন` 
                : 'সংক্ষিপ্ত বিরতি'}
            </span>
            {isPaused && (
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1 animate-pulse">
                বিরতিতে রয়েছে (Paused)
              </span>
            )}
          </div>
        </div>

        {/* Timer Control Buttons: Start, Pause, Resume, Reset */}
        <div className="flex items-center gap-3.5 mb-6">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className={`p-3.5 rounded-full transition-all ${
              zenMode 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="টাইমার রিসেট করুন (Reset)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Start / Pause / Resume Button Controls */}
          {!isRunning && !isPaused && (
            /* Start Button */
            <button
              onClick={handleStart}
              className={`px-8 py-3.5 rounded-full shadow-lg font-bold text-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${
                zenMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>শুরু করুন (Start)</span>
            </button>
          )}

          {isRunning && (
            /* Pause Button */
            <button
              onClick={handlePause}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg font-bold text-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>বিরতি দিন (Pause)</span>
            </button>
          )}

          {isPaused && (
            /* Resume Button */
            <button
              onClick={handleResume}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg font-bold text-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95 animate-pulse"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>চালু রাখুন (Resume)</span>
            </button>
          )}

          {/* Skip to Next Session */}
          <button
            onClick={handleTimerComplete}
            className={`p-3.5 rounded-full transition-all ${
              zenMode 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="সেশন শেষ করুন (Complete Session)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Linked Task Selector */}
        <div className={`w-full max-w-md pt-5 border-t flex flex-col items-center ${zenMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${zenMode ? 'text-slate-400' : 'text-slate-500'}`}>
            নির্দিষ্ট কাজের সাথে যুক্ত করুন (Linked Task)
          </span>

          <div className="w-full flex items-center gap-2">
            <select
              value={activeFocusTaskId || ''}
              onChange={e => setActiveFocusTaskId(e.target.value || null)}
              className={`flex-1 px-3 py-2 text-xs rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 truncate font-semibold ${
                zenMode 
                  ? 'bg-slate-900 border border-slate-700 text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <option value="">কোনো নির্দিষ্ট টাস্ক নেই (সাধারণ ডিপ ওয়ার্ক)</option>
              {pendingTasks.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.category}] {t.title}
                </option>
              ))}
            </select>

            {activeTask && (
              <button
                onClick={() => toggleTaskStatus(activeTask.id)}
                className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap"
                title="টাস্কটি সম্পন্ন হিসেবে চিহ্নিত করুন"
              >
                সম্পন্ন ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ambient Focus Soundscape Controls (Optional sound generator) */}
      {!zenMode && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                অ্যাম্বিয়েন্ট ফোকাস সাউন্ডস্কেপ (মনোযোগ ধরে রাখার জন্য)
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 accent-slate-900 cursor-pointer"
                title="ভলিউম নিয়ন্ত্রণ"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleAmbientChange('none')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                ambientType === 'none'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">নীরব</div>
              <div className="text-[11px] text-slate-500 mt-0.5">সম্পূর্ণ পিন-ড্রপ নীরবতা</div>
            </button>

            <button
              onClick={() => handleAmbientChange('rain')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                ambientType === 'rain'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">শান্ত বৃষ্টি</div>
              <div className="text-[11px] text-slate-500 mt-0.5">মৃদু বৃষ্টির প্রাকৃতিক শব্দ</div>
            </button>

            <button
              onClick={() => handleAmbientChange('whitenoise')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                ambientType === 'whitenoise'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">হোয়াইট নয়েজ</div>
              <div className="text-[11px] text-slate-500 mt-0.5">স্থির মৃদু ব্যাকগ্রাউন্ড নয়েজ</div>
            </button>

            <button
              onClick={() => handleAmbientChange('binaural')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                ambientType === 'binaural'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">বাইনোরাল ড্রোন</div>
              <div className="text-[11px] text-slate-500 mt-0.5">৪৩২ হার্টজ আলফা ফোকাস টোন</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
