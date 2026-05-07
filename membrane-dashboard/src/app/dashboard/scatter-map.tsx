"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, Cell } from "recharts";

export function VectorTopographyMap() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock clustering data to simulate the 768-D Vector HNSW embeddings
    const mockData = [];
    
    // Cluster 1: Simple extractions (Canary) - High density, low cost
    for (let i = 0; i < 60; i++) {
      mockData.push({ x: 20 + Math.random() * 30, y: 30 + Math.random() * 20, z: 10, type: 'Canary (Fast)', color: '#10b981' });
    }
    
    // Cluster 2: Heavy reasoning (Apex) - Dispersed, high cost
    for (let i = 0; i < 20; i++) {
      mockData.push({ x: 70 + Math.random() * 25, y: 70 + Math.random() * 25, z: 40, type: 'Apex (Deep)', color: '#f43f5e' });
    }

    // Cluster 3: Semantic Cache Hits - Tightly packed
    for (let i = 0; i < 35; i++) {
      mockData.push({ x: 10 + Math.random() * 15, y: 80 + Math.random() * 15, z: 5, type: 'Cache Hit (Zero Cost)', color: '#3b82f6' });
    }

    // Cluster 4: Bouncer Rejections / Jailbreaks
    for (let i = 0; i < 5; i++) {
      mockData.push({ x: 85 + Math.random() * 10, y: 15 + Math.random() * 10, z: 25, type: 'Bouncer Rejected (Jailbreak)', color: '#1e293b' });
    }

    setData(mockData);
  }, []);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="Semantic Variance" hide />
          <YAxis type="number" dataKey="y" name="Cognitive Density" hide />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Compute Load" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs">
                    <p className="font-bold text-slate-800 mb-1">{data.type}</p>
                    <p className="text-slate-500">Semantic Cluster X: {Math.round(data.x)}</p>
                    <p className="text-slate-500">Cognitive Load Y: {Math.round(data.y)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
