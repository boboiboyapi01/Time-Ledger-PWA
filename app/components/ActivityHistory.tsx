"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "@/lib/types";
import { Clock, Trash2, Pencil, X, Save } from "lucide-react";

interface ActivityHistoryProps {
  activities: Activity[];
  onDeleteActivity?: (id: string | number) => void;
  onUpdateActivity?: (id: string | number, updates: Partial<Activity>) => void;
}

export function ActivityHistory({
  activities,
  onDeleteActivity,
  onUpdateActivity,
}: ActivityHistoryProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"positive" | "negative">("positive");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setEditName(activity.name);
    setEditType(activity.type);
    
    // Format dates for datetime-local input (using local timezone)
    const toLocalISOString = (dateStr: string) => {
      const date = new Date(dateStr);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    };

    if (activity.start_time) {
      setEditStartTime(toLocalISOString(activity.start_time));
    }
    if (activity.end_time) {
      setEditEndTime(toLocalISOString(activity.end_time));
    } else {
      setEditEndTime('');
    }
  };

  const handleSaveEdit = () => {
    if (editingActivity?.id && onUpdateActivity) {
      const start = new Date(editStartTime);
      const end = editEndTime ? new Date(editEndTime) : new Date();
      const duration = Math.round((end.getTime() - start.getTime()) / 1000);

      onUpdateActivity(editingActivity.id, {
        name: editName,
        type: editType,
        start_time: start.toISOString(),
        end_time: editEndTime ? end.toISOString() : undefined,
        duration: duration > 0 ? duration : 0,
      });
      setEditingActivity(null);
    }
  };

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
              activity.type === "positive"
                ? "bg-[#f0fdf4] border-[#dcfce7]"
                : "bg-[#fff1f2] border-[#ffe4e6]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4
                  className={`font-bold ${
                    activity.type === "positive"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {activity.name}
                </h4>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  {new Date(activity.start_time).toLocaleString()} -{" "}
                  {activity.end_time
                    ? new Date(activity.end_time).toLocaleTimeString()
                    : "Ongoing"}
                </p>
                <p className="text-slate-600 text-sm font-semibold mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />{" "}
                  {formatDuration(activity.duration || 0)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!activity.synced && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Pending
                  </span>
                )}
                {onUpdateActivity && activity.id && (
                  <button
                    onClick={() => handleEditClick(activity)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-400 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                    title="Edit activity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
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

      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800">
                  Edit Activity
                </h3>
                <button
                  onClick={() => setEditingActivity(null)}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="What are you working on?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditType("positive")}
                      className={`py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                        editType === "positive"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${editType === "positive" ? "bg-emerald-500" : "bg-slate-300"}`}
                      />
                      Productive
                    </button>
                    <button
                      onClick={() => setEditType("negative")}
                      className={`py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                        editType === "negative"
                          ? "bg-rose-50 border-rose-500 text-rose-700"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${editType === "negative" ? "bg-rose-500" : "bg-slate-300"}`}
                      />
                      Distraction
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setEditingActivity(null)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
