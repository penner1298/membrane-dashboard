"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Terminal as TerminalIcon, 
  Zap, 
  BookOpen, 
  Coins, 
  Shield, 
  Code, 
  Play, 
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle,
  FileText
} from "lucide-react";

export default function CaseStudyPage() {
  const [streamActive, setStreamActive] = useState(false);
  const [streamStep, setStreamStep] = useState(0);
  const [streamOutput, setStreamOutput] = useState("");
  const [showCitations, setShowCitations] = useState(false);

  // NDJSON Stream Simulation
  const streamData = [
    { type: "meta", text: "⚡ [0ms] Initializing GIS Parcel Query for: 23510 E Sharp Ct" },
    { type: "meta", text: "🔍 [80ms] GIS Resolved: Parcel 45163.0210 | Zoning: Single-Family Residential (R-1)" },
    { type: "meta", text: "📚 [140ms] Extracting municipal code sections matching targeted zones..." },
    { type: "citation", text: "citations_resolved" },
    { type: "meta", text: "🧠 [210ms] Context pre-filtering complete: 56 chunks loaded (Under 50 Swarm threshold)" },
    { type: "meta", text: "🛡️ [220ms] Threat Firewall scan: CLEAN (No policy violations detected)" },
    { type: "meta", text: "🚀 [240ms] Streaming payload to Membrane reasoning layer (Consecutive Cache: ACTIVE)..." },
    { type: "content", text: "### Zoning Oracle Determination\n\nBased on your location at **23510 E Sharp Ct (Zone R-1)**, building a backyard accessory structure (detached garage/shed) is **Permitted with Limitations** under the Liberty Lake Municipal Code.\n\n" },
    { type: "content", text: "#### Strict Regulatory Limits:\n1. **Height Restriction**: Maximum building height is **18 feet** for detached accessory structures (LLMC § 10-3C-5).\n" },
    { type: "content", text: "2. **Setbacks**: You must maintain a **5-foot rear setback** and a **5-foot side yard setback** from the property line (LLMC § 10-3C-6).\n" },
    { type: "content", text: "3. **Lot Coverage**: The accessory building footprint cannot exceed **1,000 sq ft** or **10% of total lot area**, whichever is smaller (LLMC § 10-3C-7).\n\n" },
    { type: "content", text: "#### Required Actions:\n- Submit a standard **Accessory Building Permit Application** to the City Planning Dept before pouring the slab.\n- Attach a digital scale drawing illustrating setbacks from existing property lines." }
  ];

  const handleStartStream = () => {
    setStreamActive(true);
    setStreamStep(0);
    setStreamOutput("");
    setShowCitations(false);
  };

  useEffect(() => {
    if (!streamActive) return;

    if (streamStep < streamData.length) {
      const timer = setTimeout(() => {
        const currentItem = streamData[streamStep];
        
        if (currentItem.type === "meta") {
          setStreamOutput(prev => prev + `<span class="text-green-500 font-mono">${currentItem.text}</span>\n`);
        } else if (currentItem.type === "citation") {
          setShowCitations(true);
          setStreamOutput(prev => prev + `📂 <span class="text-blue-400 font-mono font-bold">[190ms] Citations Resolved -> Populating Sidebar...</span>\n`);
        } else if (currentItem.type === "content") {
          // Parse markdown-like strings briefly to HTML
          const styledContent = currentItem.text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)\n/g, '<h3 class="text-base font-bold text-white mt-2">$1</h3>')
            .replace(/#### (.*?)\n/g, '<h4 class="text-sm font-semibold text-emerald-400 mt-2">$1</h4>');
          
          setStreamOutput(prev => prev + `<span class="text-gray-100">${styledContent}</span>`);
        }
        
        setStreamStep(prev => prev + 1);
      }, streamStep < 7 ? 250 : 600); // Meta logs are fast, content reasoning streams slower

      return () => clearTimeout(timer);
    } else {
      setStreamActive(false);
    }
  }, [streamActive, streamStep]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-emerald-500/20 selection:text-emerald-950">
      
      {/* 3% SVG Fractal Noise Overlay for Lickable Texture (Meng Sauce Pillar 1) */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Glow Radial Blobs behind content to Break Grid (Meng Sauce Pillar 2) */}
      <div className="absolute top-20 left-1/4 -z-10 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] blur-3xl pointer-events-none" />

      {/* Frosted Sticky Header */}
      <header className="border-b border-slate-200 bg-white/70 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-slate-400 hover:text-slate-900 transition-colors duration-250 flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-250 text-xs font-mono text-slate-600 font-bold">CASE STUDY</span>
              <span className="font-bold text-slate-900 text-lg hidden sm:inline-block">Liberty Lake Zoning Oracle</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
            Go to Console &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        
        {/* HERO SECTION with Authoritative Typography (Meng Sauce Pillar 4) */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-serif mb-4 leading-tight">
            How We Built the <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Liberty Lake Zoning Oracle</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-3xl leading-relaxed mb-8">
            Navigating strict, irregular municipal zoning codes requires zero-tolerance reasoning, click-to-verify citations, and high-speed execution. Here is the exact architectural blueprint enabled by Membrane.
          </p>

          {/* Key Metrics Dashboard Card (Skeuomorphic depth) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-xl border border-white bg-white/60 shadow-lg shadow-slate-100/50 backdrop-blur-md relative overflow-hidden">
            {/* Soft Emerald Internal Shadow Effect */}
            <div className="absolute inset-0 rounded-xl border border-slate-200/50 pointer-events-none" />
            
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">CONSECUTIVE CACHE</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1">60-65%</span>
              <span className="text-xs text-slate-500 mt-1">Sequential Cost Reduction</span>
            </div>
            <div className="flex flex-col border-l border-slate-200/60 pl-4 md:pl-6">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">INITIAL CITATION</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1">&lt;200ms</span>
              <span className="text-xs text-slate-500 mt-1">Sidebar Popover Load</span>
            </div>
            <div className="flex flex-col border-l border-slate-200/60 pl-4 md:pl-6">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">SWARM BOUNDARY</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1">56 Chunks</span>
              <span className="text-xs text-slate-500 mt-1">Dossier Load (Limit 50+)</span>
            </div>
            <div className="flex flex-col border-l border-slate-200/60 pl-4 md:pl-6">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">STREAM TYPE</span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-1">NDJSON</span>
              <span className="text-xs text-slate-500 mt-1">Progressive Progress logs</span>
            </div>
          </div>
        </section>

        {/* SECTION 1: ARCHITECTURAL TIMELINE & FLOW */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">1. Conceptual Flow: The GIS to Swarm Pipeline</h2>
          </div>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Naively feeding massive zoning PDF documents to a frontier LLM model wastes thousands of dollars and leads to hallucinations. Our system breaks the rigid flow, using a local GIS index and precision keyword search to load a small, targeted dossier before invoking the high-speed Membrane completions sandbox.
          </p>

          {/* Interactive Visual Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative group hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mb-3">1</div>
              <h3 className="font-bold text-slate-950 text-sm mb-1">GIS Parcel Lookup</h3>
              <p className="text-xs text-slate-500 leading-relaxed">System takes user address and looks up legal coordinates to pinpoint the residential zone boundary (e.g. <code>R-1</code>).</p>
            </div>

            <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative group hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mb-3">2</div>
              <h3 className="font-bold text-slate-950 text-sm mb-1">Targeted Pre-Filtering</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Precision keyword pre-filtering slices our 660 total regulatory snippets down to a compact 56-chunk dossier matching current use.</p>
            </div>

            <div className="flex flex-col p-5 bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl shadow-sm relative group hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">3</div>
              <h3 className="font-bold text-emerald-950 text-sm mb-1">Membrane Swarm Gateway</h3>
              <p className="text-xs text-emerald-900/70 leading-relaxed">Membrane performs zero-shot context isolation, matching verbatim rules, assessing setbacks, and generating clickable citations.</p>
            </div>

            <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative group hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center mb-3">4</div>
              <h3 className="font-bold text-slate-950 text-sm mb-1">NDJSON citation Stream</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Instant citations list streams back to client in &lt;200ms, while reasoning and legal limitations parse in real-time.</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE LIVE TERMINAL STREAM (WOW Component) */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-6">
            <TerminalIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">2. Interactive Sandbox: Live NDJSON Citation Stream</h2>
          </div>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Click **"Run Stream Simulation"** below to see how our Next.js UI utilizes Membrane’s streaming API. Notice how the legal citations sidebar loads and populates almost **instantly** (&lt; 200ms) while deep logical deductions stream incrementally.
          </p>

          {/* Terminal & Sidebar Sandbox Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-2xl border border-slate-350 bg-slate-900 p-4 md:p-6 shadow-2xl relative">
            
            {/* LEFT: Live Interactive Citations Sidebar (Meng Sauce visual contrast) */}
            <div className="lg:col-span-1 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${showCitations ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
                  Citations Sidebar
                </span>
                <span className="text-[10px] font-mono text-slate-500">POPULATING IN &lt;200MS</span>
              </div>

              {showCitations ? (
                <div className="flex flex-col gap-3 animate-fade-in">
                  
                  {/* Skeuomorphic Document Receipt Miniature (Pillar 2 / "The receipts") */}
                  <div className="relative p-3 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-slate-100 border-l border-b border-slate-200 rounded-bl-sm" />
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-slate-900 border-r-slate-900" />
                    <div className="h-1 w-full bg-emerald-600 absolute top-0 left-0" />
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-slate-900">LLMC § 10-3C-5</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Acc. Structure Height Limitations</span>
                  </div>

                  <div className="relative p-3 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-slate-100 border-l border-b border-slate-200 rounded-bl-sm" />
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-slate-900 border-r-slate-900" />
                    <div className="h-1 w-full bg-emerald-600 absolute top-0 left-0" />
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-slate-900">LLMC § 10-3C-6</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Acc. Structure Boundary Setbacks</span>
                  </div>

                  <div className="relative p-3 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-slate-100 border-l border-b border-slate-200 rounded-bl-sm" />
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-slate-900 border-r-slate-900" />
                    <div className="h-1 w-full bg-emerald-600 absolute top-0 left-0" />
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-slate-900">LLMC § 10-3C-7</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Lot Coverage Percentages & Limits</span>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full border border-dashed border-slate-800 flex items-center justify-center text-slate-650 mb-3 animate-pulse">
                    📂
                  </div>
                  <span className="text-xs font-medium text-slate-600">Pending Stream Initiation</span>
                  <span className="text-[10px] text-slate-700 mt-1 max-w-[150px] leading-normal">Citations resolve automatically on first frame</span>
                </div>
              )}
            </div>

            {/* RIGHT: Live Stream Console (Terminal GUI) */}
            <div className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
              
              {/* Terminal Window chrome */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="font-mono text-xs text-slate-500 ml-2">membrane-ndjson-stream</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleStartStream} 
                    disabled={streamActive}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 shadow transition-all active:scale-98"
                  >
                    <Play className="w-3 h-3" />
                    {streamActive ? "Streaming..." : "Run Stream"}
                  </button>
                  <button 
                    onClick={() => { setStreamActive(false); setStreamStep(0); setStreamOutput(""); setShowCitations(false); }}
                    className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Console log outputs */}
              <div className="flex-1 font-mono text-xs text-slate-350 overflow-y-auto leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-slate-850 min-h-[220px]">
                {streamOutput ? (
                  <pre className="whitespace-pre-wrap select-all selection:bg-emerald-500/30" dangerouslySetInnerHTML={{ __html: streamOutput }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                    <TerminalIcon className="w-8 h-8 text-slate-850" />
                    <span>Click the &quot;Run Stream&quot; button to compile the logic loop.</span>
                  </div>
                )}
              </div>

              {/* Footer status bar */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>API Status: 200 OK</span>
                <span>Security Engine: ACTIVE</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: THE 3 KEY OPTIMIZATIONS (Meng Sauce Pillar 3 / Negative margins / Deconstruction) */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-6">
            <Code className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">3. Crucial Optimizations We Discovered</h2>
          </div>
          <p className="text-slate-600 mb-10 leading-relaxed">
            During production iteration, we discovered three architectural bottlenecks. Rather than using standard RAG practices, we engineered precise bypass filters and sanitization blocks to handle irregular municipal datasets safely.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Optimization Card 1: Precision Keyword lists */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-xl relative shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              {/* Giant numeral back element (Pillar 3 Visual Deconstruction) */}
              <span className="absolute -top-6 right-2 text-7xl font-extrabold text-slate-100/70 select-none font-serif tracking-tighter">01</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase block mb-1">DATA BOUNDARIES</span>
                <h3 className="text-base font-bold text-slate-900 mb-2 mt-0">Precision Keywords</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Broad keywords matching 660 snippets diluted context windows. We switched to hyper-specific lists (e.g. <code>dining, outdoor seating, bistro</code> for restaurants) to stay clean under the 50-chunk Swarm limit.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto shrink-0 border border-slate-900">
                <code>{`keywords = ["dining", "cafe", "bistro", "seating"]`}</code>
              </div>
            </div>

            {/* Optimization Card 2: Interactive Gating Bypass */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-xl relative shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <span className="absolute -top-6 right-2 text-7xl font-extrabold text-slate-100/70 select-none font-serif tracking-tighter">02</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase block mb-1">CONVERSATIONAL UX</span>
                <h3 className="text-base font-bold text-slate-900 mb-2 mt-0">Gating Bypass Check</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Forcing multi-turn chat confirmation gates on loaded queries added friction. If both the <strong>intent</strong> and the <strong>address</strong> are present in history, we auto-bypass gates.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto shrink-0 border border-slate-900">
                <code>{`if intent_detected and parcel_id:\n    bypass_gating = True`}</code>
              </div>
            </div>

            {/* Optimization Card 3: List Citation Normalization */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-xl relative shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <span className="absolute -top-6 right-2 text-7xl font-extrabold text-slate-100/70 select-none font-serif tracking-tighter">03</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase block mb-1">API RESILIENCE</span>
                <h3 className="text-base font-bold text-slate-900 mb-2 mt-0">Robust Sanitization</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Municipal codes returned irregular citation formats (arrays, empty strings, nulls) that crashed standard string manipulation functions. We built a robust typecaster.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto shrink-0 border border-slate-900">
                <code>{`def cast_citation(c):\n    return str(c[0]) if isinstance(c, list) else str(c)`}</code>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: ECONOMICS LEDGER & SAVINGS METRICS */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">4. Caching Savings & Token Economics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
            
            {/* Visual Economics Bar comparison */}
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Initial Turn (Heavy Context Load)</span>
                  <span className="font-mono text-slate-800 font-bold">$0.042</span>
                </div>
                <div className="h-3 rounded-full bg-slate-150 relative">
                  <div className="h-3 w-full rounded-full bg-slate-450" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Sequential Turns (Membrane Context Cache hit)</span>
                  <span className="font-mono text-emerald-600 font-bold">$0.011</span>
                </div>
                <div className="h-3 rounded-full bg-emerald-100 relative">
                  <div className="h-3 w-[26%] rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 py-4">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="text-2xl font-black text-emerald-600">65% Token Cost Saved</span>
              </div>
            </div>

            {/* Explanatory text */}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">SEMANTIC CACHING</span>
              <h3 className="text-lg font-bold text-slate-900 mb-3 mt-0">Consecutive Context Optimization</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Because municipal reasoning requires feeding heavy verbatim legal chapters into the system, repeating this context on sequential conversational turns typically drains balances instantly.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Membrane detects that the heavy zoning background rules remain static and caches the compilation ledger automatically. This results in **60–65% cost savings** starting on the second conversation turn, protecting developer margins.
              </p>
            </div>

          </div>
        </section>

      </main>
      
      {/* Visual Footer Showcase CTA */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16 text-center text-slate-400 relative overflow-hidden mt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative">
          <BookOpen className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Build Your Own Lossless Agent swarms</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            Ready to integrate high-speed agentic routing, semantic caching, and threat firewall safety modules into your own developer stack?
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/docs" className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold rounded-md border border-slate-750">
              Read API Docs
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition-all text-white text-xs font-semibold rounded-md shadow shadow-emerald-950">
              Open Sandbox Console
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
