"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TimerState, ActivityType } from "@/lib/types";

const TIMER_KEY = "timerState";

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    currentActivityName: "",
    currentActivityType: "positive",
    elapsedSeconds: 0,
    startTime: undefined,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      // If timer was running, resume it
      if (state.isRunning && state.startTime) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        setTimerState({
          ...state,
          elapsedSeconds: elapsed,
        });
      } else {
        setTimerState(state);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TIMER_KEY, JSON.stringify(timerState));
  }, [timerState]);

  // Handle visibility change to recalculate elapsed time when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        timerState.isRunning &&
        timerState.startTime
      ) {
        const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
        setTimerState((prev) => ({
          ...prev,
          elapsedSeconds: elapsed,
        }));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timerState.isRunning, timerState.startTime]);

  // Timer interval effect
  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - (timerState.startTime || 0)) / 1000,
        );
        setTimerState((prev) => ({
          ...prev,
          elapsedSeconds: elapsed,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.isRunning]);

  const startTimer = useCallback((name: string, type: ActivityType) => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      currentActivityName: name,
      currentActivityType: type,
      elapsedSeconds: 0,
      startTime: Date.now(),
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      startTime: undefined,
    }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState({
      isRunning: false,
      currentActivityName: "",
      currentActivityType: "positive",
      elapsedSeconds: 0,
      startTime: undefined,
    });
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return {
    timerState,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
  };
}
