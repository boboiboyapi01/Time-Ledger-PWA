'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ActivityType } from '@/lib/types';
import { saveActivityLocal } from '@/lib/db';

interface ManualEntryProps {
  onActivityAdded?: (activity: Activity) => void;
}

export function ManualEntry({ onActivityAdded }: ManualEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ActivityType>('positive');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Activity name is required');
      return;
    }

    let duration = 0;
    let start = new Date();
    let end = new Date();

    // Calculate duration based on input method
    if (hours) {
      duration = Math.round(parseFloat(hours) * 3600);
      start = new Date(Date.now() - duration * 1000);
      end = new Date();
    } else if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      duration = Math.round((endDate.getTime() - startDate.getTime()) / 1000);

      if (duration <= 0) {
        setError('End time must be after start time');
        return;
      }

      start = startDate;
      end = endDate;
    } else {
      setError('Please enter either hours or start/end times');
      return;
    }

    try {
      const activity: Activity = {
        name: name.trim(),
        type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration,
      };

      const saved = await saveActivityLocal(activity);
      onActivityAdded?.(saved);

      // Reset form
      setName('');
      setType('positive');
      setStartTime('');
      setEndTime('');
      setHours('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors shadow-sm"
      >
        {isOpen ? 'Close' : '+ Add Manual Entry'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <input
              type="text"
              placeholder="Activity name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 font-medium transition-all"
            />

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="type"
                  value="positive"
                  checked={type === 'positive'}
                  onChange={() => setType('positive')}
                  className="w-4 h-4"
                />
                <span className="text-emerald-600 font-medium text-sm">Productive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors">
                <input
                  type="radio"
                  name="type"
                  value="negative"
                  checked={type === 'negative'}
                  onChange={() => setType('negative')}
                  className="w-4 h-4 text-rose-500"
                />
                <span className="text-rose-600 font-medium text-sm">Distracting</span>
              </label>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-slate-500 font-medium text-sm mb-3">Duration</p>

              <div className="space-y-3">
                <input
                  type="number"
                  step="0.25"
                  placeholder="Hours (e.g., 1.5)"
                  value={hours}
                  onChange={e => {
                    setHours(e.target.value);
                    setStartTime('');
                    setEndTime('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 font-medium transition-all"
                />

                <p className="text-slate-500 text-xs text-center">OR</p>

                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
                    setHours('');
                  }}
                  placeholder="Start time"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 font-medium transition-all"
                />

                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  placeholder="End time"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            {error && <p className="text-rose-500 font-medium text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
