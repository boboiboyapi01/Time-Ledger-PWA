'use client';

import { useState, useCallback, useEffect } from 'react';
import { Activity, AnalyticsData } from '@/lib/types';

export function useAnalytics(activities: Activity[]) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPositive: 0,
    totalNegative: 0,
    positiveActivities: {},
    negativeActivities: {},
    byDate: {},
  });

  useEffect(() => {
    calculateAnalytics(activities);
  }, [activities]);

  const calculateAnalytics = useCallback((data: Activity[]) => {
    const result: AnalyticsData = {
      totalPositive: 0,
      totalNegative: 0,
      positiveActivities: {},
      negativeActivities: {},
      byDate: {},
    };

    data.forEach(activity => {
      if (!activity.end_time || !activity.duration) return;

      let currentStart = new Date(activity.start_time).getTime();
      const finalEnd = activity.end_time ? new Date(activity.end_time).getTime() : currentStart + (activity.duration || 0) * 1000;

      if (currentStart >= finalEnd) return;

      while (currentStart < finalEnd) {
        const currentDateObj = new Date(currentStart);
        
        // Local date string YYYY-MM-DD
        const year = currentDateObj.getFullYear();
        const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(currentDateObj.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;

        // Next day in local time
        const nextDayObj = new Date(year, currentDateObj.getMonth(), currentDateObj.getDate() + 1);
        
        const endOfChunk = Math.min(finalEnd, nextDayObj.getTime());
        const chunkDurationHours = (endOfChunk - currentStart) / 3600000;

        // Total time
        if (activity.type === 'positive') {
          result.totalPositive += chunkDurationHours;
        } else {
          result.totalNegative += chunkDurationHours;
        }

        // By activity name
        if (activity.type === 'positive') {
          result.positiveActivities[activity.name] = (result.positiveActivities[activity.name] || 0) + chunkDurationHours;
        } else {
          result.negativeActivities[activity.name] = (result.negativeActivities[activity.name] || 0) + chunkDurationHours;
        }

        // By date
        if (!result.byDate[localDateStr]) {
          result.byDate[localDateStr] = { positive: 0, negative: 0 };
        }
        if (activity.type === 'positive') {
          result.byDate[localDateStr].positive += chunkDurationHours;
        } else {
          result.byDate[localDateStr].negative += chunkDurationHours;
        }

        currentStart = endOfChunk;
      }
    });

    setAnalytics(result);
  }, []);

  return analytics;
}
