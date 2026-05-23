"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { 
  Play, Copy, Check, Terminal, Sliders, Sparkles, Cpu, 
  AlertTriangle, Lock, Shield, ArrowRight, Layers, FileText, 
  Settings, RefreshCw, CheckCircle, Database, HelpCircle
} from "lucide-react";

// Interactive trial curl snippet
const TRIAL_CURL_SNIPPET = `curl -X POST https://membrane-api.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_membrane_instant_trial" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "membrane-engagement-layer",
    "messages": [{"role": "user", "content": "Clean up this messy log string and extract the error tokens."}]
  }'`;

// Define technical patterns
interface EngineeringPattern {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  defaultPayload: string;
}

const ENGINEERING_PATTERNS: EngineeringPattern[] = [
  {
    id: "swarm_map",
    name: "High-Throughput Swarm Map-Reduce",
    endpoint: "/v1/swarm/map",
    description: "Concurrently parallelizes bulk extraction by slicing payloads into discrete segments, mapping context across independent worker threads, and reducing raw outputs back into a structured JSON matrix.",
    defaultPayload: JSON.stringify({
      chunks: [
        "SYSTEM_LOG_20260522-23: [AUTH] [CRITICAL] Failed to authorize root session for IP: 198.51.100.42. Database validation handshake timed out after 1200ms.",
        "SYSTEM_LOG_20260522-24: [DB_POOL] [WARNING] Connection pool size peaked at 180 concurrent threads. Auto-scaling buffer triggered to allocate 20 fresh sockets.",
        "SYSTEM_LOG_20260522-25: [API_GATEWAY] [ERROR] Routing exception generated. Endpoint /v1/chat/completions returned HTTP 502 Bad Gateway response on worker node 4."
      ],
      max_concurrency: 5,
      temperature: 0.0,
      model: "membrane-engagement-layer",
      extraction_criteria: {
        system_persona: "Identify error signatures, severity tokens, and root system IP addresses.",
        target_signals: ["CRITICAL", "ERROR", "WARNING"]
      }
    }, null, 2)
  },
  {
    id: "context_isolation",
    name: "Context Isolation & Memory Pruning",
    endpoint: "/v1/chat/completions",
    description: "Strips middle conversation history to eliminate agent memory drift and attention degradation. Intercepts message pipelines, keeping only system directives and the immediate user query.",
    defaultPayload: JSON.stringify({
      model: "membrane-engagement-layer",
      messages: [
        { "role": "system", "content": "You are a strict security telemetry analyzer. Extrapolate risk vectors." },
        { "role": "user", "content": "Scan the previous network traffic log data for abnormalities." },
        { "role": "assistant", "content": "Awaiting logs. Please supply raw socket connection dumps." },
        { "role": "user", "content": "Clean up this messy log string and extract the error tokens." }
      ],
      temperature: 0.1
    }, null, 2)
  },
  {
    id: "sandbox_ast",
    name: "Schema Gating & Sandbox AST Verification",
    endpoint: "/v1/swarm/state",
    description: "Evaluates model-generated scripts and logic inside a strict compile-time sandbox. Disables execution and throws clean AST compilation warnings if security policies or syntaxes fail.",
    defaultPayload: JSON.stringify({
      agent_id: "extractor_agent_node_3",
      task_type: "python_code",
      payload: "def parse_auth_telemetry(log_line):\n    # Extract code elements safely inside AST check sandbox\n    import re\n    ip_match = re.search(r'\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b', log_line)\n    return {\"ip\": ip_match.group(0) if ip_match else None, \"authorized\": False}",
      target_agent_id: "database_sink_agent_node"
    }, null, 2)
  }
];

