import React, { useState } from 'react';
import { ProductivityProvider, useProductivity } from './context/ProductivityContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { EventsView } from './components/events/EventsView';
import { FocusTimerView } from './components/focus/FocusTimerView';
import { NotesView } from './components/notes/NotesView';
import { AssistantView } from './components/assistant/AssistantView';
import { TaskModal } from './components/modals/TaskModal';
import { EventModal } from './components/modals/EventModal';
import { NoteModal } from './components/modals/NoteModal';
import { Toast } from './components/layout/Toast';
import { Task, CalendarEvent, Note } from './types';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    addTask, 
    updateTask, 
    addEvent, 
    updateEvent, 
    addNote, 
    updateNote,
    setActiveTab 
  } = useProductivity();

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskDefaultDueDate, setTaskDefaultDueDate] = useState<string | undefined>(undefined);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventDefaultDate, setEventDefaultDate] = useState<string | undefined>(undefined);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  // Task Modal Handlers
  const handleOpenNewTask = (defaultDueDate?: string) => {
    setTaskToEdit(null);
    setTaskDefaultDueDate(defaultDueDate);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  // Event Modal Handlers
  const handleOpenNewEvent = (defaultDate?: string) => {
    setEventToEdit(null);
    setEventDefaultDate(defaultDate);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setEventDefaultDate(event.date);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (eventToEdit) {
      updateEvent(eventToEdit.id, eventData);
    } else {
      addEvent(eventData);
    }
  };

  // Note Modal Handlers
  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (noteToEdit) {
      updateNote(noteToEdit.id, noteData);
    } else {
      addNote(noteData);
      setActiveTab('notes');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenNewTask={() => handleOpenNewTask()}
        onOpenNewEvent={() => handleOpenNewEvent()}
        onOpenNewNote={handleOpenNewNote}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewTask={() => handleOpenNewTask()}
              onOpenNewEvent={() => handleOpenNewEvent()}
              onOpenNewNote={handleOpenNewNote}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              onOpenNewTask={() => handleOpenNewTask()}
              onEditTask={handleEditTask}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              onOpenNewEvent={handleOpenNewEvent}
              onOpenNewTask={handleOpenNewTask}
              onEditEvent={handleEditEvent}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              onOpenNewEvent={() => handleOpenNewEvent()}
              onEditEvent={handleEditEvent}
            />
          )}

          {activeTab === 'focus' && <FocusTimerView />}

          {activeTab === 'notes' && <NotesView onOpenNewNote={handleOpenNewNote} />}

          {activeTab === 'assistant' && <AssistantView />}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav />

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        defaultDueDate={taskDefaultDueDate}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        defaultDate={eventDefaultDate}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
        onSave={handleSaveNote}
        noteToEdit={noteToEdit}
      />

      {/* Global Toast Feedback */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ProductivityProvider>
      <MainAppContent />
    </ProductivityProvider>
  );
}
