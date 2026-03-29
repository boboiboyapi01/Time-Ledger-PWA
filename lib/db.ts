import Dexie, { Table } from "dexie";
import { Activity } from "./types";

export class TimeLedgerDB extends Dexie {
  activities!: Table<Activity>;

  constructor() {
    super("TimeLedgerDB");
    this.version(1).stores({
      activities: "++id, user_id, created_at, synced",
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
  return all.filter((activity) => !activity.synced);
}

/**
 * Mark activities as synced
 */
export async function markActivitySynced(id: string | number): Promise<void> {
  await db.activities.update(id, { synced: true });
}

/**
 * Upsert activity (for syncing from Supabase)
 * This prevents duplicates by checking for existing activities with same name and created_at
 */
export async function upsertActivity(activity: Activity): Promise<void> {
  let existing;

  // 1. Try to find by ID (if provided as UUID from Supabase)
  if (activity.id) {
    existing = await db.activities.get(activity.id);
  }

  // 2. If not found, try to find by normalized created_at and name
  if (!existing && activity.created_at) {
    const normalizedTime = new Date(activity.created_at).getTime();
    
    // Fetch activities from the same day to narrow down (optimization)
    const startDate = new Date(normalizedTime - 60000).toISOString(); // 1 min before
    const endDate = new Date(normalizedTime + 60000).toISOString();   // 1 min after
    
    const candidates = await db.activities
      .where("created_at")
      .between(startDate, endDate)
      .toArray();

    existing = candidates.find(a => 
      new Date(a.created_at || "").getTime() === normalizedTime && 
      a.name === activity.name
    );
  }

  if (existing) {
    // Update existing local record - preserve its local ID if it was numeric
    // but update all other fields with remote data
    const localId = existing.id;
    const { id, ...remoteData } = activity;
    
    await db.activities.update(localId!, {
      ...remoteData,
      id: localId, // Keep local ID
      synced: true,
    });
  } else {
    // Add as new synced record
    await db.activities.add({
      ...activity,
      synced: true,
    });
  }
}

/**
 * Get all activities
 */
export async function getAllActivities(): Promise<Activity[]> {
  return db.activities.reverse().toArray();
}

/**
 * Get activities within date range
 */
export async function getActivitiesByDateRange(
  startDate: Date,
  endDate: Date,
): Promise<Activity[]> {
  const start = startDate.toISOString();
  const end = endDate.toISOString();

  return db.activities.where("created_at").between(start, end).toArray();
}

/**
 * Update activity in local IndexedDB
 */
export async function updateActivity(
  id: string | number,
  updates: Partial<Activity>,
): Promise<void> {
  await db.activities.update(id, {
    ...updates,
    synced: false, // Mark for re-sync
  });
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
