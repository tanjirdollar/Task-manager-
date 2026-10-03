import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  Clock, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { useProductivity, toBengaliNumber } from '../../context/ProductivityContext';
import { ActiveTab } from '../../types';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, pendingTasksCount } = useProductivity();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'ড্যাশবোর্ড',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'tasks',
      label: 'টাস্ক',
      icon: <CheckSquare className="w-5 h-5" />,
      badge: pendingTasksCount > 0 ? toBengaliNumber(pendingTasksCount) : undefined,
    },
    {
      id: 'calendar',
      label: 'ক্যালেন্ডার',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'focus',
      label: 'ফোকাস',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'notes',
      label: 'নোটস',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'assistant',
      label: 'এআই',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <nav 
      aria-label="মোবাইল দ্রুত নেভিগেশন"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md px-1 py-1 flex items-center justify-around safe-area-bottom select-none"
    >
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative min-w-[52px] min-h-[48px] active:scale-95 touch-manipulation ${
              isActive 
                ? 'text-indigo-600 font-bold bg-indigo-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-[16px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow-2xs font-mono tabular-nums">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
