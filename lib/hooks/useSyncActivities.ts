'use client';

import { useState, useCallback, useEffect } from 'react';
import { Activity, SyncState } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  getUnsyncedActivities,
  markActivitySynced,
  getAllActivities,
} from '@/lib/db';

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
      setSyncState(prev => ({
        ...prev,
        pendingCount: unsynced.length,
        error: undefined,
      }));
    } catch (error) {
      console.error('Error checking pending activities:', error);
    }
  }, []);

  const syncActivities = useCallback(async (userId?: string) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured, skipping sync (Offline Mode)');
      return false;
    }
    if (!supabase) return false;

    setSyncState(prev => ({ ...prev, isSyncing: true, error: undefined }));

    try {
      const unsyncedActivities = await getUnsyncedActivities();

      if (unsyncedActivities.length === 0) {
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: Date.now(),
          pendingCount: 0,
        }));
        return true;
      }

      // Batch insert to Supabase
      const { error } = await supabase
        .from('activities')
        .insert(
          unsyncedActivities.map(({ id, synced, ...activity }) => ({
            ...activity,
            user_id: userId || null,
          }))
        );

      if (error) throw error;

      // Mark all as synced
      for (const activity of unsyncedActivities) {
        if (activity.id) {
          await markActivitySynced(activity.id);
        }
      }

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingCount: 0,
        error: undefined,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      console.error('Sync error:', error);
      return false;
    }
  }, []);

  const pullActivitiesFromSupabase = useCallback(async (userId?: string) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured, skipping pull (Offline Mode)');
      return [];
    }
    if (!supabase) return [];

    try {
      let query = supabase.from('activities').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pull failed';
      setSyncState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      console.error('Pull error:', error);
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
