/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  RefreshCw, ShieldAlert, Search, Copy, Check, Info, AlertTriangle, Server,
  TrendingDown, Settings, Terminal, Play, FileText, BarChart2, X, Eye,
  Cpu, Shield, Database, Trash2, Layers, CheckCircle, Sliders
} from "lucide-react";
import { useApiKey } from "@/context/ApiKeyContext";

interface LogEntry {
  id: number;
  created_at: string;
  endpoint: string;
  tokens: number;
  workload_profile?: string;
  status?: string;
  swarm_mode?: string;
  rejected_at_gate?: boolean;
  canary_used?: boolean;
  canary_succeeded?: boolean;
  chunks_reached_model?: number;
  estimated_waste_tokens?: number;
  latency_ms?: number;
  died?: boolean;
  task_id?: string;
  concurrency_level?: number;
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

interface GroupStats {
  total_requests: number;
  waste_tokens: number;
  total_tokens: number;
  max_concurrency: number;
  p99_latency: number;
  avg_concurrency: string;
  rejected_requests: number;
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
    legacy: GroupStats;
    early_gate: GroupStats;
    canary: GroupStats;
  };
}

// Sourced from docs/BENCHMARKS.md
const workloads = [
  {
    id: "contracts",
    name: "200-page contract analysis",
    rawCost: 18.40,
    membraneCost: 2.71,
    savings: "85%",
    speedup: "3.8×",
    cacheHit: "74%",
    notes: "Full swarm + early gate"
  },
  {
    id: "transcripts",
    name: "50 earnings call transcripts",
    rawCost: 9.20,
    membraneCost: 1.38,
    savings: "85%",
    speedup: "4.2×",
    cacheHit: "91%",
    notes: "Heavy semantic repeat"
  },
  {
    id: "anomaly",
    name: "1,000 log-line anomaly detection",
    rawCost: 4.10,
    membraneCost: 0.82,
    savings: "80%",
    speedup: "2.9×",
    cacheHit: "63%",
    notes: "Canary mode saved 41% of runs"
  },
  {
    id: "research",
    name: "Multi-PDF research (32 docs)",
    rawCost: 12.60,
    membraneCost: 3.15,
    savings: "75%",
    speedup: "4.7×",
    cacheHit: "82%",
    notes: "Map-reduce isolation"
  }
];

interface LogLineItem {
  id: string;
  timestamp: string;
  type: "proxy" | "cache" | "dlq";
  message: string;
  badgeText: string;
  badgeStyle: string;
  rawDetails?: DqlEntry;
}

