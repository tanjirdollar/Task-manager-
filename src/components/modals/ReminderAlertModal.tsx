import React from 'react';
import { Bell, Check, Clock, Volume2, VolumeX, X, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';
import { toBengaliNumber } from '../../context/ProductivityContext';

interface ReminderAlertModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  soundAlarmEnabled: boolean;
  onToggleSound: () => void;
}

export const ReminderAlertModal: React.FC<ReminderAlertModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
  onSnooze,
  soundAlarmEnabled,
  onToggleSound,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Top Pulsing Alarm Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                টাস্ক রিমাইন্ডার অ্যালার্ম
              </span>
              <h2 className="text-base font-bold leading-tight">
                কাজের সময় হয়েছে!
              </h2>
            </div>
          </div>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title={soundAlarmEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundAlarmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                {task.category}
              </span>
              {task.reminderTime && (
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{task.reminderTime}</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {task.description}
              </p>
            )}

            {task.estimatedMinutes && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                আনুমানিক সময়: {toBengaliNumber(task.estimatedMinutes)} মিনিট
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => onComplete(task.id)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <Check className="w-4 h-4" />
              <span>সম্পন্ন করুন</span>
            </button>

            <button
              onClick={() => onSnooze(task.id, 5)}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>৫ মিনিট স্নুজ</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              এখনই বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
