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
  Clock
} from 'lucide-react';
import { useProductivity } from '../../context/ProductivityContext';
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
  const { user, activeTab, setActiveTab, searchQuery, setSearchQuery } = useProductivity();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Brand & Context Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="নেভিগেশন মেনু খুলুন"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className="text-left group flex items-center gap-2 focus:outline-hidden"
        >
          <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
            ক্রোমা স্টুডিও
          </span>
          <span className="hidden sm:inline-block text-slate-300 font-light" aria-hidden="true">/</span>
          <span className="hidden sm:inline-block text-sm font-semibold text-slate-600">
            {getBreadcrumbTitle(activeTab)}
          </span>
        </button>
      </div>

      {/* Zone 2: Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="টাস্ক, নোট বা ইভেন্ট খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
            >
              মুছুন
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Actions & User Profile */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'assistant'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
          }`}
          title="এআই সহকারীর সাথে কথা বলুন"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">এআই সহকারী</span>
        </button>

        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>তৈরি করুন</span>
          </button>

          {quickCreateOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setQuickCreateOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewTask();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>নতুন টাস্ক</span>
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewEvent();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>নতুন ইভেন্ট</span>
                </button>
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    onOpenNewNote();
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>নতুন নোট</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setQuickCreateOpen(false);
                    setActiveTab('focus');
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>ফোকাস সেশন শুরু</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Personalized Tanjir Avatar & Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div 
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title={`${user.name} (${user.email}) - ${user.role}`}
          >
            <div 
              className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-wider shadow-2xs ring-2 ring-slate-100"
            >
              {user.initials}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                অনলাইন
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
