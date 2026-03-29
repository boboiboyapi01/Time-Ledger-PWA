"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  Bell,
  BellOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Cloud,
} from "lucide-react";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSyncActivities } from "@/lib/hooks/useSyncActivities";
import { Activity, ActivityType } from "@/lib/types";
import { saveActivityLocal } from "@/lib/db";
import {
  requestNotificationPermission,
  showTimerNotification,
  closeTimerNotification,
  startBackgroundTimer,
  stopBackgroundTimer,
} from "@/lib/notifications";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper for clean class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TimerComponent() {
  const { timerState, startTimer, stopTimer, resetTimer, formatTime } =
    useTimer();
  const { syncState } = useSyncActivities();

  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("positive");
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const handleStop = useCallback(async () => {
    stopTimer();

    if (notificationEnabled) {
      closeTimerNotification();
    }

    const activity: Activity = {
      name: timerState.currentActivityName || activityName,
      type: timerState.currentActivityType || activityType,
      start_time: new Date(
        Date.now() - timerState.elapsedSeconds * 1000,
      ).toISOString(),
      end_time: new Date().toISOString(),
      duration: timerState.elapsedSeconds,
    };

    try {
      await saveActivityLocal(activity);
    } catch (error) {
      console.error("Error saving activity:", error);
    }

    resetTimer();
    setActivityName("");
  }, [
    stopTimer,
    notificationEnabled,
    activityName,
    activityType,
    timerState.elapsedSeconds,
    resetTimer,
  ]);

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "STOP_TIMER") {
        handleStop();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage,
        );
      }
    };
  }, [handleStop]);

  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      setNotificationEnabled(granted);
    });
  }, []);

  useEffect(() => {
    if (timerState.isRunning && notificationEnabled) {
      // Start background timer in Service Worker
      startBackgroundTimer(
        timerState.currentActivityName,
        timerState.startTime || Date.now(),
      );
    } else if (!timerState.isRunning) {
      // Stop background timer in Service Worker
      stopBackgroundTimer();
    }
  }, [
    timerState.isRunning,
    notificationEnabled,
    timerState.currentActivityName,
    timerState.startTime,
  ]);

  const handleStart = () => {
    if (!activityName.trim()) {
      alert("Please enter an activity name");
      return;
    }
    startTimer(activityName, activityType);
  };

  const isPositive = activityType === "positive";
  const accentColor = isPositive ? "emerald" : "rose";

  return (
    <div className="w-full h-full p-5 lg:p-8 bg-white rounded-3xl shadow-sm border border-slate-200 relative flex flex-col min-h-0">
      {/* Background ambient glow when running */}
      <AnimatePresence>
        {timerState.isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute -top-32 -inset-x-20 h-62.5 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000",
              timerState.currentActivityType === "positive"
                ? "bg-emerald-500"
                : "bg-rose-500",
            )}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Smart Timer
          </h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
            {notificationEnabled ? (
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {notificationEnabled ? "Notifs On" : "Notifs Off"}
            </span>
          </div>
        </div>

        {/* Timer UI (Centered in remaining space) */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 min-h-0 relative">
          <motion.div
            className="relative flex items-center justify-center w-56 h-56 lg:w-64 lg:h-64 rounded-full bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] group"
            animate={timerState.isRunning ? { scale: [1, 1.01, 1] } : {}}
            transition={{
              duration: 2,
              repeat: timerState.isRunning ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            {/* SVG Progress Ring Timer */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="none"
                strokeWidth="4"
                className="stroke-slate-100"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  timerState.isRunning &&
                    timerState.currentActivityType === "positive"
                    ? "stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    : timerState.isRunning &&
                        timerState.currentActivityType === "negative"
                      ? "stroke-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                      : "stroke-transparent",
                )}
                style={{
                  strokeDasharray: "289%",
                  strokeDashoffset: timerState.isRunning
                    ? `calc(289% - (289% * ${(timerState.elapsedSeconds % 60) / 60}))`
                    : "289%",
                }}
              />
            </svg>

            <div className="flex flex-col items-center justify-center z-10">
              <div className="text-5xl lg:text-[4.5rem] leading-none font-black font-sans tracking-[-0.04em] text-slate-800 tabular-nums">
                {formatTime(timerState.elapsedSeconds)}
              </div>
              <span className="text-[10px] lg:text-xs font-bold text-slate-400 tracking-[0.25em] uppercase mt-3">
                {timerState.isRunning ? "Focusing" : "Idle"}
              </span>
            </div>
          </motion.div>

          {/* Activity Status */}
          <div className="h-8 mt-4">
            <AnimatePresence mode="wait">
              {timerState.isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      timerState.currentActivityType === "positive"
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-rose-500 shadow-[0_0_8px_rgba(243,64,64,0.5)]",
                    )}
                  />
                  <span className="text-sm font-medium text-slate-300">
                    {timerState.currentActivityName}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Section at the Bottom */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 mt-auto items-stretch">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="What are you working on?"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              disabled={timerState.isRunning}
              className="w-full h-full px-5 py-3 lg:py-4 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 disabled:opacity-50 transition-all font-medium text-sm lg:text-base min-h-13"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 h-13 lg:h-14.5 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Toggle Button */}
            <button
              onClick={() =>
                setActivityType(isPositive ? "negative" : "positive")
              }
              disabled={timerState.isRunning}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center px-4 rounded-xl font-bold transition-all duration-300 text-xs sm:text-sm lg:text-base border shadow-sm select-none",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                timerState.isRunning && "opacity-50 cursor-not-allowed",
              )}
              title={
                isPositive ? "Switch to Distracting" : "Switch to Productive"
              }
            >
              {isPositive ? (
                <CheckCircle2 className="w-5 h-5 sm:mr-2" />
              ) : (
                <ShieldAlert className="w-5 h-5 sm:mr-2" />
              )}
              <span className="hidden sm:inline">
                {isPositive ? "Productive" : "Distracting"}
              </span>
            </button>

            {/* Action Button */}
            {!timerState.isRunning ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 rounded-xl text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-widest shadow-lg transition-all focus:outline-none focus:ring-2 ring-offset-2 ring-offset-white whitespace-nowrap",
                  isPositive
                    ? "bg-linear-to-r from-emerald-400 to-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:ring-emerald-400"
                    : "bg-linear-to-r from-rose-400 to-rose-500 shadow-rose-500/30 hover:shadow-rose-500/50 focus:ring-rose-400",
                )}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="sm:inline">Start</span>
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-widest shadow-lg shadow-slate-800/20 hover:shadow-slate-800/40 transition-all focus:outline-none focus:ring-2 ring-offset-2 ring-offset-white focus:ring-slate-800 whitespace-nowrap"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-rose-400" />
                <span className="sm:inline">Stop</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            {syncState.isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            ) : syncState.error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : syncState.pendingCount > 0 ? (
              <Cloud className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}

            <span>
              {syncState.isSyncing
                ? "Syncing to cloud..."
                : syncState.error
                  ? syncState.error
                  : syncState.pendingCount > 0
                    ? `Waiting to sync (${syncState.pendingCount})`
                    : "All data securely synced"}
            </span>
          </div>
          <div>Local Dexie Cache</div>
        </div>
      </div>
    </div>
  );
}
