'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimerComponent from './components/TimerComponent';
import { ServiceWorkerProvider } from './components/ServiceWorkerProvider';
import { DailyPieChart, PeriodBarChart, ActivityBreakdown } from './components/Analytics';

import { ActivityHistory } from './components/ActivityHistory';
import { ManualEntry } from './components/ManualEntry';
import { Activity } from '@/lib/types';
import { getAllActivities, deleteActivity } from '@/lib/db';
import { useSyncActivities } from '@/lib/hooks/useSyncActivities';
import { Clock, BarChart3, History, RefreshCw, Hand } from 'lucide-react';

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { syncState, syncActivities, checkPendingActivities } = useSyncActivities();

  // Load activities from local DB on mount
  useEffect(() => {
    setIsOnline(navigator.onLine);
    loadActivities();
    setupOnlineSync();

    // Listen for timer stop event from Service Worker
    window.addEventListener('stopTimer', handleStopTimer);

    return () => {
      window.removeEventListener('stopTimer', handleStopTimer);
    };
  }, []);

  // Sync when online
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online, syncing...');
      setIsOnline(true);
      syncActivities();
      loadActivities();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncActivities]);

  const loadActivities = async () => {
    try {
      const data = await getAllActivities();
      setActivities(data);
      checkPendingActivities();
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupOnlineSync = () => {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        syncActivities();
      }
    }, 5 * 60 * 1000);
  };

  const handleStopTimer = () => {
    // Activity will be automatically saved by TimerComponent
    loadActivities();
  };

  const handleActivityAdded = async (newActivity: Activity) => {
    setActivities(prev => [newActivity, ...prev]);
    checkPendingActivities();
  };

  const handleDeleteActivity = async (id: string | number) => {
    try {
      await deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      checkPendingActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleManualSync = async () => {
    if (isOnline) {
      await syncActivities();
      loadActivities();
    } else {
      alert('You are offline. Changes will sync when you go online.');
    }
  };

  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'history'>('timer');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const todaysActivities = activities.filter(a => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
    return start < tomorrow.getTime() && end > today.getTime();
  });

  const calcClampedDur = (a: Activity) => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
    const vs = Math.max(start, today.getTime());
    const ve = Math.min(end, tomorrow.getTime());
    return Math.max(0, (ve - vs) / 1000);
  };

  const totalProdSecs = todaysActivities.filter(a => a.type === 'positive').reduce((s, a) => s + calcClampedDur(a), 0);
  const totalDistSecs = todaysActivities.filter(a => a.type === 'negative').reduce((s, a) => s + calcClampedDur(a), 0);
  const formatH = (s: number) => (s / 3600).toFixed(1);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <ServiceWorkerProvider />

      {/* Top Header & Navigation */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 flex-shrink-0 z-10 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Time Ledger</span>
        </div>

        {/* Tab Navigation */}
        <nav className="flex bg-slate-100 p-1 sm:p-1.5 rounded-xl border border-slate-200 shadow-inner">
          {(['timer', 'analytics', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all capitalize ${
                activeTab === tab 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!isOnline && (
            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold ring-1 ring-rose-200 hidden sm:block">
              OFFLINE
            </span>
          )}
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing || !isOnline}
            className={`flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:py-2 rounded-xl font-medium transition-all text-sm shadow-sm ${
              isOnline
                ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${syncState.isSyncing ? "animate-spin text-blue-500" : ""}`} /> 
            <span className="hidden sm:inline sm:ml-2">{syncState.isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable on mobile, hidden overflow on larger screens */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* --- TIMER TAB --- */}
              {activeTab === 'timer' && (
                <motion.div 
                  key="timer" 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                  className="flex flex-col h-full gap-6"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-shrink-0">
                    <div className="bg-[#f0f9ff] text-blue-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
                      <p className="text-blue-600/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Total Activities</p>
                      <h3 className="text-xl sm:text-2xl font-bold">{activities.length}</h3>
                    </div>
                    <div className="bg-[#f0fdf4] text-emerald-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
                      <p className="text-emerald-600/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Productive Today</p>
                      <h3 className="text-xl sm:text-2xl font-bold">{formatH(totalProdSecs)} <span className="text-[10px] sm:text-sm font-medium opacity-70">hrs</span></h3>
                    </div>
                    <div className="bg-[#fff1f2] text-rose-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col justify-center">
                      <p className="text-rose-600/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Distracting Today</p>
                      <h3 className="text-xl sm:text-2xl font-bold">{formatH(totalDistSecs)} <span className="text-[10px] sm:text-sm font-medium opacity-70">hrs</span></h3>
                    </div>
                    <div className="bg-white text-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                      <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Sync Pending</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-amber-500">{syncState.pendingCount}</h3>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-[2rem] shadow-sm relative overflow-hidden">
                    <TimerComponent />
                  </div>
                </motion.div>
              )}

              {/* --- ANALYTICS TAB --- */}
              {activeTab === 'analytics' && (
                <motion.div 
                  key="analytics" 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
                >
                  <div className="lg:col-span-1 border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <DailyPieChart activities={activities} />
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="flex-1 min-h-0">
                      <PeriodBarChart activities={activities} />
                    </div>
                    <div className="flex-1 min-h-0">
                      <ActivityBreakdown activities={activities} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- HISTORY TAB --- */}
              {activeTab === 'history' && (
                <motion.div 
                  key="history" 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
                >
                  <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Add Manual Entry</h3>
                    <ManualEntry onActivityAdded={handleActivityAdded} />
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 sticky top-0 bg-white z-10">Activity Logs</h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <ActivityHistory
                        activities={activities}
                        onDeleteActivity={handleDeleteActivity}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
