'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from '@/lib/types';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface DailyTimelineProps {
  activities: Activity[];
}

export function DailyTimeline({ activities }: DailyTimelineProps) {
  // Filter for today's activities only
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today.getTime() + 86400000);

  const todaysActivities = activities.filter(a => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
    
    // Activity overlaps with today if it starts before tomorrow AND ends after today starts
    return start < tomorrow.getTime() && end > today.getTime();
  });

  // Calculate totals (clamped to today's hours only)
  const calculateClampedDuration = (a: Activity) => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
    const visibleStart = Math.max(start, today.getTime());
    const visibleEnd = Math.min(end, tomorrow.getTime());
    return Math.max(0, (visibleEnd - visibleStart) / 1000);
  };

  const totalPositiveSecs = todaysActivities
    .filter(a => a.type === 'positive')
    .reduce((sum, a) => sum + calculateClampedDuration(a), 0);
  const totalNegativeSecs = todaysActivities
    .filter(a => a.type === 'negative')
    .reduce((sum, a) => sum + calculateClampedDuration(a), 0);

  const formatHours = (secs: number) => (secs / 3600).toFixed(1);

  // Render 24 hour blocks (0 to 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800/60 shadow-xl"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-cyan-400">⏱️</span> 24-Hour Timeline
          </h3>
          <p className="text-sm text-slate-400 mt-1">Today's activity breakdown</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-emerald-400 font-medium">Productive: {formatHours(totalPositiveSecs)}h</p>
          <p className="text-rose-400 font-medium">Distracting: {formatHours(totalNegativeSecs)}h</p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative mt-8">
        {/* Helper text for 24h format */}
        <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-slate-500 font-medium">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:59</span>
        </div>

        <div className="h-10 w-full bg-slate-900/50 rounded-lg border border-slate-800 flex overflow-hidden relative">
          {/* We will render all activities absolutely positioned based on clamped start and clamped duration relative to the 24 hours */}
          {todaysActivities.map((activity, idx) => {
            const start = new Date(activity.start_time).getTime();
            const end = activity.end_time ? new Date(activity.end_time).getTime() : start + (activity.duration || 0) * 1000;
            
            // Clamp to today's boundaries for visual rendering
            const visibleStart = Math.max(start, today.getTime());
            const visibleEnd = Math.min(end, tomorrow.getTime());
            
            const startSecondsInDay = (visibleStart - today.getTime()) / 1000;
            const visibleDurationSecs = (visibleEnd - visibleStart) / 1000;

            const leftPercent = (startSecondsInDay / 86400) * 100;
            const widthPercent = (visibleDurationSecs / 86400) * 100;

            const isPositive = activity.type === 'positive';

            return (
              <div
                key={activity.id || idx}
                data-tooltip-id={`timeline-tooltip-${idx}`}
                className={`absolute top-0 bottom-0 ${
                  isPositive 
                    ? 'bg-emerald-500/80 hover:bg-emerald-400 border-x border-emerald-600' 
                    : 'bg-rose-500/80 hover:bg-rose-400 border-x border-rose-600'
                } transition-colors cursor-pointer rounded-sm`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${Math.max(widthPercent, 0.5)}%`, // Ensure tiny activities are visible
                }}
              />
            );
          })}
        </div>

        {todaysActivities.map((activity, idx) => {
          const actStart = new Date(activity.start_time);
          const actEnd = activity.end_time ? new Date(activity.end_time) : new Date(actStart.getTime() + (activity.duration || 0) * 1000);
          const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const durationMins = Math.round((actEnd.getTime() - actStart.getTime()) / 60000);
          
          return (
             <ReactTooltip
                key={`tooltip-${idx}`}
                id={`timeline-tooltip-${idx}`}
                place="top"
                className="z-50 !bg-slate-800 !text-slate-200 !rounded-lg !border !border-slate-700"
             >
                <div className="text-sm">
                  <p className="font-bold">{activity.name}</p>
                  <p className="text-xs text-slate-400">{formatTime(actStart)} - {formatTime(actEnd)}</p>
                  {actStart.getTime() < today.getTime() && (
                    <p className="text-xs text-amber-400 mt-0.5">Started yesterday</p>
                  )}
                  <p className="text-xs mt-1">
                    {durationMins} mins
                  </p>
                </div>
             </ReactTooltip>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" /> Productive Block
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" /> Distracting Block
        </div>
      </div>
    </motion.div>
  );
}
