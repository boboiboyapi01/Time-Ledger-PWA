'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from '@/lib/types';
import { Clock, Trash2 } from 'lucide-react';

interface ActivityHistoryProps {
  activities: Activity[];
  onDeleteActivity?: (id: string | number) => void;
}

export function ActivityHistory({
  activities,
  onDeleteActivity,
}: ActivityHistoryProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 font-medium">
        <p>No activities logged yet.</p>
      </div>
    );
  }

  // Sort by start_time descending
  const sorted = [...activities].sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return dateB - dateA;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sorted.map((activity, idx) => (
          <motion.div
            key={activity.id || idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-xl border transition-all hover:bg-opacity-50 ${
              activity.type === 'positive'
                ? 'bg-[#f0fdf4] border-[#dcfce7]'
                : 'bg-[#fff1f2] border-[#ffe4e6]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4
                  className={`font-bold ${
                    activity.type === 'positive'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {activity.name}
                </h4>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  {new Date(activity.start_time).toLocaleString()} -{' '}
                  {activity.end_time
                    ? new Date(activity.end_time).toLocaleTimeString()
                    : 'Ongoing'}
                </p>
                <p className="text-slate-600 text-sm font-semibold mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> {formatDuration(activity.duration || 0)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!activity.synced && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Pending
                  </span>
                )}
                {onDeleteActivity && activity.id && (
                  <button
                    onClick={() => onDeleteActivity(activity.id!)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shadow-sm"
                    title="Delete activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
