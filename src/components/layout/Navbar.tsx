import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Menu, 
  X, 
  Sparkles, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText,
  Clock,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  Bell,
  Cloud,
  Layers
} from 'lucide-react';
import { useProductivity } from '../../context/ProductivityContext';
import { useTheme } from '../../context/ThemeContext';
import { ActiveTab } from '../../types';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenNewEvent: () => void;
  onOpenNewNote: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenNewEvent,
  onOpenNewNote,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { 
    user, 
    firebaseUser,
    signInWithGoogle,
    signOutUser,
    isLoggingIn,
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery,
    syncGoogleCalendar,
    isGoogleCalendarSyncing,
    soundAlarmEnabled,
    toggleSoundAlarm,
    testAlarm,
    isCloudSyncing,
    lastCloudSync,
    refreshCloudData
  } = useProductivity();

  const { theme, toggleTheme, setTheme } = useTheme();

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const getBreadcrumbTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard': return 'ড্যাশবোর্ড';
      case 'tasks': return 'টাস্কসমূহ';
      case 'calendar': return 'ক্যালেন্ডার';
      case 'events': return 'ইভেন্টসমূহ';
      case 'focus': return 'ফোকাস টাইমার';
      case 'notes': return 'নোটসমূহ';
      case 'assistant': return 'এআই সহকারী';
      default: return 'ওয়ার্কস্পেস';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors flex-nowrap overflow-hidden">
      {/* Zone 1: Navigation & Context Title & Live Sync Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white md:hidden rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation shrink-0"
          aria-label="নেভিগেশন মেনু খুলুন"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className="text-left group flex items-center gap-1.5 sm:gap-2 focus:outline-hidden min-h-[36px] py-1 shrink-0"
        >
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            ক্রোমা স্টুডিও
          </span>
          <span className="hidden md:inline-block text-slate-300 dark:text-slate-700 font-light" aria-hidden="true">/</span>
          <span className="hidden md:inline-block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
            {getBreadcrumbTitle(activeTab)}
          </span>
        </button>

        {/* Minimal Unobtrusive Real-time Cloud Sync Indicator */}
        <button 
          onClick={refreshCloudData}
          disabled={isCloudSyncing}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all cursor-pointer shrink-0"
          title={`ক্লাউড ডেটাবেজ রিয়েল-টাইম সিঙ্ক সক্রিয় (${lastCloudSync ? 'সর্বশেষ: ' + lastCloudSync : 'সক্রিয়'})। ক্লিক করে এখনই রিফ্রেশ করুন`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <Cloud className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
          <span className="hidden lg:inline">{isCloudSyncing ? 'সিঙ্ক...' : 'লাইভ'}</span>
        </button>
      </div>

      {/* Zone 2: Global Search (compact and bounded) */}
      <div className="hidden md:block w-36 lg:w-56 xl:w-72 max-w-xs mx-2 lg:mx-4 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] font-semibold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Actions, Theme, Alarms, & Profile (All fixed h-9, flex-nowrap) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
        
        {/* Sound Alarm Toggle */}
        <button
          onClick={toggleSoundAlarm}
          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors shrink-0 active:scale-95 touch-manipulation ${
            soundAlarmEnabled
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
          title={soundAlarmEnabled ? 'টাস্ক অ্যালার্ম সাউন্ড চালু (ক্লিক করে মিউট করুন)' : 'টাস্ক অ্যালার্ম সাউন্ড বন্ধ (ক্লিক করে চালু করুন)'}
        >
          {soundAlarmEnabled ? <Bell className="w-4 h-4 fill-amber-400 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 active:scale-95 touch-manipulation"
          title={`বর্তমান থিম: ${theme === 'dark' ? 'ডার্ক মোড' : theme === 'midnight' ? 'মিডনাইট ব্লু' : 'লাইট মোড'} (ক্লিক করে পরিবর্তন করুন)`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
          ) : theme === 'midnight' ? (
            <Layers className="w-4 h-4 text-sky-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30" />
          )}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setActiveTab('assistant')}
          className={`h-9 px-2 sm:px-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-colors shrink-0 whitespace-nowrap active:scale-95 touch-manipulation ${
            activeTab === 'assistant'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title="এআই সহকারীর সাথে কথা বলুন"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden lg:inline">সহকারী</span>
        </button>

        {/* Quick Add Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="h-9 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl shadow-xs transition-colors shrink-0 whitespace-nowrap active:scale-95 touch-manipulation"
            title="নতুন আইটেম তৈরি করুন"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">নতুন</span>
          </button>

          {quickCreateOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setQuickCreateOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewTask();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>নতুন টাস্ক</span>
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewEvent();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>নতুন ইভেন্ট</span>
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewNote();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>নতুন নোট</span>
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    setActiveTab('focus');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>ফোকাস সেশন শুরু</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile / Google Login Section */}
        <div className="relative pl-1 sm:pl-1.5 border-l border-slate-200 dark:border-slate-800 shrink-0">
          {firebaseUser ? (
            <div>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="h-9 flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={`${user.name} (${user.email}) - গুগল সিঙ্ক সক্রিয়`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-7 h-7 rounded-full ring-2 ring-emerald-500/40 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/40 shadow-xs">
                    {user.initials}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[90px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
                    গুগল সিঙ্কড
                  </span>
                </div>
              </button>

              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-700">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                          {user.initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between py-1">
                        <span>ক্লাউড ডেটা সিঙ্ক:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">সক্রিয় ✓</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between py-1">
                        <span>গুগল ক্যালেন্ডার:</span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">সংযুক্ত ✓</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          syncGoogleCalendar();
                        }}
                        className="w-full py-2 px-3 text-left font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ক্যালেন্ডার পুনরায় সিঙ্ক করুন</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          testAlarm();
                        }}
                        className="w-full py-2 px-3 text-left font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>অ্যালার্ম সাউন্ড পরীক্ষা করুন</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOutUser();
                        }}
                        className="w-full py-2 px-3 text-left font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>লগআউট করুন</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Official Google Sign In Button */
            <button
              onClick={signInWithGoogle}
              disabled={isLoggingIn}
              className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 touch-manipulation whitespace-nowrap shrink-0"
              title="গুগল দিয়ে লগইন করে ক্লাউড প্রোফাইল ও গুগল ক্যালেন্ডার সক্রিয় করুন"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span className="hidden sm:inline">{isLoggingIn ? 'লগইন হচ্ছে...' : 'Google লগইন'}</span>
              <span className="sm:hidden">{isLoggingIn ? '...' : 'লগইন'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