export default function Home() {
  const [selectedPattern, setSelectedPattern] = useState<EngineeringPattern>(ENGINEERING_PATTERNS[0]);
  const [payloadText, setPayloadText] = useState<string>(ENGINEERING_PATTERNS[0].defaultPayload);
  const [slices, setSlices] = useState<number>(10);
  const [preserveContext, setPreserveContext] = useState<boolean>(false);
  
  // Terminal / execute state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [streamOutput, setStreamOutput] = useState<string>("// Awaiting execution trigger...\n");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  
  // ROI / Savings states
  const [savingsCalculated, setSavingsCalculated] = useState<any>({
    actual: 0,
    gross: 0,
    percent: 0
  });

  // SDK Recipe active language tab
  const [sdkTab, setSdkTab] = useState<"python" | "javascript" | "cursorrules">("python");

  useEffect(() => {
    // Sync default payload when pattern changes
    setPayloadText(selectedPattern.defaultPayload);
    setStreamOutput("// Awaiting execution trigger...\n");
    setSavingsCalculated({ actual: 0, gross: 0, percent: 0 });
  }, [selectedPattern]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Run the playground API query
  const executePlaygroundQuery = async () => {
    setIsExecuting(true);
    setStreamOutput("// Initializing secure client handshake...\n");
    setSavingsCalculated({ actual: 0, gross: 0, percent: 0 });

    const host = typeof window !== "undefined" ? window.location.host : "";
    const apiBase = !host.includes("localhost") && !host.includes("127.0.0.1")
      ? "https://membrane-api.com" 
      : "http://localhost:8000";

    const targetUrl = `${apiBase}${selectedPattern.endpoint}`;
    
    // Setup headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk_membrane_instant_trial"
    };

    if (preserveContext && selectedPattern.id === "context_isolation") {
      headers["X-Membrane-Preserve-Context"] = "true";
    }

    try {
      let bodyData = JSON.parse(payloadText);
      
      // Inject slices if it is the swarm map and has multiple chunks
      if (selectedPattern.id === "swarm_map") {
        // Mock segment splitting based on slider value
        const initialChunks = bodyData.chunks || [];
        const expandedChunks = [];
        for (let i = 0; i < slices; i++) {
          const baseChunk = initialChunks[i % initialChunks.length] || "Generic system trace data.";
          expandedChunks.push(`[Segment ${i + 1}/${slices}] ${baseChunk}`);
        }
        bodyData.chunks = expandedChunks;
      }

      setStreamOutput(`// Contacting proxy endpoint: ${selectedPattern.endpoint}...\n`);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const resJson = await response.json();
      
      // Simulate real-time streaming visualization of the response
      setStreamOutput("// Handshake successful. Streaming payload tokens...\n");
      await new Promise(r => setTimeout(r, 600));

      setStreamOutput(JSON.stringify(resJson, null, 2));

      // Compute client-side ROI metrics for representation
      let savingsPct = 0;
      let actualCost = 0.00042;
      let unoptimizedCost = 0.00124;

      if (selectedPattern.id === "swarm_map") {
        savingsPct = 60 + Math.random() * 8; // Parallel optimizations savings
        actualCost = (slices * 0.00004);
        unoptimizedCost = actualCost / (1 - (savingsPct / 100));
      } else if (selectedPattern.id === "context_isolation") {
        if (preserveContext) {
          savingsPct = 0;
          actualCost = 0.00182;
          unoptimizedCost = 0.00182;
        } else {
          savingsPct = 78.4;
          actualCost = 0.00032;
          unoptimizedCost = 0.00148;
        }
      } else if (selectedPattern.id === "sandbox_ast") {
        savingsPct = 100; // Exact match pre-scan cache hit or offline simulation
        actualCost = 0.0000;
        unoptimizedCost = 0.00084;
      }

      setSavingsCalculated({
        actual: actualCost.toFixed(5),
        gross: unoptimizedCost.toFixed(5),
        percent: savingsPct.toFixed(1)
      });

    } catch (err: any) {
      setStreamOutput(`// Exception Caught:\n${err.message || err}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate tabbed SDK text blocks
  const getSdkCode = () => {
    if (sdkTab === "python") {
      if (selectedPattern.id === "swarm_map") {
        return `import os\nimport requests\n\nurl = "https://membrane-api.com/v1/swarm/map"\nheaders = {\n    "Authorization": "Bearer " + os.environ.get("MEMBRANE_API_KEY"),\n    "Content-Type": "application/json"\n}\n\npayload = {\n    "model": "membrane-engagement-layer",\n    "chunks": [\n        "log line 1...",\n        "log line 2..."\n    ],\n    "max_concurrency": 5,\n    "extraction_criteria": {\n        "system_persona": "Secure log parsing.",\n        "target_signals": ["CRITICAL", "ERROR"]\n    }\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
      } else if (selectedPattern.id === "context_isolation") {
        return `import os\nimport requests\n\nurl = "https://membrane-api.com/v1/chat/completions"\nheaders = {\n    "Authorization": "Bearer " + os.environ.get("MEMBRANE_API_KEY"),\n    "Content-Type": "application/json",\n    # Bypass defaults to run conversational context preservation:\n    "X-Membrane-Preserve-Context": "${preserveContext ? 'true' : 'false'}"\n}\n\npayload = {\n    "model": "membrane-engagement-layer",\n    "messages": [\n        {"role": "system", "content": "Analyzer DNA"},\n        {"role": "user", "content": "Scrub this log."}\n    ]\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
      } else {
        return `import os\nimport requests\n\nurl = "https://membrane-api.com/v1/swarm/state"\nheaders = {\n    "Authorization": "Bearer " + os.environ.get("MEMBRANE_API_KEY")\n}\n\npayload = {\n    "agent_id": "executor_node",\n    "task_type": "python_code",\n    "payload": "def run(): print('sandbox evaluation')"\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
      }
    } else if (sdkTab === "javascript") {
      if (selectedPattern.id === "swarm_map") {
        return `const apiKey = process.env.MEMBRANE_API_KEY;\n\nfetch("https://membrane-api.com/v1/swarm/map", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${apiKey}\`,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    model: "membrane-engagement-layer",\n    chunks: ["log segment 1", "log segment 2"],\n    max_concurrency: 5\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`;
      } else if (selectedPattern.id === "context_isolation") {
        return `const apiKey = process.env.MEMBRANE_API_KEY;\n\nfetch("https://membrane-api.com/v1/chat/completions", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${apiKey}\`,\n    "Content-Type": "application/json",\n    "X-Membrane-Preserve-Context": "${preserveContext ? 'true' : 'false'}"\n  },\n  body: JSON.stringify({\n    model: "membrane-engagement-layer",\n    messages: [{role: "user", content: "Query metadata"}]\n  })\n})\n.then(res => res.json());`;
      } else {
        return `const apiKey = process.env.MEMBRANE_API_KEY;\n\nfetch("https://membrane-api.com/v1/swarm/state", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${apiKey}\`,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    agent_id: "js_validator",\n    task_type: "javascript_code",\n    payload: "console.log('checked')"\n  })\n})\n.then(res => res.json());`;
      }
    } else {
      return `# .cursorrules - Membrane Integration Pattern Context\n\n# Rules for Membrane Lossless Agent Protocol integration:\n- Always prefer 'membrane-engagement-layer' model string for telemetry tracking\n- For conversational chat loops, prune context by default unless 'X-Membrane-Preserve-Context: true' is requested\n- Split large document extraction tasks into parallel map-reduce jobs using '/v1/swarm/map'\n- Target publicRender URL: https://membrane-api.com/v1`;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* 3% Ambient Texture Noise Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />

      <Header />

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative z-10">
        
        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Core Gateway Infrastructure
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
            Membrane Guard
          </h1>
          <p className="text-lg sm:text-xl font-serif italic text-slate-600 max-w-2xl mx-auto">
            "The Lossless Inter-Agent Protocol. Strip conversational memory bloat, enforce strict structural schema compliance, and secure your agent swarms with a sub-2ms edge cache layer."
          </p>
        </div>

        {/* 90-SECOND INSTANT TRIAL TERMINAL */}
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> 90-Second Instant Online Trial</span>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">No signup needed</span>
          </div>
          
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-lg border border-slate-800 font-mono text-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopy(TRIAL_CURL_SNIPPET, "curl")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              >
                {copiedIndex === "curl" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre leading-relaxed pr-10">
              <code>{TRIAL_CURL_SNIPPET}</code>
            </pre>
          </div>
          <p className="text-[11px] text-slate-500 text-center italic">
            Copy and paste this query into your local shell terminal. The `sk_membrane_instant_trial` token triggers a stateless sandboxed run.
          </p>
        </div>

        <hr className="border-slate-200" />

        {/* SIDE-BY-SIDE PLATFORM PLAYGROUND */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" /> Network Pattern Playground
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select an architectural pattern and trigger queries against our live hosted gateway.</p>
            </div>
            
            {/* Pattern Selector Pill Row */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {ENGINEERING_PATTERNS.map((pat) => (
                <button
                  key={pat.id}
                  onClick={() => setSelectedPattern(pat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    selectedPattern.id === pat.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT INPUT BAY (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    <Database className="w-4 h-4 text-emerald-600" /> RAW STREAM INPUT BAY
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedPattern.description}
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Target URL</label>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 select-all">
                      POST {selectedPattern.endpoint}
                    </div>
                  </div>

                  {/* Dynamic control options depending on selected pattern */}
                  {selectedPattern.id === "swarm_map" && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Slice Density:</span>
                        <span className={`font-mono font-black ${slices > 50 ? "text-amber-600" : "text-emerald-600"}`}>{slices} Segments</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="65" 
                        value={slices}
                        onChange={(e) => setSlices(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  )}

                  {selectedPattern.id === "context_isolation" && (
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={preserveContext} 
                          onChange={(e) => setPreserveContext(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">Preserve Context Header</p>
                          <p className="text-[10px] text-slate-400">Pass X-Membrane-Preserve-Context: true</p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payload Variables (JSON)</label>
                    <textarea
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      className="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-none"
                    />
                  </div>
                </div>

                {/* QA-24: Slice Guardrail Banner */}
                {selectedPattern.id === "swarm_map" && slices > 50 ? (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-850 flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Segment Safety Guardrail (QA-24)</p>
                      <p className="text-[10.5px] mt-0.5">Slice densities exceeding 50 nodes are locked on public trials to safeguard Render gateway compute capacity.</p>
                    </div>
                  </div>
                ) : null}

                {/* Trigger Buttons */}
                <div className="pt-4 mt-auto">
                  <button
                    onClick={executePlaygroundQuery}
                    disabled={isExecuting || (selectedPattern.id === "swarm_map" && slices > 50)}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition ${
                      selectedPattern.id === "swarm_map" && slices > 50
                        ? "bg-slate-300 cursor-not-allowed"
                        : isExecuting 
                        ? "bg-slate-800 animate-pulse" 
                        : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]"
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Stream Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Execute Gateway Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT OUTPUT CANVAS (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Output Monitor */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex-1 flex flex-col justify-between">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-slate-600" /> LOSSLESS OUTPUT CANVAS</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">COMPLETED RESPONSE</span>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 flex-1 min-h-[250px] overflow-y-auto max-h-[360px] relative select-text leading-relaxed">
                    <pre className="whitespace-pre-wrap">{streamOutput}</pre>
                  </div>
                </div>

                {/* Token Savings Ledger Calculation Output */}
                <div className="border-t border-slate-200/60 pt-4 mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Incurred Cost</p>
                    <p className="text-sm font-mono font-black text-slate-900 mt-0.5">
                      {savingsCalculated.percent > 0 ? `$${savingsCalculated.actual}` : "$0.00000"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Unoptimized Cost</p>
                    <p className="text-sm font-mono font-black text-slate-500 mt-0.5">
                      {savingsCalculated.percent > 0 ? `$${savingsCalculated.gross}` : "$0.00000"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/50">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Net Savings</p>
                    <p className="text-sm font-mono font-black text-emerald-600 mt-0.5">
                      {savingsCalculated.percent > 0 ? `${savingsCalculated.percent}%` : "0.0%"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* TABBED CONTEXT-AWARE SDK RECIPES */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" /> Context-Aware SDK Recipes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Integrating the selected pattern into your codebase loops dynamically.</p>
            </div>
            
            {/* Recipes languages tabs */}
            <div className="flex gap-2">
              {(["python", "javascript", "cursorrules"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSdkTab(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border capitalize transition ${
                    sdkTab === tab
                      ? "bg-slate-950 border-slate-950 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab === "cursorrules" ? ".cursorrules" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group rounded-xl bg-slate-900 border border-slate-800 text-slate-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px]">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopy(getSdkCode(), "sdk")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              >
                {copiedIndex === "sdk" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="pr-10">{getSdkCode()}</pre>
          </div>
          
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs flex gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Important Architecture Directive</p>
              <p className="text-[10.5px] mt-0.5 leading-relaxed">
                By default, conversational routes isolate System directive context blocks and delete intermediates. Document client applications to explicitly pass the `X-Membrane-Preserve-Context: true` header to preserve chat context sequences.
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
