import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useProductivity } from '../../context/ProductivityContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useProductivity();

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <aside
      aria-label="বিজ্ঞপ্তি"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 backdrop-blur-md transition-all ${
          isError
            ? 'bg-rose-950/90 border-rose-800 text-rose-100'
            : isSuccess
            ? 'bg-slate-900/95 border-slate-800 text-white'
            : 'bg-slate-900/95 border-slate-800 text-white'
        }`}
      >
        <div className="shrink-0">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Info className="w-4 h-4 text-sky-400" />
          )}
        </div>

        <p className="text-xs sm:text-sm font-medium tracking-normal pr-1">
          {toast.message}
        </p>

        <button
          onClick={dismissToast}
          className="p-1 -mr-1 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 touch-manipulation"
          aria-label="বন্ধ করুন"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
