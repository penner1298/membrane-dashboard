"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, RefreshCw, Database, Terminal, ShieldAlert, 
  Search, Copy, Check, Info, AlertTriangle, FileCode, Server
} from "lucide-react";

interface LogEntry {
  id: number;
  created_at: string;
  endpoint: string;
  tokens: number;
  cost: number;
  wholesale_cost: number;
  status?: string;
}

interface DqlEntry {
  id: number;
  created_at: string;
  api_key_hash: string;
  inbound_prompt: string;
  requested_schema?: string;
  failed_output: string;
  error_message: string;
}

interface ConsoleClientProps {
  stats: {
    totalRetail: number;
    totalWholesale: number;
    margin: number;
    totalCalls: number;
    schemaRescues: number;
    thwartedAttacks: number;
  };
  recentLogs: LogEntry[];
  dlqLogs: DqlEntry[];
  apiKey: string;
  tenantId: string;
  dbStatus: string;
}

export function ConsoleClient({ 
  stats, 
  recentLogs, 
  dlqLogs, 
  apiKey, 
  tenantId, 
  dbStatus 
}: ConsoleClientProps) {
  const [activeTab, setActiveTab] = useState<"traffic" | "dlq" | "settings">("traffic");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [inspectingDlq, setInspectingDlq] = useState<DqlEntry | null>(null);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter logs based on search query
  const filteredLogs = recentLogs.filter(log => 
    log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.status && log.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDlq = dlqLogs.filter(dlq => 
    dlq.inbound_prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dlq.error_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* DB & Tenant Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active System Tenant</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-slate-900 text-lg">{tenantId}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              dbStatus === "Online" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              Postgres: {dbStatus}
            </span>
          </div>
        </div>

        {/* Dynamic Key Management */}
        <div className="w-full md:w-auto space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Authorization Key</label>
          <div className="flex gap-2">
            <div className="flex-1 md:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-600 truncate flex items-center justify-between">
              <span className="truncate select-all">{apiKey}</span>
              <button 
                onClick={handleCopyKey}
                className="ml-2 p-1 hover:bg-slate-200 rounded text-slate-500 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            <form action="/api/keys/reset" method="POST">
              <button 
                type="submit"
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rotate Key
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retail Value (30d)</p>
          <p className="text-3xl font-extrabold text-slate-900">${stats.totalRetail.toFixed(4)}</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wholesale Cost (30d)</p>
          <p className="text-3xl font-extrabold text-slate-900">${stats.totalWholesale.toFixed(4)}</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calculated Margin</p>
          <p className="text-3xl font-extrabold text-emerald-600">{stats.margin.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Proxy Requests</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.totalCalls.toLocaleString()}</p>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Tab buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("traffic")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "traffic"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              Traffic Ledger
            </button>
            
            <button
              onClick={() => setActiveTab("dlq")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "dlq"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              DLQ Auditor {dlqLogs.length > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "traffic" ? "endpoints" : "errors"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white w-full sm:w-64"
            />
          </div>
        </div>

        {/* TAB 1: TRAFFIC LEDGER */}
        {activeTab === "traffic" && (
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No recent transaction logs matching criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-650">
                <thead className="bg-slate-55 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px]">ID</th>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px]">Timestamp</th>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px]">Endpoint Node</th>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px] text-right">Tokens</th>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px] text-right">Retail Cost</th>
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px] text-right">Wholesale COGS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const isError = log.endpoint.includes("error") || (log.status && log.status.includes("error"));
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono text-slate-400">#{log.id}</td>
                        <td className="p-3 font-mono text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isError 
                              ? "bg-rose-50 text-rose-700 border border-rose-100" 
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {log.endpoint}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-right">{log.tokens}</td>
                        <td className="p-3 font-mono text-right text-rose-600">${Number(log.cost).toFixed(5)}</td>
                        <td className="p-3 font-mono text-right text-emerald-600">${Number(log.wholesale_cost).toFixed(5)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: DLQ AUDITOR */}
        {activeTab === "dlq" && (
          <div className="space-y-4">
            {filteredDlq.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active Dead Letter Queue entries found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* List Pane */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-[400px] overflow-y-auto bg-slate-50">
                  {filteredDlq.map((dlq) => (
                    <button
                      key={dlq.id}
                      onClick={() => setInspectingDlq(dlq)}
                      className={`w-full text-left p-4 hover:bg-slate-100 transition flex items-start gap-3 ${
                        inspectingDlq?.id === dlq.id ? "bg-white border-l-4 border-rose-500" : ""
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Log #{dlq.id}</span>
                          <span>{new Date(dlq.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{dlq.error_message}</p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">{dlq.inbound_prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Inspect Pane */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 flex flex-col justify-between min-h-[300px]">
                  {inspectingDlq ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <ShieldAlert className="w-4 h-4" /> DLQ Validation Exception
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">#{inspectingDlq.id}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inbound Prompt Context</h4>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[10.5px] text-slate-700 max-h-24 overflow-y-auto">
                            {inspectingDlq.inbound_prompt}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compiler Error Exception</h4>
                          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-2.5 rounded-lg font-mono text-[10.5px]">
                            {inspectingDlq.error_message}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Exception Generation</h4>
                          <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[10.5px] max-h-36 overflow-y-auto">
                            {inspectingDlq.failed_output}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100">
                        * Gateways intercept this payload inside state checks and safely throw HTTP 400 schemas.
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Info className="w-8 h-8 text-slate-350 mb-2" />
                      Select a DLQ log entry on the left to inspect its AST sandbox compiler outputs.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
