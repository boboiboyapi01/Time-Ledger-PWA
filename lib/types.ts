// Core types for Time Ledger PWA

export type ActivityType = 'positive' | 'negative';

export interface Activity {
  id?: string;
  user_id?: string;
  name: string;
  type: ActivityType;
  start_time: string; // ISO 8601
  end_time?: string; // ISO 8601
  duration?: number; // in seconds
  created_at?: string;
  synced?: boolean;
}

export interface TimerState {
  isRunning: boolean;
  currentActivityName: string;
  currentActivityType: ActivityType;
  elapsedSeconds: number;
  startTime?: number; // timestamp when timer started
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingCount: number;
  error?: string;
}

export interface AnalyticsData {
  totalPositive: number;
  totalNegative: number;
  positiveActivities: { [key: string]: number };
  negativeActivities: { [key: string]: number };
  byDate: { [date: string]: { positive: number; negative: number } };
}
