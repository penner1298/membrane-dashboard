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
          <p className="text-xl sm:text-2xl font-bold text-slate-900 max-w-3xl mx-auto leading-tight">
            Reliable structured extraction on large documents without context decay or surprise token bills.
          </p>
          <div className="text-sm sm:text-base font-medium text-slate-700 max-w-3xl mx-auto leading-relaxed space-y-4">
            <p className="max-w-2xl mx-auto text-slate-800">
              Split documents into isolated chunks, run the same analysis in parallel with early validation and pre-flight forecasting, then reduce the results — through a drop-in OpenAI-compatible gateway.
            </p>
            <div className="max-w-xl mx-auto p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/40 text-center shadow-xs glass-card-tactile">
              <p className="text-xs font-black text-emerald-800 tracking-wide uppercase">
                Free for local development forever &bull; $29/mo flat for production
              </p>
            </div>
          </div>
 
          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-6 pt-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#comparison-playground"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 tactile-button active:scale-[0.98] transition-all shadow-sm"
              >
                Open the Model Agnostic Playground
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md active:scale-[0.98] transition-all border border-amber-400/20"
              >
                Get Founding License ($490 lifetime)
              </a>
            </div>
            
            {/* Run Locally Quick Terminal Widget */}
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <span className="text-[10px] font-mono text-emerald-500 select-none shrink-0">$</span>
                <span className="text-xs font-mono text-slate-200 select-all truncate">
                  docker run -d -p 8000:8000 membraneapi/gateway
                </span>
              </div>
              <button
                onClick={() => handleCopy("docker run -d -p 8000:8000 membraneapi/gateway", "hero-docker")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100 border border-slate-700 transition shrink-0"
                title="Copy Docker command"
              >
                {copiedIndex === "hero-docker" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider -mt-3">
              Or run <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[9px] border border-slate-200">python server.py</code> locally
            </p>
          </div>
        </div>

        {/* INTERACTIVE COMPARISON PLAYGROUND */}
        <section id="comparison-playground" className="space-y-6 scroll-mt-20 pt-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Sliders className="w-3.5 h-3.5" /> AGNOSTIC EVALUATION
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-950 leading-tight">
              See the architectural difference on real documents.
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              Left column = direct call to your chosen model with the full document in one context. Right columns = the same task through Membrane's chunked parallel swarm + reduction layer (you supply the key for the underlying model).
            </p>
            <p className="text-slate-500 text-xs italic">
              Compare structure extraction accuracy, processing latency, and token costs in real time.
            </p>
          </div>
          <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-sm p-1.5 glass-card-tactile">
            <ComparisonPlayground />
          </div>
        </section>

        {/* THE THREE LEVERS SECTION */}
        <section id="levers" className="space-y-8 scroll-mt-20 pt-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Layers className="w-3.5 h-3.5" /> CORE MECHANISMS
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-950 leading-tight">
              The Three Levers
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              This solves the exact painful thing you hit on long documents or bulk structured work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch tilt-container">
            {/* Card A: Pre-flight Planning */}
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/30">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 font-serif">Pre-flight Planning</h3>
                <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono self-start border border-slate-200">
                  GET /v1/swarm/plan
                </code>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Get an explicit forecast of estimated tokens, cost, latency, recommended concurrency, and risk score before you spend anything.
                </p>
              </div>
            </div>

            {/* Card B: Early Rejection Modes */}
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
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
                  Bad jobs fail fast and cheap. <code className="font-bold text-slate-800 font-mono">early_gate</code> validates structure with zero model calls. <code className="font-bold text-slate-800 font-mono">canary</code> runs only the first chunk and aborts on failure.
                </p>
              </div>
            </div>

            {/* Card C: Isolation + Schema Controls */}
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between border border-slate-200 hover:border-emerald-500/30 shadow-xs">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/30">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950 font-serif">Isolation + Schema Controls</h3>
                <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono self-start border border-slate-200">
                  POST /v1/swarm/state
                </code>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Each chunk runs independently. Extraction criteria are validated. Agent-generated code can be sandbox-compiled and signed before you trust it.
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
              Drop-in Compatibility
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              Your existing OpenAI SDK code works. The gateway adds planning, isolation, early rejection, and caching on top.
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
              Self-Host & Control
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              Full data stays in your environment. No external logging of prompts unless you configure it.
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
                onClick={() => handleCopy("docker run -p 8000:8000 membraneapi/gateway", "docker-run")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-700 transition shadow-sm"
              >
                {copiedIndex === "docker-run" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="w-full overflow-x-auto whitespace-pre-wrap break-all md:whitespace-pre md:break-normal leading-relaxed pr-10 text-emerald-400 font-bold">
              docker run -p 8000:8000 membraneapi/gateway
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center italic">
            Essential for teams processing proprietary, compliance-heavy, or regulated documents.
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
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 hover:border-emerald-500/40">
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
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-sm active:scale-[0.98] border border-slate-950 text-center font-sans"
                >
                  Read Developer Docs
                </Link>
              </div>
            </div>
            {/* Commercial Tier */}
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-emerald-500/20">
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
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-emerald-600/20 active:scale-[0.98] border border-emerald-500/20 text-center font-sans"
                >
                  Activate License on Polar.sh
                </a>
              </div>
            </div>
            {/* Founding License Tier */}
            <div className="glass-card-tactile rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-amber-400/40 bg-gradient-to-b from-amber-50/10 via-white to-white text-slate-900">
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
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-amber-500/20 active:scale-[0.98] border border-amber-400/20 text-center font-sans"
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

        {/* REAL APPLICATIONS */}
        <section id="real-applications" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <Database className="w-3.5 h-3.5" /> Case Studies
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">
              Real applications
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              Membrane is used in production on document-heavy, high-stakes extraction workloads.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <ul className="space-y-4 text-xs sm:text-sm text-slate-700 animate-fade-in">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Contract analysis</strong> &mdash; <a href="https://contract-pulse.app" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold underline hover:text-emerald-700">Contract Pulse</a> uses Membrane&apos;s parallel swarm extraction to surface hidden risks and special clauses across long legal PDFs with strong isolation and early validation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Policy &amp; government documents</strong> &mdash; <a href="https://pennergraph.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold underline hover:text-emerald-700">PennerAI</a> runs Membrane swarms over state audits, city council minutes, and regulatory files to extract structured signals that direct LLM calls frequently miss.
                </span>
              </li>
            </ul>
            <div className="pt-2 text-center border-t border-slate-200/50 mt-4">
              <p className="text-xs text-slate-500">
                More examples and technical detail are in the <Link href="/docs" className="text-emerald-600 font-bold underline hover:text-emerald-700">docs</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* HONEST LIMITATIONS */}
        <section id="limitations" className="max-w-3xl mx-auto space-y-6 scroll-mt-20 pt-8 pb-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
              <HelpCircle className="w-3.5 h-3.5" /> LIMITATIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">
              Honest Limitations
            </h2>
            <p className="text-slate-600 text-sm">
              We want you to trust Membrane. Here is what it is NOT built for:
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <ul className="space-y-4 text-xs sm:text-sm text-slate-700 font-sans">
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Repetitive Structured Extraction Focus:</strong> Membrane is strongest on repetitive structured extraction across many similar items (contracts, logs, transcripts, policy docs).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Less magic on dynamic chat:</strong> It is less magic on highly dynamic, open-ended conversational agents.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Model Costs Still Apply:</strong> You still pay for the underlying model calls &mdash; we just try to make fewer of them wasteful.
                </span>
              </li>
            </ul>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

