"use client";

import React from "react";
import { Sparkles, DollarSign, ArrowRight, Award } from "lucide-react";

interface ValueReceiptProps {
  actualCost: number;
  unoptimizedCost: number;
  savingsPercent: number;
  chunkCount: number;
  model: string;
  taskId: string;
  timestamp?: string;
}

export function ValueReceipt({
  actualCost,
  unoptimizedCost,
  savingsPercent,
  chunkCount,
  model,
  taskId,
  timestamp
}: ValueReceiptProps) {
  const activeDate = timestamp ? new Date(timestamp) : new Date();
  
  // Calculate heights or widths for the visual bar chart comparison
  const maxVal = Math.max(unoptimizedCost, 0.0001);
  const actualRatio = Math.min((actualCost / maxVal) * 100, 100);
  const unoptimizedRatio = 100;
  
  return (
    <div className="w-full max-w-sm mx-auto bg-[#fafaf9] border border-stone-200 p-6 shadow-xl relative overflow-hidden select-none text-stone-800 font-mono text-xs animate-in slide-in-from-bottom duration-500 shadow-stone-900/10">
      
      {/* Tear Line Top Decoration */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#f8fafc_33.333%,#f8fafc_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#f8fafc_33.333%,#f8fafc_66.667%,transparent_66.667%)] bg-[length:12px_6px] bg-repeat-x z-20" />

      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h3 className="text-base font-black tracking-tight text-stone-950 uppercase">MEMBRANE GUARD</h3>
        <p className="text-[9px] text-stone-500 uppercase tracking-widest">TRANSACTION LEDGER RECEIPT</p>
      </div>

      <div className="border-b border-dashed border-stone-300 my-4" />

      {/* Meta Specs */}
      <div className="space-y-1.5 text-[10px] text-stone-600">
        <div className="flex justify-between">
          <span>TXID:</span>
          <span className="font-bold text-stone-900 truncate max-w-[200px]">{taskId}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span className="font-bold text-stone-900">{activeDate.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>MODEL:</span>
          <span className="font-bold text-stone-900">{model}</span>
        </div>
        <div className="flex justify-between">
          <span>WORKLOAD:</span>
          <span className="font-bold text-stone-900">SWARM MAP-REDUCE ({chunkCount} CHUNKS)</span>
        </div>
      </div>

      <div className="border-b border-dashed border-stone-300 my-4" />

      {/* Line Items */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-stone-500">UNOPTIMIZED RUN COST:</span>
          <span className="font-bold text-stone-650">${unoptimizedCost.toFixed(5)}</span>
        </div>
        
        <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            ACTUAL INCURRED COST:
          </span>
          <span className="text-stone-950">${actualCost.toFixed(5)}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-stone-300 my-4" />

      {/* ROI Graphical Bar */}
      <div className="space-y-2 pt-1 pb-2">
        <span className="text-[9px] text-stone-400 uppercase tracking-wider block">Relative COGS Comparison</span>
        
        {/* Unoptimized cogs bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-stone-500 font-semibold">
            <span>Unoptimized Raw Nodes</span>
            <span>${unoptimizedCost.toFixed(5)}</span>
          </div>
          <div className="w-full h-3 bg-stone-200 rounded-sm overflow-hidden">
            <div className="h-full bg-stone-400/50" style={{ width: `${unoptimizedRatio}%` }} />
          </div>
        </div>

        {/* Optimized cogs bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-emerald-700 font-bold">
            <span className="flex items-center gap-0.5">Membrane Gateway Caching</span>
            <span>${actualCost.toFixed(5)}</span>
          </div>
          <div className="w-full h-3 bg-stone-200 rounded-sm overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${actualRatio}%` }} />
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-stone-300 my-4" />

      {/* Savings Summary Banner */}
      <div className="bg-emerald-600 text-white p-3 rounded-xl text-center space-y-1 shadow-sm relative overflow-hidden">
        {/* Decorative badge glow */}
        <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-white/10 blur-xl" />
        
        <p className="text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Award className="w-4 h-4" />
          NET ENTERPRISE SAVINGS
        </p>
        <p className="text-2xl font-black tracking-tight">{savingsPercent.toFixed(1)}% SAVED</p>
        <p className="text-[9px] font-serif italic opacity-90">Semantic vector caching hit rate target met.</p>
      </div>

      {/* Receipt Footer Barcode */}
      <div className="text-center pt-5 pb-2 space-y-2">
        {/* CSS/SVG Barcode */}
        <div className="inline-flex flex-col items-center gap-1">
          <svg className="w-48 h-8 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
            <g fill="currentColor">
              {/* Generate a mock barcode sequence */}
              <rect x="0" y="0" width="1.5" height="20" />
              <rect x="3" y="0" width="0.5" height="20" />
              <rect x="5" y="0" width="2" height="20" />
              <rect x="9" y="0" width="1" height="20" />
              <rect x="11" y="0" width="3" height="20" />
              <rect x="15" y="0" width="0.5" height="20" />
              <rect x="17" y="0" width="1.5" height="20" />
              <rect x="20" y="0" width="2.5" height="20" />
              <rect x="24" y="0" width="0.5" height="20" />
              <rect x="26" y="0" width="2" height="20" />
              <rect x="29" y="0" width="1" height="20" />
              <rect x="31" y="0" width="3" height="20" />
              <rect x="35" y="0" width="0.5" height="20" />
              <rect x="37" y="0" width="1.5" height="20" />
              <rect x="40" y="0" width="2.5" height="20" />
              <rect x="44" y="0" width="0.5" height="20" />
              <rect x="46" y="0" width="2" height="20" />
              <rect x="49" y="0" width="1" height="20" />
              <rect x="51" y="0" width="3" height="20" />
              <rect x="55" y="0" width="0.5" height="20" />
              <rect x="57" y="0" width="1.5" height="20" />
              <rect x="60" y="0" width="2.5" height="20" />
              <rect x="64" y="0" width="0.5" height="20" />
              <rect x="66" y="0" width="2" height="20" />
              <rect x="69" y="0" width="1" height="20" />
              <rect x="71" y="0" width="3" height="20" />
              <rect x="75" y="0" width="0.5" height="20" />
              <rect x="77" y="0" width="1.5" height="20" />
              <rect x="80" y="0" width="2.5" height="20" />
              <rect x="84" y="0" width="0.5" height="20" />
              <rect x="86" y="0" width="2" height="20" />
              <rect x="89" y="0" width="1" height="20" />
              <rect x="91" y="0" width="3" height="20" />
              <rect x="95" y="0" width="0.5" height="20" />
              <rect x="97" y="0" width="3.0" height="20" />
            </g>
          </svg>
          <span className="text-[8px] text-stone-400 tracking-widest font-mono select-all">*{taskId.slice(0, 10).toUpperCase()}*</span>
        </div>
        <p className="text-[8px] text-stone-400">THANK YOU FOR RUNNING MEMBRANE SCALERS</p>
      </div>

      {/* Tear Line Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#f8fafc_33.333%,#f8fafc_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#f8fafc_33.333%,#f8fafc_66.667%,transparent_66.667%)] bg-[length:12px_6px] bg-repeat-x z-20" style={{ transform: "rotate(180deg)" }} />

    </div>
  );
}
