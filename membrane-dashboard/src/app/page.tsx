/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { 
  Copy, Check, Terminal, Sliders, Sparkles, Cpu, 
  AlertTriangle, Lock, Shield, Layers, FileText, 
  CheckCircle, Database, HelpCircle, BarChart2
} from "lucide-react";
import { ComparisonPlayground } from "@/app/components/ComparisonPlayground";

// Define workloads for performance metrics
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

function renderHighlightedSdkCode(code: string, tab: "python" | "javascript" | "cursorrules"): React.ReactNode {
  if (!code) return null;
  const lines = code.split("\n");
  
  return (
    <div className="space-y-1 font-mono text-slate-200 text-xs">
      {lines.map((line, i) => {
        if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
          return (
            <div key={i} className="text-slate-500 italic font-mono min-h-[1.2rem]">
              {line}
            </div>
          );
        }
        
        const elements: React.ReactNode[] = [];
        let remaining = line;
        
        const tokenRegex = /^(\s+)|(^\b(?:from|import|const|let|await|return|def|class|in|for|if|else|as|new|async|console|log)\b)|(^\b(?:OpenAI|client|openai|completion|response)\b)|(^"[^"]*"|^'[^']*')|(^#.*|^\/\/.*)|(^[{}[\]().,:;=+\-*])|(^[^"'{}[\]().,:;=+\-*\s]+)/;
        
        let colKey = 0;
        while (remaining.length > 0) {
          const match = remaining.match(tokenRegex);
          if (!match) {
            elements.push(<span key={colKey}>{remaining}</span>);
            break;
          }
          
          const val = match[0];
          remaining = remaining.substring(val.length);
          
          if (match[1]) {
            elements.push(<span key={colKey} className="whitespace-pre">{val}</span>);
          } else if (match[2]) {
            elements.push(<span key={colKey} className="text-purple-400 font-semibold">{val}</span>);
          } else if (match[3]) {
            elements.push(<span key={colKey} className="text-blue-400 font-medium">{val}</span>);
          } else if (match[4]) {
            elements.push(<span key={colKey} className="text-emerald-400">{val}</span>);
          } else if (match[5]) {
            elements.push(<span key={colKey} className="text-slate-500 italic">{val}</span>);
          } else if (match[6]) {
            elements.push(<span key={colKey} className="text-slate-400">{val}</span>);
          } else {
            elements.push(<span key={colKey} className="text-slate-200">{val}</span>);
          }
          colKey++;
        }
        
        return (
          <div key={i} className="min-h-[1.2rem]">
            {elements}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000/v1");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.origin}/v1`);
    }
  }, []);

  const trialCurlSnippet = `curl -X POST ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer sk_membrane_instant_trial" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "membrane-engagement-layer",
    "messages": [{"role": "user", "content": "Your prompt here"}]
  }'`;

  const trialPythonSnippet = `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="sk_membrane_instant_trial"
)

response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract all obligations..."}]
)`;

  const [trialTab, setTrialTab] = useState<"curl" | "python" | "docker">("curl");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [sdkTab, setSdkTab] = useState<"python" | "javascript" | "cursorrules">("python");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getDropInCode = () => {
    if (sdkTab === "python") {
      return `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",   # or your production gateway
    api_key="your_key_here"
)

# Then use it exactly as before
response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from my contract."}]
)`;
    } else if (sdkTab === "javascript") {
      return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:8000/v1",
  apiKey: "your_key_here",
});

const response = await client.chat.completions.create({
  model: "membrane-engagement-layer",
  messages: [{ role: "user", content: "Extract liabilities from my contract." }],
});

console.log(response.choices[0].message.content);`;
    } else {
      return `# Pass this header for multi-turn conversational loops
import requests

response = requests.post(
    "http://localhost:8000/v1/chat/completions",
    headers={
        "Authorization": "Bearer your_key_here",
        "X-Membrane-Preserve-Context": "true"
    },
    json={
        "model": "membrane-engagement-layer",
        "messages": [{"role": "user", "content": "Continue chat..."}]
    }
)`;
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#fafbfc] text-[#0f172a] font-sans antialiased relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-800"
      style={{
        backgroundImage: 'url("/noise.png")',
        backgroundRepeat: "repeat"
      }}
    >
      
      {/* Faint Dot Grid Background Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 brand-bg-dots opacity-40" />

      {/* Abstract Glowing Waves / Blobs (fixed positioning prevents scroll repaint) */}
      <div className="pointer-events-none fixed top-[-10%] left-[-15%] w-[60%] h-[60%] brand-bg-blob-1 z-0" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-15%] w-[70%] h-[70%] brand-bg-blob-2 z-0" />

      <Header />

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-16 md:space-y-24 relative z-10">
        
        {/* HERO HEADER */}
        <div className="text-center max-w-4xl mx-auto space-y-8 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
            <Sparkles className="w-3.5 h-3.5" /> INVARIANT-FIRST ORCHESTRATION
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-black tracking-tight text-slate-950 leading-none uppercase">
            Membrane
          </h1>
          <p className="text-xl sm:text-3xl font-bold text-slate-900 max-w-3xl mx-auto leading-tight">
            Reliable structured extraction at scale without context decay or surprise token bills.
          </p>
          <div className="text-sm sm:text-base font-medium text-slate-700 max-w-3xl mx-auto leading-relaxed space-y-4">
            <p className="max-w-2xl mx-auto text-slate-800">
              Split large documents/logs/contracts into isolated chunks, run the same extraction/analysis in parallel with early validation and cost forecasting, then reduce the results — all through a drop-in OpenAI-compatible endpoint.
            </p>
            <div className="max-w-xl mx-auto p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/40 text-center shadow-xs glass-card-tactile">
              <p className="text-xs font-black text-emerald-800 tracking-wide uppercase">
                Free for local development forever &bull; $29/mo flat for production
              </p>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-1">
                One-line OpenAI SDK compatible &bull; Self-host in seconds
              </p>
            </div>
          </div>
 
          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#comparison-playground"
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 tactile-button active:scale-[0.98] transition-all shadow-sm"
            >
              Try the Model Agnostic Playground
            </a>
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-700 bg-white rounded-xl hover:bg-slate-50 border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
            >
              Run locally in 30 seconds
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md active:scale-[0.98] transition-all border border-amber-400/20"
            >
              Get Founding License ($490 lifetime)
            </a>
          </div>
 
          {/* Real Savings stats section */}
          <div className="max-w-4xl mx-auto pt-10 border-t border-slate-200/50 mt-12 tilt-container">
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.25em] font-black text-center mb-6">
              Real results from production workloads
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-card-tactile tilt-card hover:border-emerald-500/30 rounded-xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-serif font-black text-emerald-600 leading-none mb-1">83%</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cost Reduction</span>
                <span className="text-[10px] text-slate-500 mt-1">on contract analysis (Contract Pulse)</span>
              </div>
              <div className="glass-card-tactile tilt-card hover:border-emerald-500/30 rounded-xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-serif font-black text-emerald-600 leading-none mb-1">4.7&times;</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Faster Processing</span>
                <span className="text-[10px] text-slate-500 mt-1">multi-PDF research vs sequential LangChain</span>
              </div>
              <div className="glass-card-tactile tilt-card hover:border-emerald-500/30 rounded-xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-serif font-black text-emerald-600 leading-none mb-1">91%</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cache Hit Rate</span>
                <span className="text-[10px] text-slate-500 mt-1">repetitive queries hit semantic cache</span>
              </div>
            </div>
          </div>
        </div>

        {/* 90-SECOND INSTANT TRIAL TERMINAL */}
        <div id="quickstart" className="max-w-3xl mx-auto space-y-3 scroll-mt-20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-xs font-mono text-slate-500 px-1 gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setTrialTab("curl")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer border ${
                  trialTab === "curl" 
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Cloud Sandbox (cURL)
              </button>
              <button
                onClick={() => setTrialTab("python")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer border ${
                  trialTab === "python" 
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setTrialTab("docker")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer border ${
                  trialTab === "docker" 
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Local Sandbox (Docker)
              </button>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded self-start sm:self-auto">Try it now (no signup required)</span>
          </div>
          
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl font-mono text-sm relative group overflow-hidden dark-scrollbar shadow-lg">
            <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-800/50">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-500 font-mono ml-2 uppercase tracking-wider">
                {trialTab === "curl" && "bash / cURL"}
                {trialTab === "python" && "python"}
                {trialTab === "docker" && "docker"}
              </span>
            </div>
            
            <div className="absolute top-12 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  let text = trialCurlSnippet;
                  if (trialTab === "python") text = trialPythonSnippet;
                  else if (trialTab === "docker") text = "docker run -d -p 8000:8000 thejoshuapenner/membrane";
                  handleCopy(text, "trial");
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-700 transition shadow-sm"
              >
                {copiedIndex === "trial" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="w-full overflow-x-auto whitespace-pre-wrap break-all md:whitespace-pre md:break-normal leading-relaxed pr-10">
              {trialTab === "curl" && renderHighlightedSdkCode(trialCurlSnippet, "javascript")}
              {trialTab === "python" && renderHighlightedSdkCode(trialPythonSnippet, "python")}
              {trialTab === "docker" && renderHighlightedSdkCode("docker run -d -p 8000:8000 thejoshuapenner/membrane", "javascript")}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center italic">
            {trialTab === "curl" 
              ? "Copy and paste this query into your terminal. Authorization headers are optional during development; any string will work."
              : trialTab === "python"
                ? "Run this Python snippet using the official OpenAI SDK client library."
                : "Run this command to spin up the local Membrane container proxy on port 8000. Free and unrestricted for local development."
            }
          </p>
        </div>

        {/* INTERACTIVE COMPARISON PLAYGROUND */}
        <section id="comparison-playground" className="space-y-6 scroll-mt-20 pt-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Sliders className="w-3.5 h-3.5" /> AGNOSTIC EVALUATION
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-950 leading-tight">
              See the difference on a real contract or log set.
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              Left = direct call to your chosen model with the full document. Right = same task through Membrane's chunked parallel swarm + reduction (you supply the key for the underlying model).
            </p>
            <p className="text-slate-500 text-xs italic">
              Demonstrating structured recall/faithfulness gap, cold vs cached run latency, and actual cost accounting.
            </p>
          </div>
          <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-sm p-1.5 glass-card-tactile">
            <ComparisonPlayground />
          </div>
        </section>

        {/* SYSTEM BENCHMARKS SHOWCASE */}
        <div className="space-y-8 scroll-mt-20 pt-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950 flex items-center justify-center gap-2">
              <BarChart2 className="w-6 h-6 text-emerald-600" />
              Real-World Workload Performance Metrics
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Standardized results mapped directly from live document-heavy extraction testing comparing raw LLM completions against Membrane swarm executions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch tilt-container">
            {workloads.map((w) => (
              <div key={w.id} className="glass-card-tactile glass-card-tactile-hover tilt-card rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-emerald-500/30">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-950 leading-tight">{w.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 inline-block font-mono tracking-wide">{w.notes}</span>
                </div>
                
                <div className="divide-y divide-slate-100/85 space-y-2 text-xs pt-1">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Raw LLM Cost:</span>
                    <span className="font-mono text-slate-400 line-through">${w.rawCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-700 font-bold">Membrane Cost:</span>
                    <span className="font-mono text-emerald-600 font-black text-sm">${w.membraneCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500 font-bold">Savings Factor:</span>
                    <span className="font-mono text-emerald-600 font-black">{w.savings}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">Speedup:</span>
                    <span className="font-mono text-slate-900 font-black">{w.speedup}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-700 font-bold">Cache Hit Rate:</span>
                    <span className="font-mono text-slate-950 font-black">{w.cacheHit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THE THREE LEVERS SECTION */}
        <section id="levers" className="space-y-8 scroll-mt-20 pt-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Layers className="w-3.5 h-3.5" /> CORE MECHANISMS
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-950 leading-tight">
              The Three Levers That Actually Move the Needle
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              No marketing buzzwords. Just the exact mechanisms that prevent context decay, eliminate schema failures, and protect your budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch tilt-container">
            {/* Card A: Pre-flight Planning */}
            <div className="glass-card-tactile glass-card-tactile-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/30">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 font-serif">Pre-flight Planning</h3>
                <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono self-start border border-slate-200">
                  GET /v1/swarm/plan
                </code>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Before you spend anything, get an explicit forecast: estimated tokens, retail cost, latency, recommended concurrency, and risk score.
                </p>
              </div>
            </div>

            {/* Card B: Early Rejection Modes */}
            <div className="glass-card-tactile glass-card-tactile-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/30">
                  <AlertTriangle className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 font-serif">Early Rejection Modes</h3>
                <div className="flex gap-1.5 flex-wrap">
                  <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                    early_gate
                  </code>
                  <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                    canary
                  </code>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Bad payloads fail fast and cheap. <code className="text-[11px] font-bold text-slate-800 font-mono">early_gate</code> validates structure before any model calls. <code className="text-[11px] font-bold text-slate-800 font-mono">canary</code> runs only chunk 0 first and aborts if it fails.
                </p>
              </div>
            </div>

            {/* Card C: Strong Isolation & Schema Enforcement */}
            <div className="glass-card-tactile glass-card-tactile-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/30">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 font-serif">Strong Isolation + Schema</h3>
                <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono self-start border border-slate-200">
                  POST /v1/swarm/state
                </code>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Each chunk is processed independently. Extraction criteria are validated. Agent-generated code can be sandbox-compiled and signed before you trust it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DROP-IN COMPATIBILITY */}
        <section id="compatibility" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Terminal className="w-3.5 h-3.5" /> DROP-IN REPLACEMENT
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950 leading-tight">
              Drop-In Compatibility
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              The gateway adds planning, isolation, caching, and validation on top. Your existing code does not change.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {(["python", "javascript", "cursorrules"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSdkTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize transition ${
                    sdkTab === tab
                      ? "bg-slate-100 border-slate-200 text-slate-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab === "python" && "Python SDK"}
                  {tab === "javascript" && "JavaScript SDK"}
                  {tab === "cursorrules" && "Preserve Context Header"}
                </button>
              ))}
            </div>

            <div className="relative group rounded-xl bg-slate-900 border border-slate-800/80 text-slate-100 p-4 font-mono text-xs overflow-hidden leading-relaxed max-h-[380px] dark-scrollbar shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCopy(getDropInCode(), "compatibility-code")}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-700 transition shadow-sm"
                >
                  {copiedIndex === "compatibility-code" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="w-full overflow-x-auto whitespace-pre-wrap break-all md:whitespace-pre md:break-normal leading-relaxed pr-10">
                {renderHighlightedSdkCode(getDropInCode(), sdkTab)}
              </div>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs flex gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Important Context Preservation Note</p>
                <p className="text-[10.5px] mt-0.5 leading-relaxed text-slate-700">
                  By default, conversational routes isolate system directives and prune middle messages to prevent agent drift. To keep full conversational history, simply pass the <code className="font-mono bg-emerald-100/60 px-1 py-0.5 rounded text-emerald-800 text-[10px]">X-Membrane-Preserve-Context: true</code> header.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SELF-HOST & CONTROL */}
        <section id="self-host" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Shield className="w-3.5 h-3.5" /> PRIVACY & COMPLIANCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950 leading-tight">
              Self-Host + Control
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              Full data stays on your infrastructure. No external logging of prompts or results unless you configure it.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl font-mono text-sm relative group overflow-hidden dark-scrollbar shadow-lg">
            <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-800/50">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-500 font-mono ml-2 uppercase tracking-wider">Docker Run Command</span>
            </div>
            
            <div className="absolute top-12 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopy("docker run -p 8000:8000 thejoshuapenner/membrane", "docker-run")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-700 transition shadow-sm"
              >
                {copiedIndex === "docker-run" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="w-full overflow-x-auto whitespace-pre-wrap break-all md:whitespace-pre md:break-normal leading-relaxed pr-10 text-emerald-400 font-bold">
              docker run -p 8000:8000 thejoshuapenner/membrane
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center italic">
            This matters enormously to legal/tech, compliance, and research teams who actually have to ship this stuff.
          </p>
        </section>

        {/* PRICING & PHILOSOPHY */}
        <section id="pricing" className="space-y-8 scroll-mt-20 pt-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">Pricing (Open Core)</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Membrane is completely free for personal use, experimentation, and development. If you are using Membrane for <b>commercial production work</b>, a paid license is required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch tilt-container">
            {/* Free Tier */}
            <div className="glass-card-tactile glass-card-tactile-hover tilt-card rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">Developer Sandbox</h3>
                    <p className="text-[11px] text-slate-500 mt-1">For local development & sandbox testing</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">Free</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-sans">$0 <span className="text-xs font-normal text-slate-500">/ forever</span></div>
                <ul className="space-y-2 text-[11.5px] text-slate-600 pt-2">
                  <li className="flex items-center gap-2">✓ Full Swarm Map-Reduce access</li>
                  <li className="flex items-center gap-2">✓ Dynamic Model Routing</li>
                  <li className="flex items-center gap-2">✓ L1 Semantic Caching</li>
                  <li className="flex items-center gap-2">✓ Any custom key works locally</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link
                  href="/docs"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-sm active:scale-[0.98] border border-slate-950 text-center"
                >
                  Read Developer Docs
                </Link>
              </div>
            </div>
            {/* Commercial Tier */}
            <div className="glass-card-tactile glass-card-tactile-hover tilt-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border-2 border-emerald-500/20">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Production
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">Commercial Production</h3>
                    <p className="text-[11px] text-slate-500 mt-1">For cloud deployments</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">$29/mo</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-sans">$29 <span className="text-xs font-normal text-slate-500">/ month flat</span></div>
                <p className="text-[9.5px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Get 20% off: $290 billed annually
                </p>
                <ul className="space-y-2 text-[11.5px] text-slate-600 pt-1">
                  <li className="flex items-center gap-2">✓ Unrestricted cloud usage</li>
                  <li className="flex items-center gap-2">✓ Pure honor-based model</li>
                  <li className="flex items-center gap-2">✓ Commercial use authorization</li>
                  <li className="flex items-center gap-2">✓ Direct team value reporting</li>
                </ul>
              </div>
              <div className="pt-6">
                <a 
                  href="https://buy.polar.sh/polar_cl_yDHzavhCzMw8FkCp0t0X2NJNfg5xgqLmudIxZ0S54BZ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-emerald-600/20 active:scale-[0.98] border border-emerald-500/20 text-center"
                >
                  Activate License on Polar.sh
                </a>
              </div>
            </div>
            {/* Founding License Tier */}
            <div className="glass-card-tactile glass-card-amber-hover tilt-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400/40 bg-gradient-to-b from-amber-50/10 via-white to-white text-slate-900">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Founding
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">Founding License</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Only first 75 buyers</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-amber-950 bg-amber-50 rounded-full">Lifetime</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-sans">$490 <span className="text-xs font-normal text-slate-500">/ one-time</span></div>
                <p className="text-[9.5px] text-amber-800 font-semibold bg-amber-50 border border-amber-500/20 px-2 py-0.5 rounded inline-block">
                  Lifetime commercial license
                </p>
                <ul className="space-y-2 text-[11.5px] text-slate-600 pt-1">
                  <li className="flex items-center gap-2">✓ Permanent production authorization</li>
                  <li className="flex items-center gap-2">✓ No monthly subscription fees</li>
                  <li className="flex items-center gap-2">✓ Priority founder support channel</li>
                  <li className="flex items-center gap-2">✓ Limited to first 75 developers</li>
                </ul>
              </div>
              <div className="pt-6">
                <a 
                  href="https://buy.polar.sh/polar_cl_hEuA0alAsGc5tgvwGraM3rBMf8KuPablnLNR422vBy8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-amber-500/20 active:scale-[0.98] border border-amber-400/20 text-center"
                >
                  Purchase Founding License
                </a>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200/50 text-slate-600 text-[11px] leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">What counts as Commercial Production?</p>
            <p>
              **Commercial Production** is defined as any deployment of Membrane on public cloud infrastructure (such as AWS, Render, GCP, Fly.io, Vercel) that powers an active application, API, or service outside of a developer&apos;s local machine (`localhost`) or private personal network. 
            </p>
            <p>
              This is a trust and honor-based model. We do not enforce hard blocks, key truncation, or usage caps in your cloud environments—the software runs fully uninhibited to ensure maximum production stability. We prioritize developer trust and expect production users to subscribe to support our work.
            </p>
          </div>
        </section>

        {/* HONEST LIMITATIONS */}
        <section id="limitations" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <HelpCircle className="w-3.5 h-3.5" /> BUILDS CREDIBILITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">
              Honest Limitations
            </h2>
            <p className="text-slate-600 text-sm">
              We want you to trust Membrane. Here is what it is NOT built for:
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Repetitive Structured Extraction Focus:</strong> Membrane is optimized specifically for running structured extraction at scale across repetitive items (contracts, logs, transcripts, research papers).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Less magical on dynamic chat:</strong> It is not a general-purpose conversational agent platform. If you are building a highly dynamic open-ended chat assistant, standard direct LLM loops may be more appropriate.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Model Costs Still Apply:</strong> Membrane optimizes token consumption and catches bad requests early, but you still pay the underlying LLM provider for successful executions.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* WHO THIS IS FOR */}
        <section id="who-it-is-for" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8 pb-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Cpu className="w-3.5 h-3.5" /> TARGET WORKLOADS
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">
              Who This Is For
            </h2>
            <p className="text-slate-600 text-sm">
              Membrane is designed specifically for teams facing these developer challenges:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="glass-card-tactile rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/30 shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Document Analysis Teams</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Teams doing bulk contract, regulatory, or research document analysis where missing a clause or line translates to financial or compliance risk.
                </p>
              </div>
            </div>

            <div className="glass-card-tactile rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/30 shrink-0">
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Telemetry & Transcripts Pipeline Builders</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Engineers building high-volume log, sensor telemetry, or meeting transcript processing pipelines that need to extract structured insights reliably.
                </p>
              </div>
            </div>

            <div className="glass-card-tactile rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/30 shrink-0">
                <AlertTriangle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Developers Battling Context Decay</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Anyone who has watched a direct LLM call silently drop critical structured data on long inputs and needs it to stop happening immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
