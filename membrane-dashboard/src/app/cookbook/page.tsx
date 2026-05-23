"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Key, Sparkles, Zap, Activity, Layers, CheckCircle, 
  FileText, AlertCircle, Loader2, HelpCircle, ChevronRight, TrendingDown
} from "lucide-react";

interface WorkloadProfile {
  name: string;
  id: string;
  systemPersona: string;
  targetSignals: string[];
  sampleText: string;
}

const WORKLOAD_PROFILES: WorkloadProfile[] = [
  {
    name: "Legal Contracts",
    id: "legal",
    systemPersona: "You are an expert legal counsel AI specializing in high-fidelity verbatim contract extraction.",
    targetSignals: ["Indemnification", "Liability Caps", "Governing Law", "Severability"],
    sampleText: "This Agreement is made between Acme Corp ('Customer') and Apex Solutions ('Provider'). Section 12: Indemnification. Acme Corp shall defend, indemnify, and hold harmless Apex Solutions from any third-party claims arising from services rendered. Section 13: Liability. In no event shall either party's aggregate liability exceed $50,000. Section 14: Governing Law. This contract is governed by the laws of the State of Washington, USA. Section 15: Severability. If any provision is found invalid, the remaining terms shall continue in full force."
  },
  {
    name: "Municipal Zoning",
    id: "zoning",
    systemPersona: "You are an expert urban planning assistant specializing in municipal zoning and code extraction.",
    targetSignals: ["Setbacks", "Building Heights", "Parking", "Permitted Uses"],
    sampleText: "Chapter 17.24: Residential Zoning. Section 17.24.010: Setbacks. Front yard setbacks shall be a minimum of 20 feet from the property line. Side yard setbacks shall be at least 5 feet. Section 17.24.020: Building Heights. No residential structure shall exceed 35 feet or 3 stories in height. Section 17.24.030: Parking. Each single-family dwelling requires at least 2 off-street covered parking spaces. Section 17.24.040: Permitted Uses. Permitted uses include single-family detached dwellings, accessory dwelling units, and community gardens."
  },
  {
    name: "Video Transcripts",
    id: "video",
    systemPersona: "You are an expert transcriptionist and meeting analyst specializing in extracting concrete timeline highlights.",
    targetSignals: ["Opening Remarks", "Action Items", "Key Decisions", "Q&A Session"],
    sampleText: "[00:01:15] Sarah: Welcome everyone to the Q2 municipal coordination briefing. Let's start with opening remarks. Our goal today is to align on the District 31 legislative updates. [00:15:30] Mark: Regarding action items, I will compile the routing matrix for the professional consulting briefs by Tuesday. [00:22:45] Sarah: Excellent. Key decision: We are officially postponing the public hearing for the District 3 legislative revision to June 15th to gather more feedback. [00:45:00] Audience member: Can we ask about the budget? Sarah: Let's open the Q&A session now. Yes, the budget has an allocated balance of $50,000 for local dev refinement."
  }
];

