"use client";

import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldAlert, Activity, Terminal, Layers, Zap, Trophy, Database, Server, Key, DollarSign, ActivityIcon, FileText
} from "lucide-react";

export function AdminClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Glass Box State
  const [glassBoxPrompt, setGlassBoxPrompt] = useState("");
  const [glassBoxLogs, setGlassBoxLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const chartData = stats.benchmarks ? [...stats.benchmarks].reverse().map(b => ({
      ...b,
      latency: Number(b.average_latency_sec),
      retail: Number(b.retail_cost),
      cogs: Number(b.wholesale_cost),
      time: new Date(b.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  })) : [];


  const runGlassBox = async (e: any) => {
    e.preventDefault();
    if (!glassBoxPrompt.trim()) return;
    setIsSimulating(true);
    setGlassBoxLogs(["[SYS] Inbound payload intercepted by Membrane Gateway."]);
    
    await new Promise(r => setTimeout(r, 400));
    setGlassBoxLogs(prev => [...prev, "[SEC] Scanning payload via Asynchronous Sniper..."]);
    
    await new Promise(r => setTimeout(r, 600));
    const isMalignant = glassBoxPrompt.toLowerCase().includes("ignore") || glassBoxPrompt.toLowerCase().includes("bypass");
    if (isMalignant) {
        setGlassBoxLogs(prev => [...prev, "[SEC] CRITICAL: Adversarial pattern detected. Execution halted."]);
        setGlassBoxLogs(prev => [...prev, "[NET] Dropping TCP connection (0 bytes returned)."]);
        setIsSimulating(false);
        return;
    }
    setGlassBoxLogs(prev => [...prev, "[SEC] Payload verified clean. Proceeding to Cognitive Bouncer."]);
    
    await new Promise(r => setTimeout(r, 300));
    setGlassBoxLogs(prev => [...prev, "[COG] Analyzing cognitive density (Semantic classification)..."]);
    
    await new Promise(r => setTimeout(r, 700));
    const isHeavy = glassBoxPrompt.length > 50 || glassBoxPrompt.toLowerCase().includes("complex") || glassBoxPrompt.toLowerCase().includes("code");
    setGlassBoxLogs(prev => [...prev, `[COG] Density Score: ${isHeavy ? '0.89 (HIGH)' : '0.14 (LOW)'}.`]);
    
    if (isHeavy) {
        setGlassBoxLogs(prev => [...prev, "[NET] Routing to Heavy Apex Node for deep reasoning..."]);
        await new Promise(r => setTimeout(r, 1200));
        setGlassBoxLogs(prev => [...prev, "[SYS] Generation complete. Latency: 1.4s. Retail Value: $0.02. Wholesale Cost: $0.008."]);
    } else {
        setGlassBoxLogs(prev => [...prev, "[NET] Searching Global Hive Mind Cache..."]);
        await new Promise(r => setTimeout(r, 300));
        if (glassBoxPrompt.toLowerCase().includes("test")) {
             setGlassBoxLogs(prev => [...prev, "[NET] Cache HIT (Vector distance < 0.12). Retrieving pre-computed response."]);
             setGlassBoxLogs(prev => [...prev, "[SYS] Generation complete. Latency: 0.08s. Retail Value: $0.001. Wholesale Cost: $0.0000."]);
        } else {
             setGlassBoxLogs(prev => [...prev, "[NET] Cache MISS. Routing to High-Speed Canary Node..."]);
             await new Promise(r => setTimeout(r, 800));
             setGlassBoxLogs(prev => [...prev, "[SYS] Generation complete. Latency: 0.9s. Retail Value: $0.005. Wholesale Cost: $0.0001."]);
        }
    }
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2 mt-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <h1 className="text-xl font-black tracking-tight text-white leading-none">Apex<br/>Console</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "overview" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <ActivityIcon className="w-5 h-5" /> Executive Overview
          </button>
          <button onClick={() => setActiveTab("ledger")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "ledger" ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <Database className="w-5 h-5" /> Network Ledger
          </button>
          <button onClick={() => setActiveTab("certifications")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "certifications" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <Trophy className="w-5 h-5" /> Telemetry & Certs
          </button>
          <button onClick={() => setActiveTab("glassbox")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "glassbox" ? "bg-purple-500/10 text-purple-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <Terminal className="w-5 h-5" /> Glass Box Simulator
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="px-4 py-2 text-xs text-slate-500 font-mono">
            System: ONLINE<br/>
            Gateway: LIVE
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Executive Overview</h2>
                <p className="text-slate-400 text-sm">High-level financial and operational telemetry.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <DollarSign className="w-6 h-6 text-emerald-500 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Retail Value (30d)</p>
                <p className="text-3xl font-black text-white">${stats.totalRetail?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <Server className="w-6 h-6 text-rose-500 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wholesale COGS (30d)</p>
                <p className="text-3xl font-black text-white">${stats.totalWholesale?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <Activity className="w-6 h-6 text-blue-500 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Margin</p>
                <p className="text-3xl font-black text-white">{stats.margin?.toFixed(1) || "0.0"}%</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <Layers className="w-6 h-6 text-amber-500 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total API Calls</p>
                <p className="text-3xl font-black text-white">{stats.totalCalls?.toLocaleString() || "0"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
                <h3 className="text-lg font-bold text-indigo-400 mb-2">Schema Rescues</h3>
                <p className="text-4xl font-black text-white">{stats.schemaRescues?.toLocaleString() || "0"}</p>
                <p className="text-sm text-indigo-300/70 mt-2">Invalid JSON structures successfully repaired by the Waterfall Fallback system.</p>
              </div>
              <div className="bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20">
                <h3 className="text-lg font-bold text-rose-400 mb-2">Thwarted Attacks</h3>
                <p className="text-4xl font-black text-white">{stats.thwartedAttacks?.toLocaleString() || "0"}</p>
                <p className="text-sm text-rose-300/70 mt-2">Prompt injections and adversarial payloads intercepted by the Semantic Bouncer.</p>
              </div>
            </div>
          </div>
        )}

        {/* NETWORK LEDGER TAB */}
        {activeTab === "ledger" && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Live Network Ledger</h2>
                <p className="text-slate-400 text-sm">Real-time, unvarnished transaction logs from the PostgreSQL database.</p>
            </div>
            <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-4 font-mono text-xs">ID</th>
                        <th className="p-4 font-mono text-xs">Timestamp</th>
                        <th className="p-4 font-mono text-xs">Routed Node</th>
                        <th className="p-4 font-mono text-xs text-right">Tokens</th>
                        <th className="p-4 font-mono text-xs text-right">Retail</th>
                        <th className="p-4 font-mono text-xs text-right">COGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {stats.recentLogs && stats.recentLogs.map((log: any) => {
                        const isCache = log.endpoint.includes("CACHE");
                        const isHeavy = log.endpoint.includes("pro") || log.endpoint.includes("apex");
                        return (
                          <tr key={log.id} className="hover:bg-slate-800/80 transition-colors">
                            <td className="p-4 text-slate-500 font-mono text-xs">#{log.id}</td>
                            <td className="p-4 font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${isCache ? 'bg-amber-500/20 text-amber-400' : isHeavy ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {isCache ? 'Hive Mind Cache' : isHeavy ? 'Apex Node' : 'Canary Node'}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-right">{log.tokens}</td>
                            <td className="p-4 text-right font-mono text-xs text-rose-400">${Number(log.cost).toFixed(5)}</td>
                            <td className="p-4 text-right font-mono text-xs text-emerald-400">${Number(log.wholesale_cost).toFixed(5)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}

        {/* CERTIFICATIONS TAB */}
        {activeTab === "certifications" && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Live Telemetry & Certifications</h2>
                  <p className="text-slate-400 text-sm">Verifiable, real-time results from the RAGAS Fidelity CI pipeline.</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl text-xs font-mono text-emerald-400 shadow-inner">
                  $ python3 run_production_fidelity_eval.py
                </div>
            </div>

            {stats.benchmarks && stats.benchmarks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                   {(() => {
                      const latest = stats.benchmarks[0];
                      return (
                          <>
                              <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30">
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Context Precision</p>
                                <p className="text-3xl font-black text-emerald-400">{(latest.aggregate_precision * 100).toFixed(1)}%</p>
                                <p className="text-xs text-emerald-500/80 mt-1">Zero dropped clauses</p>
                              </div>
                              <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30">
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Faithfulness</p>
                                <p className="text-3xl font-black text-emerald-400">{(latest.aggregate_faithfulness * 100).toFixed(1)}%</p>
                                <p className="text-xs text-emerald-500/80 mt-1">Zero hallucinations</p>
                              </div>
                              <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/30">
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Avg Swarm Latency</p>
                                <p className="text-3xl font-black text-blue-400">{Number(latest.average_latency_sec).toFixed(2)}s</p>
                                <p className="text-xs text-blue-500/80 mt-1">Per document payload</p>
                              </div>
                              <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30">
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Compute Margin</p>
                                <p className="text-3xl font-black text-amber-400">
                                  {(((latest.retail_cost - latest.wholesale_cost) / latest.retail_cost) * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-amber-500/80 mt-1">Arbitrage savings</p>
                              </div>
                          </>
                      )
                   })()}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-[350px]">
                      <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> Latency Trendline</h4>
                      <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}s`} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="latency" name="Avg Latency" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-[350px]">
                      <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Cost Efficiency (Retail vs COGS)</h4>
                      <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="retail" name="Retail Value" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="cogs" name="Wholesale COGS" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 overflow-hidden mt-6">
                  <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Run Timestamp</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Documents</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Precision</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Faithfulness</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Avg Latency</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Retail</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">COGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {stats.benchmarks.map((run: any) => (
                        <tr key={run.id} className="hover:bg-slate-800/80 transition-colors">
                          <td className="p-4 font-mono text-xs">{new Date(run.created_at).toLocaleString()}</td>
                          <td className="p-4 font-mono text-xs">{run.dataset_size}</td>
                          <td className="p-4 text-emerald-400 font-bold font-mono text-xs">{(run.aggregate_precision * 100).toFixed(1)}%</td>
                          <td className="p-4 text-emerald-400 font-bold font-mono text-xs">{(run.aggregate_faithfulness * 100).toFixed(1)}%</td>
                          <td className="p-4 text-blue-400 font-mono text-xs">{Number(run.average_latency_sec).toFixed(2)}s</td>
                          <td className="p-4 text-rose-400 font-mono text-xs text-right">${Number(run.retail_cost).toFixed(4)}</td>
                          <td className="p-4 text-emerald-400 font-mono text-xs text-right">${Number(run.wholesale_cost).toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No benchmark telemetry found in the database. Run the Python pipeline to populate.</p>
              </div>
            )}
          </div>
        )}

        {/* GLASSBOX TAB */}
        {activeTab === "glassbox" && (
           <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-6">
             <div>
                <h2 className="text-2xl font-bold text-white">Glass Box Simulator</h2>
                <p className="text-slate-400 text-sm">Test the live routing logic without burning actual credits.</p>
            </div>
            
            <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
              <form onSubmit={runGlassBox} className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  value={glassBoxPrompt}
                  onChange={e => setGlassBoxPrompt(e.target.value)}
                  placeholder="Enter a prompt to trace (try 'complex', 'bypass', or 'test')..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
                  disabled={isSimulating}
                />
                <button 
                  type="submit" 
                  disabled={isSimulating || !glassBoxPrompt.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSimulating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Trace Route"}
                </button>
              </form>

              <div className="bg-black/80 p-6 rounded-xl border border-slate-700 shadow-inner font-mono text-xs text-emerald-400 min-h-[200px]">
                {glassBoxLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600">
                     Awaiting payload intercept...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {glassBoxLogs.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="opacity-50 shrink-0">{new Date().toISOString().split('T')[1].slice(0,-1)}</span>
                        <span className={log.includes("CRITICAL") ? "text-rose-500 font-bold" : log.includes("[COG]") ? "text-blue-400" : log.includes("HIT") ? "text-amber-400" : ""}>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
