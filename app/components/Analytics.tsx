'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Clock, BarChart2, Flame } from 'lucide-react';
import { Activity } from '@/lib/types';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

interface AnalyticChartProps {
  activities: Activity[];
}

const COLORS = {
  positive: '#10b981', // emerald-500
  negative: '#f43f5e', // rose-500
  idle: '#f1f5f9',     // slate-100
};

export function DailyPieChart({ activities }: AnalyticChartProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const todaysActivities = [...activities].filter(a => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
    return start < tomorrow.getTime() && end > today.getTime();
  });

  // Build a true 24-hour radial chart mapping
  const segments = [];
  let lastEnd = 0; // seconds from 00:00 today

  todaysActivities
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .forEach((a, idx) => {
      const start = new Date(a.start_time).getTime();
      const end = a.end_time ? new Date(a.end_time).getTime() : start + (a.duration || 0) * 1000;
      
      const vs = Math.max(start, today.getTime());
      const ve = Math.min(end, tomorrow.getTime());

      const startSecs = (vs - today.getTime()) / 1000;
      const durSecs = (ve - vs) / 1000;

      if (startSecs > lastEnd) {
        segments.push({ name: `Idle-${idx}`, activityName: 'Idle', value: startSecs - lastEnd, type: 'idle' });
      }
      segments.push({ name: `Act-${idx}`, activityName: a.name, value: durSecs, type: a.type });
      lastEnd = startSecs + durSecs;
    });

  if (lastEnd < 86400) {
    segments.push({ name: 'Idle-End', activityName: 'Idle', value: 86400 - lastEnd, type: 'idle' });
  }

  // Format tooltip text
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.type === 'idle') return null;

      const mins = Math.round(data.value / 60);
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
          <p className="font-bold text-slate-800">{data.activityName}</p>
          <p className="text-slate-500 text-sm">{mins} mins</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" /> 24-Hour Timeline
        </h3>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">Today</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[350px] sm:min-h-[400px]">
        {/* Clock Marks (0, 3, 6, 9, 12, 15, 18, 21) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-[280px] max-h-[280px] sm:max-w-[320px] sm:max-h-[320px]">
            {/* Hour Labels */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 text-[10px] font-bold text-slate-400">00:00</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-6 text-[10px] font-bold text-slate-400">12:00</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 text-[10px] font-bold text-slate-400">18:00</span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 -mr-8 text-[10px] font-bold text-slate-400">06:00</span>
            
            {/* Added 3h markers */}
            <span className="absolute top-[14.6%] right-[14.6%] -mr-6 -mt-3 text-[10px] font-bold text-slate-300">03:00</span>
            <span className="absolute bottom-[14.6%] right-[14.6%] -mr-6 -mb-3 text-[10px] font-bold text-slate-300">09:00</span>
            <span className="absolute bottom-[14.6%] left-[14.6%] -ml-6 -mb-3 text-[10px] font-bold text-slate-300">15:00</span>
            <span className="absolute top-[14.6%] left-[14.6%] -ml-6 -mt-3 text-[10px] font-bold text-slate-300">21:00</span>

            {/* Tick marks for every hour */}
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className="absolute inset-0 flex justify-center pointer-events-none"
                style={{ transform: `rotate(${i * 15}deg)` }}
              >
                <div className={`w-0.5 mt-[-2px] ${i % 3 === 0 ? 'bg-slate-200 h-3' : 'bg-slate-100 h-2'}`}></div>
              </div>
            ))}

            {/* Subtle Circular Grid Lines */}
            <div className="absolute inset-0 border border-slate-100 rounded-full"></div>
            <div className="absolute inset-[15%] border border-slate-50 rounded-full opacity-50"></div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              startAngle={90} // start at top (00:00)
              endAngle={-270} // 360 degrees clockwise
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              {segments.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.type === 'positive' ? COLORS.positive : entry.type === 'negative' ? COLORS.negative : COLORS.idle}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white rounded-full w-24 h-24 sm:w-32 sm:h-32 shadow-inner border border-slate-50 flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">24H</p>
            <p className="text-sm font-black text-slate-800">Timeline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PeriodBarChart({ activities }: { activities: Activity[] }) {
  const [period, setPeriod] = React.useState<'weekly'|'monthly'>('weekly');
  const analytics = useAnalytics(activities);

  const today = new Date();
  const data = [];

  if (period === 'weekly') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;

      data.push({
        date: `${month}/${day}`,
        Productive: Math.round((analytics.byDate[localDateStr]?.positive || 0) * 10) / 10,
        Distracting: Math.round((analytics.byDate[localDateStr]?.negative || 0) * 10) / 10,
      });
    }
  } else {
    // Last 4 weeks (monthly)
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      let prod = 0;
      let dist = 0;
      
      for(let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        prod += analytics.byDate[localDateStr]?.positive || 0;
        dist += analytics.byDate[localDateStr]?.negative || 0;
      }
      
      data.push({
        date: `W${4-i}`,
        Productive: Math.round(prod * 10) / 10,
        Distracting: Math.round(dist * 10) / 10,
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-500" /> Breakdown
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Monthly
          </button>
        </div>
      </div>
      
      {data.every(d => d.Productive === 0 && d.Distracting === 0) ? (
        <div className="flex items-center justify-center h-48 sm:h-64 text-slate-400">
          No data yet
        </div>
      ) : (
        <div className="flex-1 min-h-[250px] sm:min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: any) => [`${value}h`, '']}
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#1e293b'
              }}
              labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="Productive" fill={COLORS.positive} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Distracting" fill={COLORS.negative} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function ActivityBreakdown({ activities }: { activities: Activity[] }) {
  const analytics = useAnalytics(activities);

  const positiveList = Object.entries(analytics.positiveActivities).map(
    ([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      type: 'positive' as const,
    })
  );

  const negativeList = Object.entries(analytics.negativeActivities).map(
    ([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      type: 'negative' as const,
    })
  );

  const allActivities = [...positiveList, ...negativeList].sort(
    (a, b) => b.hours - a.hours
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 flex-shrink-0">
        <Flame className="w-5 h-5 text-rose-500" /> Top Activities
      </h3>
      {allActivities.length === 0 ? (
        <p className="text-slate-400">No activities logged yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {allActivities.map((activity, idx) => (
            <div 
              key={idx} 
              className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                  {activity.name}
                </span>
              </div>
              <span className="text-slate-600 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                {activity.hours}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