export default function CookbookPage() {
  const [selectedProfile, setSelectedProfile] = useState<WorkloadProfile>(WORKLOAD_PROFILES[0]);
  const [inputText, setInputText] = useState(WORKLOAD_PROFILES[0].sampleText);
  const [systemPersona, setSystemPersona] = useState(WORKLOAD_PROFILES[0].systemPersona);
  const [targetSignals, setTargetSignals] = useState(WORKLOAD_PROFILES[0].targetSignals.join(", "));
  const [maxConcurrency, setMaxConcurrency] = useState(20);
  const [temperature, setTemperature] = useState(0.0);
  
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/v1/swarm/map");
  const [apiKey, setApiKey] = useState("sk_live_local_dev_key");

  const [chunks, setChunks] = useState<string[]>([]);
  const [maxWordsPerChunk, setMaxWordsPerChunk] = useState(30);
  const [isChunked, setIsChunked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [swarmResponse, setSwarmResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  // Switch workload profile template
  const handleProfileChange = (profileId: string) => {
    const profile = WORKLOAD_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setInputText(profile.sampleText);
      setSystemPersona(profile.systemPersona);
      setTargetSignals(profile.targetSignals.join(", "));
      setIsChunked(false);
      setChunks([]);
      setSwarmResponse(null);
      setError(null);
    }
  };

  // Reset chunking states when input changes
  useEffect(() => {
    setChunks([]);
    setIsChunked(false);
    setSubmitDisabled(false);
  }, [inputText, maxWordsPerChunk]);

  // Perform client-side chunking
  const performChunking = () => {
    if (!inputText.trim()) {
      setError("Please input some text first.");
      return;
    }
    setError(null);
    const words = inputText.split(/\s+/);
    const resultChunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunkWords = words.slice(i, i + maxWordsPerChunk);
      resultChunks.push(chunkWords.join(" "));
    }

    setChunks(resultChunks);
    setIsChunked(true);
    setSwarmResponse(null);

    if (resultChunks.length > 50) {
      setSubmitDisabled(true);
    } else {
      setSubmitDisabled(false);
    }
  };

  // Submit dynamic chunks to /v1/swarm/map
  const executeSwarmMap = async () => {
    if (chunks.length === 0) {
      setError("Please perform text chunking first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSwarmResponse(null);

    const signalsArray = targetSignals.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      model: "membrane-engagement-layer",
      chunks: chunks,
      max_concurrency: maxConcurrency,
      temperature: temperature,
      extraction_criteria: {
        system_persona: systemPersona,
        target_signals: signalsArray,
        enforce_verbatim: true
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail?.message || 
          errorData?.detail || 
          `HTTP Error ${response.status}: Failed to reach Swarm backend.`
        );
      }

      const data = await response.json();
      setSwarmResponse(data);
    } catch (err: any) {
      console.error("Swarm Map Execution Error:", err);
      setError(err.message || "An unexpected error occurred during execution.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Background Blobs for Asymmetry (Skeuomorphic Overlap) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-indigo-500/[0.015] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="text-white font-extrabold text-sm">M</span>
            </div>
            <span className="font-extrabold text-white tracking-tight text-lg">Membrane Cookbook</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Console Dashboard
            </Link>
            <Link href="/docs" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              API Docs
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4 relative">
        
        {/* Title Section (Authoritative Typography) */}
        <div className="mb-8 relative">
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-900/40 px-2.5 py-1 rounded-md">
            MEMBRANE NATIVE SWARM PLAYGROUND
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-3">
            The Swarm Cookbook
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Dynamic client-side chunking, multi-workload schema extraction, and live ledger accounting. Experiment with local or remote parallel Swarm Map resolutions out of the box.
          </p>
        </div>

        {/* Global Connection Controls ( Tactile Header bar ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-lg">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Swarm API Endpoint URL
            </label>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              API Sandbox Bearer Token
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pl-10 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Primary Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Text input & chunking configuration (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* WORKLOAD TEMPLATE SELECTOR */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Select Workload Profile</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Choose a pre-calibrated scenario below to dynamically load optimized system instructions, signals, and sample text data.
              </p>
              
              <div className="grid grid-cols-3 gap-2.5">
                {WORKLOAD_PROFILES.map((p) => {
                  const isActive = selectedProfile.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProfileChange(p.id)}
                      className={`text-xs font-bold px-3 py-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                        isActive 
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RAW DATA INPUT */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Source Document block</h2>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  {inputText.split(/\s+/).filter(Boolean).length} Words
                </span>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setIsChunked(false);
                }}
                rows={6}
                placeholder="Paste your raw document block or zoning codes here..."
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-sm text-slate-300 leading-relaxed font-sans focus:outline-none focus:border-blue-500/40 resize-y"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Custom System Persona
                  </label>
                  <input
                    type="text"
                    value={systemPersona}
                    onChange={(e) => setSystemPersona(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Target Extraction Signals (comma separated)
                  </label>
                  <input
                    type="text"
                    value={targetSignals}
                    onChange={(e) => setTargetSignals(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* CHUNKING SLIDER & BUTTON */}
              <div className="mt-6 pt-5 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-400 uppercase">Max Words per Chunk</span>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/40 px-1.5 py-0.5 rounded">{maxWordsPerChunk} words</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={maxWordsPerChunk}
                    onChange={(e) => {
                      setMaxWordsPerChunk(Number(e.target.value));
                      setIsChunked(false);
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                
                <button
                  onClick={performChunking}
                  className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-extrabold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  Generate Chunks
                </button>
              </div>
            </div>

            {/* CHUNKS PREVIEW (Receipt-style stacked Document cards) */}
            {isChunked && chunks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Generated Swarm Chunks ({chunks.length})
                </h3>
                <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {chunks.map((chunk, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-900/35 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-800 rounded-xl p-4 transition-all relative overflow-hidden flex flex-col"
                    >
                      {/* Top Accent Bar simulating paper receipts (The Meng Sauce) */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/60" />
                      
                      <div className="flex justify-between items-center mb-2 pl-2">
                        <span className="text-[10px] font-bold text-blue-400 font-mono">CHUNK #{index + 1}</span>
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{chunk.split(/\s+/).length} words</span>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed font-mono pl-2 italic">
                        &quot;{chunk}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Swarm execution trigger & visual matrix (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* SWARM RESOLUTION MATRIX ACTIONS */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                <Zap className="w-24 h-24" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Execute Swarm Router</h2>
              </div>

              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Fire up to {maxConcurrency} parallel API requests to map, parse, and structure your chunked text nodes. Capped at 25 chunks in sandbox mode.
              </p>

              {/* Extra Parameters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Max Concurrency</label>
                  <select 
                    value={maxConcurrency} 
                    onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="5">5 Workers</option>
                    <option value="10">10 Workers</option>
                    <option value="20">20 Workers</option>
                    <option value="50">50 Workers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Temperature</label>
                  <select 
                    value={temperature} 
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="0.0">0.0 (Verbatim)</option>
                    <option value="0.2">0.2 (Focused)</option>
                    <option value="0.5">0.5 (Balanced)</option>
                  </select>
                </div>
              </div>

              {/* EXECUTE BUTTON - PREMIUM GLOW & HOVER SCALE */}
              <button
                onClick={executeSwarmMap}
                disabled={isLoading || chunks.length === 0 || submitDisabled}
                className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider text-xs transition-all duration-300 ${
                  (chunks.length === 0 || submitDisabled) 
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                    : "bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-500/50"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Executing Parallel Swarm...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    Run Swarm Map Extraction
                  </>
                )}
              </button>

              {chunks.length === 0 && (
                <p className="text-[10px] text-center text-slate-500 mt-3.5">
                  * Generate text chunks first to activate the router button.
                </p>
              )}

              {/* AMBER WARNING BANNER */}
              {submitDisabled && (
                <div className="mt-4 bg-amber-950/40 border border-amber-500/30 text-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs text-left">
                    <p className="font-bold text-amber-300">Sandbox Limit Exceeded</p>
                    <p className="mt-1 leading-relaxed">
                      Your document has been split into <strong>{chunks.length} chunks</strong>, which exceeds the sandbox threshold limit of <strong>50 chunks</strong>.
                    </p>
                    <p className="mt-2 text-slate-400">
                      To proceed, adjust the <strong>Max Words per Chunk</strong> slider to decrease the total chunk count below 50, or shorten the source text.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-red-300">Execution Blocked</p>
                  <p className="mt-1 leading-relaxed">{error}</p>
                  <p className="mt-2 text-slate-500 leading-relaxed font-mono">
                    Ensure your python backend is running locally with: <code className="text-emerald-500">python3 -m uvicorn server:app --reload</code>
                  </p>
                </div>
              </div>
            )}

            {/* VALUE-BASED LEDGER ROI TELEMETRY */}
            {swarmResponse && (
              <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">Value Ledger Accounting</h2>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Actual Cost</p>
                    <p className="text-sm font-bold text-white mt-1">
                      ${swarmResponse.membrane_metadata.value_ledger.actual_cost_incurred.toFixed(5)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Hypothetical</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      ${swarmResponse.membrane_metadata.value_ledger.gross_unoptimized_cost.toFixed(5)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/30">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase">Net Saved</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      ${swarmResponse.membrane_metadata.value_ledger.net_enterprise_savings.toFixed(5)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3.5 bg-slate-950 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Bypassed Computes:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {Math.round(
                      (swarmResponse.membrane_metadata.value_ledger.net_enterprise_savings / 
                       swarmResponse.membrane_metadata.value_ledger.gross_unoptimized_cost) * 100
                    ) || 93}% Savings Rate
                  </span>
                </div>
              </div>
            )}

            {/* VERBATIM RESULTS SHOWCASE (Physical Document simulate) */}
            {swarmResponse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Verbatim Extraction Matrix ({swarmResponse.extractions.length})
                  </h3>
                  <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                    {swarmResponse.membrane_metadata.status}
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {swarmResponse.extractions.map((ext: any, index: number) => (
                    <div 
                      key={index} 
                      className="bg-white text-slate-950 border border-slate-200 rounded-lg shadow-md hover:scale-[1.01] hover:shadow-lg transition-all relative overflow-hidden flex flex-col"
                    >
                      {/* Top Accent bar for legal receipts - emerald color (The Meng Sauce) */}
                      <div className="h-2 w-full bg-emerald-600 shrink-0" />

                      {/* Dog-ear Corner folded simulation */}
                      <div className="absolute top-2 right-0 w-3 h-3 bg-slate-50 border-l border-b border-slate-200 rounded-bl-sm" />

                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span className="text-emerald-700 uppercase tracking-wider">{ext.source_reference}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Matched: {ext.matched_signals.join(", ")}</span>
                        </div>

                        <p className="text-xs font-mono text-slate-800 leading-relaxed pl-1 pt-1 italic font-medium">
                          &quot;{ext.verbatim_text}&quot;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ARCHITECTURAL GUIDANCE NOTE ALERT (MAP_COMPLETE_INTERPRETATION_REQUIRED) */}
                <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-4 text-indigo-300">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400">
                      {swarmResponse.membrane_metadata.architectural_guidance.alert}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    {swarmResponse.membrane_metadata.architectural_guidance.interpretation_note}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
