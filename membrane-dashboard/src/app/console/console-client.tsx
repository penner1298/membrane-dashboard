"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, RefreshCw, Database, Terminal, ShieldAlert, 
  Search, Copy, Check, Info, AlertTriangle, FileCode, Server,
  LineChart, TrendingDown, Layers, Zap, Ban, Activity
} from "lucide-react";
import { useApiKey } from "@/context/ApiKeyContext";

interface LogEntry {
  id: number;
  created_at: string;
  endpoint: string;
  tokens: number;
  workload_profile?: string;
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
    cacheHits: number;
    totalChunks: number;
    totalCalls: number;
    schemaRescues: number;
    thwartedAttacks: number;
    isProductionLicense: boolean;
  };
  recentLogs: LogEntry[];
  dlqLogs: DqlEntry[];
  apiKey: string;
  tenantId: string;
  dbStatus: string;
  experimentStats: {
    legacy: any;
    early_gate: any;
    canary: any;
  };
}

export function ConsoleClient({ 
  stats, 
  recentLogs, 
  dlqLogs, 
  apiKey, 
  tenantId, 
  dbStatus,
  experimentStats
}: ConsoleClientProps) {
  const [activeTab, setActiveTab] = useState<"experiments" | "traffic" | "dlq" | "settings">("experiments");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [inspectingDlq, setInspectingDlq] = useState<DqlEntry | null>(null);

  // Consume unified API Key context
  const { apiKey: currentApiKey, tenantId: currentTenantId, updateApiKey } = useApiKey();

  const [rotating, setRotating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateKey = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmRotateKey = async () => {
    setShowConfirmModal(false);
    setRotating(true);
    try {
      const res = await fetch("/api/keys/reset", {
        method: "POST",
        headers: {
          "Accept": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          await updateApiKey(data.apiKey);
        }
      }
    } catch (err) {
      console.error("Failed to rotate key asynchronously:", err);
    } finally {
      setRotating(false);
    }
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
            <span className="font-mono font-black text-slate-900 text-lg">{currentTenantId}</span>
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
              <span className="truncate select-all">{currentApiKey}</span>
              <button 
                onClick={handleCopyKey}
                className="ml-2 p-1 hover:bg-slate-200 rounded text-slate-500 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            <button 
              onClick={handleRotateKey}
              disabled={rotating}
              className={`px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm ${
                rotating ? "animate-pulse opacity-50" : ""
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotating ? "animate-spin" : ""}`} /> Rotate Key
            </button>
          </div>
        </div>
      </div>

      {dbStatus !== "Online" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-850 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">Database Offline (Running Mock Fallback)</p>
            <p className="mt-1 leading-relaxed">
              Membrane Guard is currently running in stateless mock telemetry mode. To connect a live database for persistent audit logs, vector L2 caching, and tenant balance tracking:
            </p>
            <ol className="list-decimal list-inside mt-1.5 space-y-1 font-mono text-[10.5px]">
              <li>Ensure PostgreSQL is running locally or provisioned in the cloud.</li>
              <li>Install the <code className="bg-amber-100/50 px-1 rounded border border-amber-200/50">pgvector</code> extension in your database.</li>
              <li>Set the <code className="bg-amber-100/50 px-1 rounded border border-amber-200/50">DATABASE_URL</code> environment variable (e.g., <code className="bg-amber-100/50 px-1 rounded border border-amber-200/50">postgres://user:pass@host:5432/dbname</code>).</li>
              <li>Restart the Membrane gateway server (<code className="bg-amber-100/50 px-1 rounded border border-amber-200/50">python3 server.py</code>).</li>
            </ol>
          </div>
        </div>
      )}

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License Status</p>
          <p className={`text-base font-extrabold ${stats.isProductionLicense ? "text-emerald-600" : "text-slate-700"}`}>
            {stats.isProductionLicense ? "Commercial Production" : "Free for Local Dev"}
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cache Hit Rate (30d)</p>
          <p className="text-3xl font-extrabold text-slate-900">
            {stats.totalCalls > 0 
              ? `${((stats.cacheHits / stats.totalCalls) * 100).toFixed(1)}%` 
              : "0.0%"}
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Swarm Chunks (30d)</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.totalChunks.toLocaleString()}</p>
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
              onClick={() => setActiveTab("experiments")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "experiments"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              Early Rejection Experiments
            </button>

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

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              Settings
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

        {/* TAB: EXPERIMENTS */}
        {activeTab === "experiments" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header intro */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <LineChart className="w-4 h-4 text-emerald-600 animate-pulse" />
                Active Early-Rejection Swarm Experiments
              </div>
              <p>
                To protect context windows and reduce LLM execution costs, Membrane runs side-by-side experiments comparing two early rejection strategies against legacy parallel execution. The goal is to eliminate token spend and concurrency pressure on requests that ultimately fail or produce low-value outcomes.
              </p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEGACY CONTROL CARD */}
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">Control Group</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Uncontrolled Waste
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Legacy Execution</h3>
                    <p className="text-[11px] text-slate-400">Fan-out all chunks in parallel immediately.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-3 space-y-3 text-xs">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Total Swarms Processed:</span>
                    <span className="font-mono font-bold text-slate-900">{experimentStats.legacy.total_requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Wasted Token Spend:</span>
                    <span className="font-mono font-bold text-rose-600 flex items-center gap-1">
                      {((experimentStats.legacy.waste_tokens / experimentStats.legacy.total_tokens) * 100).toFixed(1)}% 
                      <span className="text-slate-400">({(experimentStats.legacy.waste_tokens / 1000).toFixed(0)}k)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Peak Concurrency:</span>
                    <span className="font-mono font-bold text-slate-900">{experimentStats.legacy.max_concurrency} in-flight Chunks</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">p99 Latency (Valid):</span>
                    <span className="font-mono font-bold text-slate-900">{experimentStats.legacy.p99_latency} ms</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Profile</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Legacy mode processes all slices in parallel. Malformed metadata criteria or system guideline violations run through models for all chunks before failing, causing massive token waste.
                  </p>
                </div>
              </div>

              {/* EXPERIMENT 1 CARD */}
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">Experiment 1</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Early Validation
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Pre-Fan-Out Gate</h3>
                    <p className="text-[11px] text-slate-400">Strict structural & semantic criteria validation.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-3 space-y-3 text-xs">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Gate Rejection Rate:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {experimentStats.early_gate.total_requests > 0 
                        ? `${((experimentStats.early_gate.rejected_requests / experimentStats.early_gate.total_requests) * 100).toFixed(1)}%` 
                        : "0.0%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Wasted Token Spend:</span>
                    <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                      {experimentStats.early_gate.total_tokens > 0 
                        ? `${((experimentStats.early_gate.waste_tokens / experimentStats.early_gate.total_tokens) * 100).toFixed(1)}%` 
                        : "0.0%"}
                      <span className="text-slate-400">({(experimentStats.early_gate.waste_tokens / 1000).toFixed(0)}k)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Peak Concurrency:</span>
                    <span className="font-mono font-bold text-slate-950 flex items-center gap-1">
                      {experimentStats.early_gate.max_concurrency} Chunks 
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">-{100 - Math.round(experimentStats.early_gate.max_concurrency/experimentStats.legacy.max_concurrency*100)}%</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">p99 Latency (Valid):</span>
                    <span className="font-mono font-bold text-slate-950 flex items-center gap-1">
                      {experimentStats.early_gate.p99_latency} ms 
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded">+{((experimentStats.early_gate.p99_latency - experimentStats.legacy.p99_latency)/experimentStats.legacy.p99_latency*100).toFixed(1)}%</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Profile</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Stops malformed requests (empty chunks, overly large structures, type mismatch, wrong keys) at the gate before any parallel task scheduler or LLM calls are spawned.
                  </p>
                </div>
              </div>

              {/* EXPERIMENT 2 CARD */}
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none" />
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">Experiment 2</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Sentinel Canary
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">Canary Sentinel Probe</h3>
                    <p className="text-[11px] text-slate-400">Process chunk 0 synchronously before fanning out.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-3 space-y-3 text-xs">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Sentinel Rejections:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {experimentStats.canary.total_requests > 0 
                        ? `${((experimentStats.canary.rejected_requests / experimentStats.canary.total_requests) * 100).toFixed(1)}%` 
                        : "0.0%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Wasted Token Spend:</span>
                    <span className="font-mono font-bold text-violet-600 flex items-center gap-1">
                      {experimentStats.canary.total_tokens > 0 
                        ? `${((experimentStats.canary.waste_tokens / experimentStats.canary.total_tokens) * 100).toFixed(1)}%` 
                        : "0.0%"}
                      <span className="text-slate-400">({(experimentStats.canary.waste_tokens / 1000).toFixed(0)}k)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Avg Concurrency:</span>
                    <span className="font-mono font-bold text-slate-950 flex items-center gap-1">
                      {experimentStats.canary.avg_concurrency} Chunks 
                      <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-1 rounded">-{100 - Math.round(parseFloat(experimentStats.canary.avg_concurrency)/parseFloat(experimentStats.legacy.avg_concurrency)*100)}%</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">p99 Latency (Valid):</span>
                    <span className="font-mono font-bold text-slate-950 flex items-center gap-1">
                      {experimentStats.canary.p99_latency} ms 
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded">+{((experimentStats.canary.p99_latency - experimentStats.legacy.p99_latency)/experimentStats.legacy.p99_latency*100).toFixed(1)}%</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Profile</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Identifies runtime and semantic schema failures (prompt refusals, model rate limits, structural schema drifts) at a 1/N cost step before spawning other chunks.
                  </p>
                </div>
              </div>

            </div>

            {/* Comparative Charts Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Token Waste Chart */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    Wasted Token Spend Comparison (lower is better)
                  </h4>
                  <p className="text-[11px] text-slate-400">Total tokens spent on requests that ultimately failed or were rejected.</p>
                </div>
                
                <div className="space-y-4 pt-2">
                  {/* Legacy bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Legacy Parallel (Control)</span>
                      <span className="font-mono text-rose-600 font-bold">{experimentStats.legacy.waste_tokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: "100%" }} />
                    </div>
                  </div>
                  
                  {/* Early Gate bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Pre-Fan-Out Structural Gate</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {experimentStats.early_gate.waste_tokens.toLocaleString()} tokens 
                        <span className="text-slate-400 font-normal"> (-{(((experimentStats.legacy.waste_tokens - experimentStats.early_gate.waste_tokens) / experimentStats.legacy.waste_tokens) * 100 || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ 
                        width: experimentStats.legacy.waste_tokens > 0 
                          ? `${(experimentStats.early_gate.waste_tokens / experimentStats.legacy.waste_tokens * 100)}%` 
                          : "0%" 
                      }} />
                    </div>
                  </div>

                  {/* Canary Probe bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Canary Sentinel Probe</span>
                      <span className="font-mono text-violet-600 font-bold">
                        {experimentStats.canary.waste_tokens.toLocaleString()} tokens 
                        <span className="text-slate-400 font-normal"> (-{(((experimentStats.legacy.waste_tokens - experimentStats.canary.waste_tokens) / experimentStats.legacy.waste_tokens) * 100 || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full transition-all duration-1000" style={{ 
                        width: experimentStats.legacy.waste_tokens > 0 
                          ? `${(experimentStats.canary.waste_tokens / experimentStats.legacy.waste_tokens * 100)}%` 
                          : "0%" 
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Latency and Concurrency tradeoff chart */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-violet-600" />
                    Latency Penalty vs Concurrency Pressure Tradeoff
                  </h4>
                  <p className="text-[11px] text-slate-400">Comparing latency overhead of the canary serialized step with concurrency load.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Canary Latency overhead</span>
                    <p className="text-2xl font-black text-slate-900">
                      {experimentStats.legacy.p99_latency > 0 
                        ? `+${((experimentStats.canary.p99_latency - experimentStats.legacy.p99_latency) / experimentStats.legacy.p99_latency * 100).toFixed(1)}%` 
                        : "0%"}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      p99 delay introduced by executing chunk 0 serially before fan-out. Target is &lt; 12-15%.
                    </p>
                  </div>

                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Concurrency Pressure Reduction</span>
                    <p className="text-2xl font-black text-emerald-600">
                      {experimentStats.legacy.avg_concurrency > 0 
                        ? `-${(100 - parseFloat(experimentStats.canary.avg_concurrency) / parseFloat(experimentStats.legacy.avg_concurrency) * 100).toFixed(1)}%` 
                        : "0%"}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Reduction in average concurrent LLM calls by preventing fan-out of malformed requests.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

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
                    <th className="p-3 font-mono font-bold uppercase tracking-wider text-[10px] text-right">Routing Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const isError = log.endpoint.includes("error") || (log.status && log.status.includes("error"));
                    
                    // Determine routing strategy
                    let routingMode = "Model Routed";
                    let routingBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                    
                    if (isError) {
                      routingMode = "Error Intercepted";
                      routingBadgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                    } else if (log.endpoint.includes("L1_MEMORY_CACHE")) {
                      routingMode = "L1 Cache Hit";
                      routingBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (log.endpoint.includes("SEMANTIC_CACHE")) {
                      routingMode = "Semantic Cache Hit";
                      routingBadgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (log.workload_profile === "swarm_map" || log.workload_profile?.startsWith("swarm_map")) {
                      routingMode = log.swarm_mode ? `Swarm Map (${log.swarm_mode})` : "Parallel Swarm Map";
                      if (log.workload_profile === "swarm_map_gate_rejection" || log.rejected_at_gate) {
                        routingMode = "Swarm Gate Rejected";
                        routingBadgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                      } else if (log.workload_profile === "swarm_map_canary_failure") {
                        routingMode = "Swarm Canary Failure";
                        routingBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                      } else if (log.died) {
                        routingMode = `Swarm Map (${log.swarm_mode || 'legacy'}) - Died`;
                        routingBadgeStyle = "bg-rose-50 text-rose-750 border-rose-150";
                      } else {
                        routingBadgeStyle = "bg-violet-50 text-violet-700 border-violet-200";
                      }
                    } else if (log.workload_profile === "verification" || log.endpoint.includes("swarm/state")) {
                      routingMode = "Schema Rescue / AST";
                      routingBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                    } else if (log.workload_profile === "chat") {
                      routingMode = "Model Proxy";
                      routingBadgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                    }

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
                        <td className="p-3 font-mono text-right">{log.tokens || 0}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${routingBadgeStyle}`}>
                            {routingMode}
                          </span>
                        </td>
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

        {/* TAB 3: SETTINGS / LICENSING */}
        {activeTab === "settings" && (
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-850">License Declaration</h3>
              <p className="text-xs text-slate-500">
                Membrane operates on a permissive, honor-based model. Local development is completely free and unrestricted. Commercial production deployments require a paid license declaration.
              </p>
            </div>
            
            <div className="p-4 bg-slate-55 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">License Status:</span>
                <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] border ${
                  stats.isProductionLicense
                    ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {stats.isProductionLicense ? "Commercial Production" : "Free for Local Dev"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-6 mt-6 space-y-4 max-w-md">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  Production Scaling Guide
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Currently running in {stats.isProductionLicense ? "Commercial Production" : "Free for Local Dev"} mode. To manage or declare production scaling settings:
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-xl space-y-3">
                <div className="text-[11px] text-emerald-850 space-y-2 leading-relaxed">
                  <p>
                    1. Acquire an official commercial license on the <a href="https://buy.polar.sh/polar_cl_yDHzavhCzMw8FkCp0t0X2NJNfg5xgqLmudIxZ0S54BZ" target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-700 hover:text-emerald-800">Polar.sh License Tiers</a> for $29/month.
                  </p>
                  <p>
                    2. Inject the key into your environments as the <code className="bg-emerald-105 px-1 rounded font-mono text-[10px]">MEMBRANE_LICENSE_KEY</code> variable.
                  </p>
                  <p>
                    3. Connect a distributed cache using the <code className="bg-emerald-105 px-1 rounded font-mono text-[10px]">REDIS_URL</code> environment variable to unlock edge Redis setups.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/90 border border-slate-200/85 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 relative transform scale-100 transition-all duration-300 shadow-emerald-500/5 select-none text-slate-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Rotate Gateway Key?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Warning: Rotating this credential will immediately deprecate active integrations. Old pipelines will have a 5-minute sliding grace period to transition before requests are blocked.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-650 transition active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={confirmRotateKey}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-[0.98] shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Confirm Rotation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
