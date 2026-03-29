import Dexie, { Table } from 'dexie';
import { Activity } from './types';

export class TimeLedgerDB extends Dexie {
  activities!: Table<Activity>;

  constructor() {
    super('TimeLedgerDB');
    this.version(1).stores({
      activities: '++id, user_id, created_at, synced',
    });
  }
}

export const db = new TimeLedgerDB();

/**
 * Save activity to local IndexedDB
 */
export async function saveActivityLocal(activity: Activity): Promise<Activity> {
  const now = new Date().toISOString();
  const { id, ...activityData } = activity;
  
  const newActivity = {
    ...activityData,
    created_at: activity.created_at || now,
    synced: false,
  };

  const activityId = await db.activities.add(newActivity);
  return { ...newActivity, id: String(activityId) };
}

/**
 * Get all unsaved activities
 */
export async function getUnsyncedActivities(): Promise<Activity[]> {
  const all = await db.activities.toArray();
  return all.filter(activity => !activity.synced);
}

/**
 * Mark activities as synced
 */
export async function markActivitySynced(id: string | number): Promise<void> {
  await db.activities.update(id, { synced: true });
}

/**
 * Get all activities
 */
export async function getAllActivities(): Promise<Activity[]> {
  return db.activities.toArray();
}

/**
 * Get activities within date range
 */
export async function getActivitiesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Activity[]> {
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  
  return db.activities
    .where('created_at')
    .between(start, end)
    .toArray();
}

/**
 * Delete activity
 */
export async function deleteActivity(id: string | number): Promise<void> {
  await db.activities.delete(id);
}

/**
 * Clear all local data (for testing/reset)
 */
export async function clearAllActivities(): Promise<void> {
  await db.activities.clear();
}