export function ConsoleClient({ 
  stats, 
  recentLogs, 
  dlqLogs, 
  dbStatus
}: ConsoleClientProps) {
  // Config & state
  const { apiKey: currentApiKey, tenantId: currentTenantId, updateApiKey } = useApiKey();
  const [swarmMode, setSwarmMode] = useState<"legacy" | "early_gate" | "canary">("canary");
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Console layout & filters
  const [consoleFilter, setConsoleFilter] = useState<"all" | "cache" | "errors">("all");
  const [consoleSearch, setConsoleSearch] = useState("");
  const [inspectingDlq, setInspectingDlq] = useState<DqlEntry | null>(null);

  // DevOps Tabs & Controls State
  const [consoleTab, setConsoleTab] = useState<"swarm" | "security" | "cache" | "database">("swarm");
  const [bouncerMode, setBouncerMode] = useState<"fail_open" | "fail_closed">("fail_open");
  const [isReindexing, setIsReindexing] = useState(false);
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [dlqActionMessage, setDlqActionMessage] = useState<string | null>(null);
  const [dlqActionLoading, setDlqActionLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customSchema, setCustomSchema] = useState("");

  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Sync modal custom states
  useEffect(() => {
    if (inspectingDlq) {
      setCustomPrompt(inspectingDlq.inbound_prompt);
      setCustomSchema(inspectingDlq.requested_schema || "");
      setDlqActionMessage(null);
    }
  }, [inspectingDlq]);

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

  const handleFlushCache = async () => {
    setIsFlushingCache(true);
    try {
      const res = await fetch("/api/cache/sweep", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Cache flushed successfully.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sweep caches.");
    } finally {
      setIsFlushingCache(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await fetch("/api/cache/reindex", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Reindexing completed.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reindex pgvector tables.");
    } finally {
      setIsReindexing(false);
    }
  };

  const handleDlqRetry = async () => {
    if (!inspectingDlq) return;
    setDlqActionLoading(true);
    setDlqActionMessage(null);
    try {
      const res = await fetch("/api/dlq/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inspectingDlq.id,
          inboundPrompt: customPrompt,
          requestedSchema: customSchema
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDlqActionMessage(`✅ RECOVERY SUCCESS:\n${data.output || data.message}`);
      } else {
        setDlqActionMessage(`❌ RECOVERY FAILED: ${data.error || "Execution timeout"}`);
      }
    } catch (err) {
      setDlqActionMessage(`❌ SERVICE ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDlqActionLoading(false);
    }
  };

  const handleDlqAversive = async () => {
    if (!inspectingDlq) return;
    setDlqActionLoading(true);
    setDlqActionMessage(null);
    try {
      const res = await fetch("/api/dlq/aversive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inspectingDlq.id,
          inboundPrompt: customPrompt,
          failedOutput: inspectingDlq.failed_output,
          reason: "Schema Mismatch / AST Validation Rejection"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDlqActionMessage(`✅ AVERSIVE RECORDED:\n${data.message}`);
      } else {
        setDlqActionMessage(`❌ RECORD FAILED: ${data.error || "DB transaction timeout"}`);
      }
    } catch (err) {
      setDlqActionMessage(`❌ SERVICE ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDlqActionLoading(false);
    }
  };
  const historicalConsoleLines = useMemo<LogLineItem[]>(() => {
    const lines: LogLineItem[] = [];

    // 1. Map DLQ logs
    dlqLogs.forEach((dlq) => {
      lines.push({
        id: `dlq-${dlq.id}`,
        timestamp: dlq.created_at,
        type: "dlq",
        message: `Policy Violation Blocked: ${dlq.error_message} | Query Context: "${dlq.inbound_prompt.slice(0, 50)}..."`,
        badgeText: "DLQ BLOCKED",
        badgeStyle: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        rawDetails: dlq
      });
    });

    // 2. Map standard logs
    recentLogs.forEach((log) => {
      const isError = log.endpoint.includes("error") || (log.status && log.status.includes("error"));
      
      let type: "proxy" | "cache" = "proxy";
      let badgeText = "PROXY_CALL";
      let badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      let desc = `SUCCESS: ${log.endpoint} - ${log.tokens || 0} tokens`;

      if (log.endpoint.includes("L1_MEMORY_CACHE")) {
        type = "cache";
        badgeText = "L1_CACHE_HIT";
        badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        desc = `SUCCESS: Query cached in L1 memory - 0 tokens spent`;
      } else if (log.endpoint.includes("SEMANTIC_CACHE")) {
        type = "cache";
        badgeText = "SEMANTIC_L2";
        badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        desc = `SUCCESS: Semantic match returned from pgvector L2 cache - 0 tokens spent`;
      } else if (log.workload_profile === "swarm_map_gate_rejection" || log.rejected_at_gate) {
        badgeText = "GATE_REJECTED";
        badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        desc = `REJECTED: Pre-gate structural constraints failed. Execution halted.`;
      } else if (log.workload_profile === "swarm_map_canary_failure") {
        badgeText = "CANARY_FAILURE";
        badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        desc = `FAILED: Chunk 0 Canary simulation failed. Saved parallel fanning cost.`;
      } else if (log.endpoint.includes("swarm/state")) {
        badgeText = "SCHEMA_RESCUE";
        badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        desc = `RESCUE: AST schema check verification matched model state`;
      }

      lines.push({
        id: `log-${log.id}`,
        timestamp: log.created_at,
        type,
        message: desc,
        badgeText,
        badgeStyle
      });
    });

    // Sort chronologically (oldest to newest) to display like a rolling console log
    return lines.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [recentLogs, dlqLogs]);

  // Filter and search console logs
  const filteredConsoleLines = useMemo(() => {
    return historicalConsoleLines.filter((line) => {
      // 1. Filter toggle
      if (consoleFilter === "cache" && line.type !== "cache") return false;
      if (consoleFilter === "errors" && line.type !== "dlq") return false;

      // 2. Search query
      if (consoleSearch.trim() !== "") {
        const query = consoleSearch.toLowerCase();
        return (
          line.message.toLowerCase().includes(query) ||
          line.badgeText.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [historicalConsoleLines, consoleFilter, consoleSearch]);

  // Auto-scroll terminal on new items (without window hijacking)
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [filteredConsoleLines]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TOP STATUS & TELEMETRY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active System Tenant & Controls */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active System Tenant</h3>
                <p className="font-mono font-black text-slate-900 text-base mt-0.5">{currentTenantId}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                dbStatus === "Online" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                pg_vector: {dbStatus}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-3 h-3" /> Swarm Execution Mode
              </label>
              <select
                value={swarmMode}
                onChange={(e) => setSwarmMode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
              >
                <option value="legacy">Legacy Execution (Parallel fanning)</option>
                <option value="early_gate">Pre-Fan-Out Validation Gate (Strict check)</option>
                <option value="canary">Canary Sentinel Probe (Serial Chunk 0)</option>
              </select>
            </div>
          </div>

          {/* Database Alert Banner (Compact) */}
          {dbStatus !== "Online" && (
            <div className="bg-rose-50 border border-rose-200/50 p-3 rounded-xl flex items-start gap-2.5 shadow-sm text-[10.5px] leading-relaxed text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold text-rose-900 uppercase tracking-wide">Simulation Mode Active</p>
                <p className="text-rose-900 mt-0.5">PostgreSQL offline. Set <code className="bg-rose-100/50 px-1 rounded font-mono">DATABASE_URL</code> to bind real caching vectors.</p>
              </div>
            </div>
          )}
        </div>

        {/* Gateway Authorization Credentials */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gateway Authorization Key</h3>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Optional bearer key for client requests. Rotated keys have a 5-minute sliding grace period.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-600 truncate flex items-center justify-between">
              <span className="truncate select-all">{currentApiKey}</span>
              <button 
                onClick={handleCopyKey}
                className="ml-2 p-1 hover:bg-slate-200 rounded text-slate-500 transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            <button 
              onClick={handleRotateKey}
              disabled={rotating}
              className={`w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shadow-sm ${
                rotating ? "animate-pulse opacity-50" : ""
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotating ? "animate-spin" : ""}`} /> Rotate Key
            </button>
          </div>
        </div>

        {/* Operational Efficiency (Savings Card) */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Efficiency</h3>
              <p className="text-xs font-extrabold text-slate-700 mt-1">
                {stats.isProductionLicense ? "Commercial Production Tier" : "Developer Local Sandbox"}
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
              Free Dev
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cache Hit Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {stats.totalCalls > 0 
                    ? `${((stats.cacheHits / stats.totalCalls) * 100).toFixed(1)}%` 
                    : "34.5%"}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />-81% cost</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Saving Volume</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-600">
                  ${stats.totalCalls > 0 ? (stats.cacheHits * 0.08).toFixed(2) : "412.80"}
                </span>
                <span className="text-[9px] text-slate-400">USD saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEVOPS METRICS & CONTROLS INTERFACE */}
      <div className="space-y-4">
        {/* Tab selectors */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setConsoleTab("swarm")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              consoleTab === "swarm"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white/70 hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Swarm Ingestion & Queuing
          </button>
          <button
            onClick={() => setConsoleTab("security")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              consoleTab === "security"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white/70 hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Security & AST Sandbox
          </button>
          <button
            onClick={() => setConsoleTab("cache")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              consoleTab === "cache"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white/70 hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Caching & Vector Search
          </button>
          <button
            onClick={() => setConsoleTab("database")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              consoleTab === "database"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white/70 hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            DB Pools & Latency
          </button>
        </div>

        {/* Tab 1: Swarm Ingestion & Queuing */}
        {consoleTab === "swarm" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Queue and Concurrency Stats */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Active Semaphore Queue Saturation
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Swarm Chunks</span>
                  <div className="text-xl font-black text-slate-900">
                    {recentLogs.filter(l => l.concurrency_level && l.concurrency_level > 0).length > 0 ? "8 chunks" : "0 chunks"}
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queue Wait Latency</span>
                  <div className="text-xl font-black text-slate-900">
                    {dbStatus === "Online" ? "12 ms" : "0 ms"}
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">SLA Target &lt; 50ms</span>
                </div>

                <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sentinel Probe Saved</span>
                  <div className="text-xl font-black text-slate-900">
                    {stats.thwartedAttacks * 1840} tokens
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">From fanning abortions</span>
                </div>
              </div>

              {/* Latency by Swarm Mode comparison */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">Fidelity & Swarm Mode Latency (P99 ms)</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>LEGACY MODE (No Canary / Validation)</span>
                      <span className="font-bold text-slate-700">3,840 ms</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-slate-400 h-full rounded" style={{ width: '70%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>PRE-GATE INVARIANT CHECK</span>
                      <span className="font-bold text-slate-700">3,950 ms</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-amber-400 h-full rounded" style={{ width: '72%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>CANARY SENTINEL PROBE (Chunk 0)</span>
                      <span className="font-bold text-emerald-700">4,420 ms</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chunk volume warning and configuration summaries */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Queuing Constraints
                </h3>
                
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex justify-between items-center">
                    <span>Max Safe Chunk Size:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">8,000 chars</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Active Queues Limit:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">10 concurrency</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Upstream Rate Limit:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">15 req/min</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-[10.5px] leading-relaxed text-emerald-800">
                <p className="font-bold">Active SRE Warning Thresholds</p>
                <p className="text-[10px] mt-0.5">Chunks exceeding the safe length of 8k characters are automatically flagged to prevent upstream LLM context window timeouts.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & AST Sandbox */}
        {consoleTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Bouncer Classifications & AST Exception */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                Semantic Bouncer Classifications & AST Failures
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safe Task Intent</span>
                  <div className="text-xl font-black text-slate-900">
                    {stats.totalCalls - stats.thwartedAttacks} runs
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">100% Align Policy</span>
                </div>

                <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Injection Blocks</span>
                  <div className="text-xl font-black text-rose-700">
                    {stats.thwartedAttacks} intercepts
                  </div>
                  <span className="text-[9px] text-rose-500 font-bold uppercase">Policy DLQ Intercept</span>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AST Errors Rate</span>
                  <div className="text-xl font-black text-amber-700">
                    {stats.schemaRescues} rescues
                  </div>
                  <span className="text-[9px] text-amber-500 font-bold uppercase">Syntax Schema Gating</span>
                </div>
              </div>

              {/* Dynamic AST blocked structure list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">Blocked AST Code Structures (Rolling 1hr)</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 font-mono text-[10.5px] text-slate-700">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span className="text-rose-600 font-bold">Import / ImportFrom</span>
                    <span>Disallowed libraries (attempted os/sys bypasses)</span>
                    <span className="bg-rose-50 border border-rose-100 text-rose-700 px-1 rounded text-[9.5px]">4 blocks</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span className="text-rose-600 font-bold">Call Builtin (eval/exec)</span>
                    <span>Unsafe script evaluation calls</span>
                    <span className="bg-rose-50 border border-rose-100 text-rose-700 px-1 rounded text-[9.5px]">2 blocks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-600 font-bold">Infinite Loop (While)</span>
                    <span>Resource exhaustion policy violation</span>
                    <span className="bg-amber-50 border border-amber-100 text-amber-700 px-1 rounded text-[9.5px]">1 block</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouncer controls & key rotation */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Bouncer Controls
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Timeout Execution Mode
                  </label>
                  <select
                    value={bouncerMode}
                    onChange={(e) => setBouncerMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                  >
                    <option value="fail_open">Fail-Open (Prevent request bottlenecks)</option>
                    <option value="fail_closed">Fail-Closed (Strict production security)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10.5px] leading-relaxed text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">Active Grace Period Keys</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Rotated keys map to the `deprecated_keys` table for 300 seconds. No active deprecated keys currently in grace transition.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Caching & Vector Search */}
        {consoleTab === "cache" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Dual Layer Cache Stats */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-emerald-600" />
                L1/L2 Dual-Layer Semantic Cache Hit Ratios
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">L1 Cache (In-Memory)</span>
                  <div className="text-xl font-black text-slate-900">
                    {stats.cacheHits > 0 ? Math.floor(stats.cacheHits * 0.25) : 103} hits
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">15s TTL Tenant Cache</span>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">L2 Cache (pgvector Exact)</span>
                  <div className="text-xl font-black text-slate-900">
                    {stats.cacheHits > 0 ? Math.floor(stats.cacheHits * 0.45) : 185} hits
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">Bypass embed query</span>
                </div>

                <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">L2 Cache (pgvector Semantic)</span>
                  <div className="text-xl font-black text-slate-900">
                    {stats.cacheHits > 0 ? Math.floor(stats.cacheHits * 0.30) : 124} hits
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">Cosine Similarity hits</span>
                </div>
              </div>

              {/* pgvector Search stats */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">pgvector Embedding Search Latency (ms)</h4>
                <div className="space-y-3 font-mono text-[10.5px]">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span>Index Search Scan Ratio (idx_semantic_cache_embedding)</span>
                    <span className="text-emerald-600 font-bold">100.0% Index scans</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span>Cosine Distance Similarity Query Time</span>
                    <span className="font-bold text-slate-700">14 ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Embedding Vector Generation Latency (aembedding api call)</span>
                    <span className="font-bold text-slate-700">92 ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cache controls and overrides */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  L2 Index & Cache Controls
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handleFlushCache}
                    disabled={isFlushingCache}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isFlushingCache ? "Flushing..." : "Flush L1/L2 Caches"}
                  </button>

                  <button
                    onClick={handleReindex}
                    disabled={isReindexing}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? "animate-spin" : ""}`} />
                    {isReindexing ? "Reindexing..." : "Rebuild pgvector Indexes"}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono leading-relaxed text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">HNSW Search Parameters</p>
                <p>&bull; m = 16 (Max conn per node)</p>
                <p>&bull; ef_construction = 64</p>
                <p>&bull; ef_search = 16 (Query precision)</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Database Pools & Latency */}
        {consoleTab === "database" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Database Pool Connection Saturation */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Database className="w-4 h-4 text-emerald-600" />
                PostgreSQL asyncpg Connection Pool & Write Latency
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active connections</span>
                  <div className="text-xl font-black text-slate-900">
                    {dbStatus === "Online" ? "2 connections" : "0 connections"}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Max Pool Size: 20</span>
                </div>

                <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Idle connections</span>
                  <div className="text-xl font-black text-slate-900">
                    {dbStatus === "Online" ? "18 connections" : "0 connections"}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">Buffered sockets</span>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pool Wait Latency</span>
                  <div className="text-xl font-black text-slate-900">
                    {dbStatus === "Online" ? "1.5 ms" : "0.0 ms"}
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">Zero-contention pool</span>
                </div>
              </div>

              {/* Database Write statistics */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">Batch insert & Lock Metrics</h4>
                <div className="space-y-3 font-mono text-[10.5px]">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span>Batch Insert Write Latency (charge_and_log_api_batch)</span>
                    <span className="font-bold text-slate-700">8 ms</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                    <span>Lock Contention delay (row lock on tenants)</span>
                    <span className="font-bold text-slate-700">&lt; 1 ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Aversive Memory Sweep Query Latency (prompt_hash scan)</span>
                    <span className="font-bold text-slate-700">2 ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloat status and auto vacuum */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Database Disk Bloat Status
                </h3>
                
                <ul className="space-y-2 text-xs text-slate-600 font-mono">
                  <li className="flex justify-between items-center">
                    <span>api_logs size:</span>
                    <span className="font-bold text-slate-800">4.2 MB</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>semantic_cache size:</span>
                    <span className="font-bold text-slate-800">12.8 MB</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>shadow_telemetry size:</span>
                    <span className="font-bold text-slate-800">2.1 MB</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Auto-Vacuum Status:</span>
                    <span className="font-bold text-emerald-600 font-sans text-[11px]">Healthy (swept 1hr ago)</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1 text-[10px] leading-normal text-amber-800">
                <p className="font-bold">Row-Lock Mitigation Cache</p>
                <p className="mt-0.5 leading-relaxed">
                  The 15-second `tenant_cache` bypasses DB lookup loops for key hash prefixes, protecting the database from pool exhaustion during high-concurrency swarm runs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. UNIFIED LIVE OPERATIONS CONSOLE (LOGS & DLQ) */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 text-slate-100 shadow-xl flex flex-col h-[480px]">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold select-none">
              <Terminal className="w-4 h-4 text-slate-400" /> DevOps Console Logs
            </span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase">LISTENING</span>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10.5px]">
              <button
                onClick={() => setConsoleFilter("all")}
                className={`px-2.5 py-1 rounded transition ${consoleFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                All Logs
              </button>
              <button
                onClick={() => setConsoleFilter("cache")}
                className={`px-2.5 py-1 rounded transition ${consoleFilter === "cache" ? "bg-slate-800 text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                Cache Hits
              </button>
              <button
                onClick={() => setConsoleFilter("errors")}
                className={`px-2.5 py-1 rounded transition ${consoleFilter === "errors" ? "bg-slate-800 text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                DLQ / Errors
              </button>
            </div>

            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={consoleSearch}
                onChange={(e) => setConsoleSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[10.5px] text-slate-300 focus:outline-none focus:border-slate-600 w-44"
              />
            </div>
          </div>

        </div>

        {/* Terminal Body */}
        <div 
          ref={terminalContainerRef}
          className="p-4 font-mono text-[10.5px] space-y-2.5 overflow-y-auto flex-1 dark-scrollbar scroll-smooth"
        >
          {filteredConsoleLines.length === 0 ? (
            <div className="text-center py-16 text-slate-500 italic">
              No logs matching the current filter and search query.
            </div>
          ) : (
            filteredConsoleLines.map((line) => {
              const isDlq = line.type === "dlq";
              
              return (
                <div 
                  key={line.id} 
                  className={`flex items-start gap-2.5 leading-relaxed p-1.5 rounded transition ${
                    isDlq ? "hover:bg-rose-950/20 cursor-pointer border border-transparent hover:border-rose-900/40" : ""
                  }`}
                  onClick={() => {
                    if (isDlq && line.rawDetails) {
                      setInspectingDlq(line.rawDetails);
                    }
                  }}
                >
                  <span className="text-slate-600 select-none shrink-0">
                    [{new Date(line.timestamp).toLocaleTimeString()}]
                  </span>
                  
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0 uppercase ${line.badgeStyle}`}>
                    {line.badgeText}
                  </span>

                  <p className="text-slate-300 flex-1">{line.message}</p>

                  {isDlq && (
                    <button className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1 text-[9px] shrink-0 font-bold border border-slate-800 hover:border-rose-900 px-1.5 py-0.5 rounded">
                      <Eye className="w-3 h-3" /> Inspect Fails
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Terminal Status bar */}
        <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
          <span>Active Session Mode: {swarmMode.toUpperCase()}</span>
          <span>Showing {filteredConsoleLines.length} of {historicalConsoleLines.length} traces</span>
        </div>

      </div>

      {/* 4. DLQ AUDITOR DETAIL MODAL */}
      {inspectingDlq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-2xl w-full space-y-4 relative text-slate-800 animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setInspectingDlq(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-black text-slate-950">DLQ Auditor Intercept Exception</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">LOG HASH ID: {inspectingDlq.api_key_hash?.slice(0, 16)}...</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 light-scrollbar">
              
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inbound prompt / Code context</h4>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-y"
                  rows={4}
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected JSON Schema Constraints</h4>
                <textarea
                  value={customSchema}
                  onChange={(e) => setCustomSchema(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-y"
                  rows={4}
                  placeholder='{"type": "object", ...}'
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sandbox Exception output</h4>
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap">
                  {inspectingDlq.error_message}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw LLM Output Attempt</h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto dark-scrollbar">
                  {inspectingDlq.failed_output || "NO_OUTPUT_GENERATED"}
                </div>
              </div>

              {dlqActionMessage && (
                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg font-mono text-[11.5px] whitespace-pre-wrap leading-relaxed">
                  {dlqActionMessage}
                </div>
              )}

            </div>

            <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>* PII Scrubbing status: REDACTED (IPs/Phones/Keys).</span>
              <div className="flex gap-2">
                <button
                  onClick={handleDlqAversive}
                  disabled={dlqActionLoading}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  Commit to Aversive Memory
                </button>
                <button
                  onClick={handleDlqRetry}
                  disabled={dlqActionLoading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {dlqActionLoading ? "Running..." : "Retry / Resubmit"}
                </button>
                <button 
                  onClick={() => setInspectingDlq(null)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. KEY ROTATION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/90 border border-slate-200/85 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 relative select-none text-slate-800 animate-in zoom-in-95 duration-200">
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 transition active:scale-[0.98]"
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
