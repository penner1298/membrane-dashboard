"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartData {
  day: string;
  calls: number;
  cost: number;
  savings: number;
}

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
        <XAxis 
          dataKey="day" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
          itemStyle={{ color: '#cbd5e1' }}
        />
        <Area 
          type="monotone" 
          dataKey="savings" 
          stroke="#10b981" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorSavings)" 
        />
        <Area 
          type="monotone" 
          dataKey="cost" 
          stroke="#ef4444" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorCost)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

