import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Sparkles, 
  CalendarDays, 
  Target 
} from 'lucide-react';
import { useProductivity, toBengaliNumber } from '../../context/ProductivityContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { 
    activeTab, 
    setActiveTab, 
    pendingTasksCount, 
    todayEvents, 
    todayFocusMinutes 
  } = useProductivity();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'ড্যাশবোর্ড',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'tasks',
      label: 'টাস্কসমূহ',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
      badge: pendingTasksCount > 0 ? toBengaliNumber(pendingTasksCount) : undefined,
    },
    {
      id: 'calendar',
      label: 'ক্যালেন্ডার',
      icon: <CalendarIcon className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'events',
      label: 'ইভেন্টসমূহ',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
      badge: todayEvents.length > 0 ? toBengaliNumber(todayEvents.length) : undefined,
    },
    {
      id: 'focus',
      label: 'ফোকাস টাইমার',
      icon: <Clock className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'notes',
      label: 'নোটসমূহ',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'assistant',
      label: 'এআই সহকারী',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />,
    },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-16 z-40 md:z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            ওয়ার্কস্পেস মেনু
          </div>

          <nav className="space-y-0.5" aria-label="প্রধান নেভিগেশন">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap group ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Focus Tracker Widget */}
        <div className="pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                আজকের ফোকাস
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                {toBengaliNumber(todayFocusMinutes)} মি.
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (todayFocusMinutes / 120) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>লক্ষ্য: ১২০ মি.</span>
              <button
                onClick={() => handleSelectTab('focus')}
                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                টাইমার খুলুন →
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
