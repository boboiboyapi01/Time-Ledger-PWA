"use client";

import { useState, useCallback, useEffect } from "react";
import { Activity, SyncState } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  getUnsyncedActivities,
  markActivitySynced,
  getAllActivities,
  upsertActivity,
  db,
} from "@/lib/db";

export function useSyncActivities() {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: undefined,
    pendingCount: 0,
    error: undefined,
  });

  // Check for unsynced activities on mount
  useEffect(() => {
    checkPendingActivities();
  }, []);

  const checkPendingActivities = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedActivities();
      setSyncState((prev) => ({
        ...prev,
        pendingCount: unsynced.length,
        error: undefined,
      }));
    } catch (error) {
      console.error("Error checking pending activities:", error);
    }
  }, []);

  const syncActivities = useCallback(async (userId?: string) => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ) {
      console.warn(
        "Supabase credentials not configured, skipping sync (Offline Mode)",
      );
      return false;
    }
    if (!supabase) return false;

    setSyncState((prev) => ({ ...prev, isSyncing: true, error: undefined }));

    try {
      // 1. Push local changes to Supabase
      const unsyncedActivities = await getUnsyncedActivities();

      if (unsyncedActivities.length > 0) {
        // Upsert to Supabase
        const { data: pushedData, error: pushError } = await supabase
          .from("activities")
          .upsert(
            unsyncedActivities.map(({ id, synced, ...activity }) => {
              const activityToSync: any = {
                ...activity,
                user_id: userId || null,
              };
              // Only include ID if it's a UUID (string)
              if (typeof id === "string" && id.includes("-")) {
                activityToSync.id = id;
              }
              return activityToSync;
            }),
            { onConflict: "id" },
          )
          .select();

        if (pushError) throw pushError;

        // Mark all as synced locally and update with remote IDs if needed
        if (pushedData) {
          await db.transaction("rw", db.activities, async () => {
            for (const local of unsyncedActivities) {
              const remote = pushedData.find(
                (r) =>
                  new Date(r.created_at).getTime() ===
                    new Date(local.created_at || "").getTime() &&
                  r.name === local.name,
              );

              if (remote && local.id) {
                // If the local ID is numeric, we need to swap it for the remote UUID
                if (typeof local.id === "number") {
                  await db.activities.delete(local.id);
                  await db.activities.put({
                    ...local,
                    id: remote.id,
                    synced: true,
                  });
                } else {
                  // If it was already a UUID, just mark as synced
                  await markActivitySynced(local.id);
                }
              }
            }
          });
        }
      }

      // 2. Pull remote changes from Supabase
      const remoteActivities = await pullActivitiesFromSupabase(userId);

      // 3. Update local DB with remote data
      if (remoteActivities && remoteActivities.length > 0) {
        await db.transaction("rw", db.activities, async () => {
          for (const activity of remoteActivities) {
            await upsertActivity(activity);
          }
        });
      }

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingCount: 0,
        error: undefined,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      console.error("Sync error:", error);
      return false;
    }
  }, []);

  const pullActivitiesFromSupabase = useCallback(async (userId?: string) => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ) {
      console.warn(
        "Supabase credentials not configured, skipping pull (Offline Mode)",
      );
      return [];
    }
    if (!supabase) return [];

    try {
      let query = supabase.from("activities").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Pull error:", error);
      return [];
    }
  }, []);

  return {
    syncState,
    syncActivities,
    checkPendingActivities,
    pullActivitiesFromSupabase,
  };
}
