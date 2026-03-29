import { create } from 'zustand';
import { Activity, TimerState, SyncState } from '@/lib/types';

interface AppStore {
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  timerState: TimerState;
  setTimerState: (state: TimerState) => void;
  syncState: SyncState;
  setSyncState: (state: SyncState) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppStore>(set => ({
  activities: [],
  setActivities: (activities: Activity[]) =>
    set(state => ({
      ...state,
      activities,
    })),
  addActivity: (activity: Activity) =>
    set(state => ({
      ...state,
      activities: [activity, ...state.activities],
    })),

  timerState: {
    isRunning: false,
    currentActivityName: '',
    currentActivityType: 'positive',
    elapsedSeconds: 0,
  },
  setTimerState: (timerState: TimerState) =>
    set(state => ({
      ...state,
      timerState,
    })),

  syncState: {
    isSyncing: false,
    pendingCount: 0,
  },
  setSyncState: (syncState: SyncState) =>
    set(state => ({
      ...state,
      syncState,
    })),

  darkMode: true,
  setDarkMode: (darkMode: boolean) =>
    set(state => ({
      ...state,
      darkMode,
    })),
}));
