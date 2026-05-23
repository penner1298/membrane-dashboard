"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Key, Sparkles, Zap, Layers, FileText, AlertCircle, 
  Loader2, TrendingDown, Search, Check, CheckCircle2, Copy, 
  HelpCircle, Ruler, BookOpen, Terminal, ArrowRight, Lock, 
  Unlock, Mail, User, ShieldAlert, AlertTriangle, Play, Cpu, Server, Compass
} from "lucide-react";

// Types
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
  // Navigation & Active Layout States
  const [activeTab, setActiveTab] = useState<"capabilities" | "doc-auditor" | "zoning-oracle">("capabilities");
  
  // Standalone/API settings
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/v1/swarm/map");
  const [apiKey, setApiKey] = useState("sk_live_local_dev_key");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        setTimeout(() => {
          setApiUrl(`${window.location.origin}/v1/swarm/map`);
        }, 0);
      }
    }
  }, []);

  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // ==========================================
  // STATE & DEMO LOGIC: A-LA-CARTE CAPABILITIES
  // ==========================================
  const [activeCap, setActiveCap] = useState<string>("caching");
  const [semanticSearchQuery, setSemanticSearchQuery] = useState("Explain setback requirements");
  const [cacheHits, setCacheHits] = useState<string[]>([]);
  const [cachingStatus, setCachingStatus] = useState<"idle" | "searching" | "hit" | "miss">("idle");
  const [cachedData, setCachedData] = useState<{ query: string; answer: string; latency: number } | null>(null);

  const handleSemanticSearchDemo = () => {
    setCachingStatus("searching");
    setTimeout(() => {
      // If query is semantically similar, trigger mock cache hit
      const queryLower = semanticSearchQuery.toLowerCase();
      const isHit = queryLower.includes("setback") || queryLower.includes("fence") || queryLower.includes("adu");
      
      if (isHit) {
        setCachingStatus("hit");
        setCachedData({
          query: semanticSearchQuery,
          answer: "Accessory building setbacks require a minimum of 5 feet from rear and side property lines. Front setback must be 20 feet [LLMC § 10-3C-5.A].",
          latency: 1.24
        });
        if (!cacheHits.includes(semanticSearchQuery)) {
          setCacheHits(prev => [semanticSearchQuery, ...prev]);
        }
      } else {
        setCachingStatus("miss");
        setCachedData({
          query: semanticSearchQuery,
          answer: "Cold cache resolution: The prompt was sent to the background model. pgvector embedding computed in 140ms. Result: General zoning rules apply.",
          latency: 480.0
        });
      }
    }, 800);
  };

  // ==========================================
  // STATE & DEMO LOGIC: USE CASE 1 (DOC AUDITOR)
  // ==========================================
  const [auditorPersona, setAuditorPersona] = useState("Freelancer");
  const [auditorFocus, setAuditorFocus] = useState("");
  const [auditorText, setAuditorText] = useState(
    "12. INDEMNIFICATION. The Contractor shall defend, indemnify and hold harmless the Client from and against any and all claims, liabilities, losses, damages, costs and expenses (including reasonable attorney fees) arising out of or related to any breach of this Agreement by the Contractor or performance of the Services. " +
    "\n\n13. LIMITATION OF LIABILITY. In no event shall the Client's aggregate liability under this Agreement exceed the sum of $1,000, regardless of the cause of action." +
    "\n\n14. INTELLECTUAL PROPERTY. All work product, deliverables, code, designs, and items created by the Contractor during the performance of the Services shall be the sole and exclusive property of the Client immediately upon creation."
  );
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [auditorProgress, setAuditorProgress] = useState(0);
  const [auditorStatus, setAuditorStatus] = useState("");
  const [auditorResults, setAuditorResults] = useState<any[] | null>(null);
  const [auditorSelected, setAuditorSelected] = useState<number[]>([]);
  const [auditorLogs, setAuditorLogs] = useState<any[]>([]);

  const loadSampleContract = () => {
    setAuditorText(
      "12. INDEMNIFICATION. The Contractor shall defend, indemnify and hold harmless the Client from and against any and all claims, liabilities, losses, damages, costs and expenses (including reasonable attorney fees) arising out of or related to any breach of this Agreement by the Contractor or performance of the Services. " +
      "\n\n13. LIMITATION OF LIABILITY. In no event shall the Client's aggregate liability under this Agreement exceed the sum of $1,000, regardless of the cause of action." +
      "\n\n14. INTELLECTUAL PROPERTY. All work product, deliverables, code, designs, and items created by the Contractor during the performance of the Services shall be the sole and exclusive property of the Client immediately upon creation."
    );
    setAuditorResults(null);
    setAuditorSelected([]);
  };

  const runAuditorSimulation = () => {
    setAuditorLoading(true);
    setAuditorProgress(10);
    setAuditorStatus("Parsing PDF pages locally...");
    setAuditorResults(null);
    setAuditorLogs([]);

    const logTx = (agent: string, target: string, task: string, status: string) => {
      return {
        timestamp: new Date().toISOString(),
        requesting_agent: agent,
        target_agent: target,
        task: task,
        status: status,
        proof_of_work: "0x" + Math.random().toString(16).substring(2, 14)
      };
    };

    setTimeout(() => {
      setAuditorProgress(40);
      setAuditorStatus("Extracting clauses via Membrane Swarm (/v1/swarm/map)...");
      setAuditorLogs(prev => [
        logTx("Membrane Router", "Membrane Swarm Extractor", "Extract contract clauses (Batch 1)", "Success"),
        ...prev
      ]);
    }, 1200);

    setTimeout(() => {
      setAuditorProgress(75);
      setAuditorStatus("Synthesizing risks via Gemini Analyst...");
      setAuditorLogs(prev => [
        logTx("App Layer", "Gemini 3.5 Flash Analyst", "Risk Synthesis for " + auditorPersona, "Success"),
        ...prev
      ]);
    }, 2400);

    setTimeout(() => {
      setAuditorProgress(100);
      setAuditorLoading(false);
      setAuditorResults([
        {
          title: "Predatory Indemnification",
          severity: "High",
          legal_text: "The Contractor shall defend, indemnify and hold harmless the Client from and against any and all claims, liabilities, losses, damages...",
          plain_english: "You are responsible for paying all legal fees and damages for any lawsuit related to this project, even if you are not at fault.",
          pushback_draft: "I would like to make this indemnification mutual, limiting my liability to claims arising directly from my gross negligence or willful misconduct."
        },
        {
          title: "One-Sided Liability Cap",
          severity: "High",
          legal_text: "In no event shall the Client's aggregate liability under this Agreement exceed the sum of $1,000, regardless of the cause of action.",
          plain_english: "If the client breaches the contract or refuses to pay, you cannot sue them for more than $1,000, regardless of how much work you completed.",
          pushback_draft: "I propose replacing the fixed $1,000 liability cap with a cap equal to the total fees paid under this Agreement, applying mutually to both parties."
        },
        {
          title: "Immediate IP Assignment",
          severity: "Medium",
          legal_text: "All work product, deliverables, code, designs... shall be the sole and exclusive property of the Client immediately upon creation.",
          plain_english: "The client owns the rights to your code the moment you type it, even before they pay you a single cent.",
          pushback_draft: "I propose that intellectual property rights in the deliverables shall transfer to the Client only upon receipt of full payment for the services."
        }
      ]);
      setAuditorSelected([0, 1, 2]);
    }, 3600);
  };

  const getConsolidatedEmail = () => {
    if (!auditorResults || auditorSelected.length === 0) {
      return "Select clauses to generate the consolidated pushback draft...";
    }
    let draft = `Hi Team,\n\nI reviewed the contract and have a few requests regarding the terms before we can move forward:\n\n`;
    auditorResults.forEach((res, idx) => {
      if (auditorSelected.includes(idx)) {
        draft += `* **Regarding ${res.title}**: ${res.pushback_draft}\n\n`;
      }
    });
    draft += `Let me know if we can adjust these to mutual terms. Thanks!`;
    return draft;
  };

  // ==========================================
  // STATE & DEMO LOGIC: USE CASE 2 (ZONING ORACLE)
  // ==========================================
  const [zoningIntent, setZoningIntent] = useState("ADU");
  const [zoningAddress, setZoningAddress] = useState("22808 E Country Vista Drive");
  const [zoningLoading, setZoningLoading] = useState(false);
  const [zoningStatus, setZoningStatus] = useState("");
  const [zoningResult, setZoningResult] = useState<any | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);

  const runZoningSimulation = () => {
    setZoningLoading(true);
    setZoningStatus("Locating property on GIS parcel map...");
    setZoningResult(null);

    setTimeout(() => {
      setZoningStatus("Executing local regex pre-filtering (80k tokens -> 5k)...");
    }, 1000);

    setTimeout(() => {
      setZoningStatus("Invoking high-speed Swarm Map-Reduce on chapter chunks...");
    }, 2200);

    setTimeout(() => {
      setZoningLoading(false);
      setZoningResult({
        zone: "RD-R (River District Residential)",
        address: zoningAddress,
        intent: zoningIntent,
        preFilterSavings: "93.7% token reduction",
        cacheStatus: "SEMANTIC_CACHE_HIT (1.24ms)",
        answer: "In the **RD-R** zone, detached accessory dwelling units (ADUs) are permitted subject to structural limitations under [LLMC § 10-2-8]. Fences must follow building height clearances and setbacks. Access to utility lines must be verified via [LLMC § 10-2-8.b].\n\nTo begin, ensure your structure has a roof pitch of at least 4:12 [LLMC § 10-2-8.f] and maintains proper setbacks to protect your neighbor's privacy. Would you like me to walk you through the utility application?",
        dimensions: {
          "Max ADU Size": "900 sq ft or 35% of house area",
          "Max Height": "25 feet [LLMC § 10-2-8.g]",
          "Rear Setback": "5 feet from property line",
          "Side Setback": "5 feet",
          "Min Lot Size": "8,000 sq ft [LLMC § 10-2-8.h]"
        },
        citations: [
          {
            key: "LLMC § 10-2-8",
            title: "Detached ADU Standards",
            content: "Chapter 10.2.8: Detached Accessory Dwelling Unit Standards. A detached accessory dwelling unit (ADU) is a separate building from the primary house. It must comply with lot coverage limits and architectural standards including roof pitch and siding."
          },
          {
            key: "LLMC § 10-2-8.f",
            title: "ADU Roof Pitch",
            content: "Section 10-2-8(f): Roof Pitch. The roof pitch of a detached ADU shall match the main dwelling house pitch, or be a minimum of 4:12 to ensure architectural compatibility with surrounding residential structures."
          },
          {
            key: "LLMC § 10-2-8.h",
            title: "ADU Min Lot Size",
            content: "Section 10-2-8(h): Minimum Lot Size. No detached ADU shall be established on a lot of less than 8,000 square feet within any residential district."
          }
        ]
      });
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden">
      
      {/* 3% SVG Fractal Noise Overlay to defeat digital flatness */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Asymmetric Radial Gradients (Blobs) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[700px] h-[700px] bg-indigo-500/[0.015] rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
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

      <main className="max-w-6xl mx-auto p-6 mt-4 relative z-10">
        
        {/* Title Section (Authoritative Serif & Geometric Sans) */}
        <div className="mb-12">
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-900/40 px-3 py-1 rounded-md">
            MUNICIPAL & COMPLIANCE ARCHITECTURE
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-4 font-serif">
            The Swarm Cookbook
          </h1>
          <p className="text-slate-400 mt-3 max-w-3xl text-sm leading-relaxed">
            Eliminate LLM hallucinations by design. Point your agentic workflows to Membrane to take advantage of zero-shot pruning, sub-2ms caching, and structured Map-Reduce. Learn how to plug these architectures directly into GovTech and document audit systems.
          </p>
        </div>

        {/* Global Connection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-lg">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Swarm API Endpoint URL
            </label>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-350 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              API Sandbox Bearer Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pl-9 font-mono text-xs text-slate-350 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 mb-8 gap-2">
          <button
            onClick={() => setActiveTab("capabilities")}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "capabilities" 
                ? "border-emerald-500 text-white font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" /> A-La-Carte Capabilities
          </button>
          <button
            onClick={() => setActiveTab("doc-auditor")}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "doc-auditor" 
                ? "border-emerald-500 text-white font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" /> Use Case 1: Large Document Auditor
          </button>
          <button
            onClick={() => setActiveTab("zoning-oracle")}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "zoning-oracle" 
                ? "border-emerald-500 text-white font-extrabold" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" /> Use Case 2: GIS & Municipal Regulations
          </button>
        </div>

        {/* ==========================================
            TAB CONTENT: A-LA-CARTE CAPABILITIES
            ========================================== */}
        {activeTab === "capabilities" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { id: "caching", label: "Semantic Caching", icon: Zap, desc: "Bypass LLM queries entirely on semantically identical prompts at sub-2ms latency." },
                { id: "isolation", label: "Zero-Shot Isolation", icon: ShieldAlert, desc: "Strip historical memory and focus prompts for low-hallucination compliance." },
                { id: "mapreduce", label: "Parallel Swarm Map", icon: Layers, desc: "Distribute bulk documents across multiple parallel LLM workers and merge outputs." },
                { id: "gating", label: "Fail-Hard Gating", icon: AlertTriangle, desc: "Sanitize structural output in sandboxes, forcing immediate HTTP errors on compile failures." },
                { id: "telemetry", label: "Live Cost Telemetry", icon: TrendingDown, desc: "Read token and cost economics directly from response headers to audit swarm balance." }
              ].map(cap => {
                const Icon = cap.icon;
                const isActive = activeCap === cap.id;
                return (
                  <button
                    key={cap.id}
                    onClick={() => setActiveCap(cap.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                      isActive 
                        ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white" 
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <Icon className={`w-5 h-5 mb-3 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <h3 className="text-xs font-black uppercase tracking-wider mb-1">{cap.label}</h3>
                      <p className="text-[11px] leading-relaxed text-slate-400">{cap.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive Capability Demo Bench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900/20 border border-slate-850 p-6 rounded-3xl shadow-xl">
              
              {/* Left Column: Interactive Mini-Demo (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Interactive Diagnostics</span>
                
                {activeCap === "caching" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Sub-2ms Semantic Edge Cache Bench</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Membrane uses vector search (pgvector) to detect semantically identical questions. Type queries below to verify cache hit outcomes.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Query</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={semanticSearchQuery}
                          onChange={(e) => setSemanticSearchQuery(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleSemanticSearchDemo}
                          className="bg-emerald-600 text-white px-4 rounded-lg text-xs font-bold hover:bg-emerald-500"
                        >
                          Send
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-2">
                        <span>L1/L2 CACHE OUTCOME</span>
                        {cachingStatus === "hit" && <span className="text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded">SEMANTIC_CACHE_HIT</span>}
                        {cachingStatus === "miss" && <span className="text-slate-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">CACHE_MISS</span>}
                        {cachingStatus === "searching" && <span className="text-blue-400 font-bold animate-pulse">EVALUATING_EMBEDDING...</span>}
                        {cachingStatus === "idle" && <span>AWAITING_INPUT</span>}
                      </div>

                      {cachingStatus === "hit" && cachedData && (
                        <div className="space-y-2">
                          <p className="text-emerald-300 leading-relaxed">&quot;{cachedData.answer}&quot;</p>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900/60">
                            <span>Latency: <strong>{cachedData.latency}ms</strong></span>
                            <span>Savings: <strong>100%</strong></span>
                          </div>
                        </div>
                      )}

                      {cachingStatus === "miss" && cachedData && (
                        <div className="space-y-2">
                          <p className="text-slate-400 leading-relaxed">{cachedData.answer}</p>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900/60">
                            <span>Latency: <strong>{cachedData.latency}ms</strong></span>
                            <span>Savings: <strong>0%</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeCap === "isolation" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Context Isolation & Header Bypass</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      By default, Membrane strips middle dialogue messages to enforce zero-shot instruction purity and save up to 80% on token fees. Toggle memory rules:
                    </p>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3 text-xs leading-relaxed font-sans text-slate-350">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                        <span>DEFAULT MODE (ZERO-SHOT ISOLATION)</span>
                        <span className="text-blue-400 uppercase tracking-widest font-black text-[8px]">Pruning Active</span>
                      </div>
                      <p>
                        Membrane parses your SDK message array and automatically isolates the **System DNA** instructions, fusing them cleanly with the final **User Intent** to block cascading history hallucinations.
                      </p>
                      <hr className="border-slate-900" />
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                        <span>BYPASS HEADER (LEGACY OVERRIDE)</span>
                        <span className="text-amber-400 uppercase tracking-widest font-black text-[8px]">Pruning Disabled</span>
                      </div>
                      <p>
                        Passing standard HTTP header `X-Membrane-Preserve-Context: true` forces Membrane to bypass context stripping and deliver the complete conversational history.
                      </p>
                    </div>
                  </div>
                )}

                {activeCap === "mapreduce" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Parallel Map-Reduce Ingestor</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      For large document datasets (compliance codes, transcripts, PDFs), Membrane runs multiple parallel mapping completions concurrently under a strict 50-chunk ceiling:
                    </p>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2.5 font-mono text-xs">
                      <div className="text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-900">
                        Swarm Ingest Rules
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sandbox Chunk Limit:</span>
                        <span className="text-white font-bold">25 Chunks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Swarm Ceiling Limit:</span>
                        <span className="text-white font-bold">50 Chunks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recommended Batch Size:</span>
                        <span className="text-emerald-400 font-bold">50 Chunks</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeCap === "gating" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Fail-Hard Gating Sandbox</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Traditional AI gateways return syntax exceptions inside successful responses, causing downstream loops. Membrane throws hard HTTP failures:
                    </p>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono space-y-2 text-slate-350">
                      <div className="flex items-center gap-2 text-red-500 font-bold border-b border-slate-900 pb-2">
                        <AlertTriangle className="w-4 h-4" /> HTTP 500 INTERNAL COMPILER ERROR
                      </div>
                      <p className="leading-relaxed">
                        If a generated React or Next.js component fails AST parsing inside the Secure Sandbox, Membrane immediately fails hard.
                      </p>
                      <p className="text-slate-500 italic mt-2">
                        Benefits: Prevents agents from ingesting stack trace exceptions as rules.
                      </p>
                    </div>
                  </div>
                )}

                {activeCap === "telemetry" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Value Ledger Auditing</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Membrane completions write custom telemetry parameters straight into responses. Read metrics directly:
                    </p>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono space-y-2">
                      <div className="text-slate-500 border-b border-slate-900 pb-2 flex justify-between">
                        <span>METADATA PAYLOAD</span>
                        <span className="text-emerald-400">active</span>
                      </div>
                      <p className="text-slate-300">`savings_percent`: **66.7%**</p>
                      <p className="text-slate-300">`billed_amount`: **$0.00012**</p>
                      <p className="text-slate-300">`status`: **&quot;SEMANTIC_CACHE_HIT&quot;**</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Code Blueprint (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase font-mono">SDK Implementation code</span>
                    <button 
                      onClick={() => handleCopy(
                        activeCap === "caching" ? `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${apiUrl.replace("/swarm/map", "")}",\n    api_key="your_api_key"\n)\n\n# Bypasses compute if query matches cached pgvector entries\nresponse = client.chat.completions.create(\n    model="membrane-engagement-layer",\n    messages=[{"role": "user", "content": "Zoning setbacks for ADU"}]\n)` : 
                        activeCap === "isolation" ? `headers = {\n    "X-Membrane-Preserve-Context": "true"\n}\n# Sends complete middle-history dialogue without zero-shot context stripping` :
                        activeCap === "mapreduce" ? `def batch_chunks(data_list, batch_size=50):\n    """Mathematically batches raw datasets to comply with Swarm limits"""\n    return [data_list[i:i + batch_size] for i in range(0, len(data_list), batch_size)]` :
                        activeCap === "gating" ? `try:\n    response = client.chat.completions.create(...)\nexcept Exception as e:\n    # Catches compile failures at proxy level before history is polluted\n    print("Gating Error:", e)` :
                        `response = client.chat.completions.create(...)\nmeta = response.get("membrane_metadata", {})\nprint("Cost Incurred:", meta.get("billed_amount"))`, 
                        activeCap
                      )}
                      className="text-slate-400 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 py-1 px-2 bg-slate-900 border border-slate-800"
                    >
                      {copiedLabel === activeCap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Code
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-xs overflow-x-auto min-h-[220px]">
                    {activeCap === "caching" && (
                      <pre className="text-emerald-400 leading-relaxed">
{`from openai import OpenAI

client = OpenAI(
    # Point to the Membrane API gateway
    base_url="${apiUrl.replace("/swarm/map", "")}",
    api_key="your_api_key"
)

# Membrane intercepts, embedding the prompt to search pgvector cache.
# Bypasses frontier reasoning if matching context exists.
response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Zoning setbacks for ADU"}]
)

# Extract cache indicators directly
meta = response.get("membrane_metadata", {})
print(f"Status: {meta.get('status')}") # "SEMANTIC_CACHE_HIT"`}
                      </pre>
                    )}

                    {activeCap === "isolation" && (
                      <pre className="text-emerald-400 leading-relaxed">
{`import requests

url = "${apiUrl.replace("/swarm/map", "/chat/completions")}"
headers = {
    "Authorization": "Bearer sk_your_api_key",
    "Content-Type": "application/json",
    # Legacy bypass: set to true to disable zero-shot context stripping
    "X-Membrane-Preserve-Context": "true"
}

payload = {
    "model": "membrane-engagement-layer",
    "messages": [
        {"role": "system", "content": "You are a stateful assistant."},
        {"role": "user", "content": "What was my previous query?"}
    ]
}

response = requests.post(url, headers=headers, json=payload)`}
                      </pre>
                    )}

                    {activeCap === "mapreduce" && (
                      <pre className="text-emerald-400 leading-relaxed">
{`def batch_chunks(data_list, batch_size=50):
    """
    Mathematically batches raw datasets for Membrane Guard Swarm ingestion.
    Ensures absolute compliance with the strict 50-chunk Swarm Map-Reduce boundary.
    """
    return [data_list[i:i + batch_size] for i in range(0, len(data_list), batch_size)]

# Example loop processing batches sequentially
for batch in batch_chunks(pdf_pages_list, batch_size=50):
    payload = {
        "model": "membrane-engagement-layer",
        "system_prompt": "Extract verbatim clauses.",
        "chunks": batch
    }
    # Calls swarm map-reduce parallel endpoint
    response = requests.post(SWARM_MAP_URL, json=payload)`}
                      </pre>
                    )}

                    {activeCap === "gating" && (
                      <pre className="text-emerald-400 leading-relaxed">
{`# Membrane runs structural validation in a local sandboxed compiler loop.
# If code or JSON schema fails, it returns strict HTTP exceptions instead of 200 OK.

try:
    response = client.chat.completions.create(
        model="membrane-engagement-layer",
        messages=[{"role": "user", "content": "Generate React navbar component"}],
        # Force strict compiler check
        response_format={"type": "json_object"} 
    )
except Exception as e:
    # Captures compilation errors immediately
    print(f"Compiler validation failed: {e}")`}
                      </pre>
                    )}

                    {activeCap === "telemetry" && (
                      <pre className="text-emerald-400 leading-relaxed">
{`# Read ROI ledger accounting directly from standard completion payloads

response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Zoning limits"}]
)

# Custom metrics appended in the root response body
metadata = response.get("membrane_metadata", {})

savings = metadata.get("savings_percent", 0.0)
cost = metadata.get("billed_amount", 0.0)

print(f"Token savings: {savings}%")
print(f"Swarm cost deducted: \${cost}")`}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: USE CASE 1 (DOC AUDITOR)
            ========================================== */}
        {activeTab === "doc-auditor" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Split Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive Playground (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-[80%] h-[150px] bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" /> Verbatim Clause Audit Simulation
                    </h3>
                    <button
                      onClick={loadSampleContract}
                      className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      Reset Sample Text
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Perspective Persona</label>
                      <select 
                        value={auditorPersona}
                        onChange={(e) => setAuditorPersona(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-350"
                      >
                        <option value="Freelancer">Freelancer</option>
                        <option value="Tenant">Tenant</option>
                        <option value="Employee">Employee</option>
                        <option value="Vendor / Agency">Vendor / Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specific Focus (Optional)</label>
                      <input 
                        type="text" 
                        value={auditorFocus}
                        onChange={(e) => setAuditorFocus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-350"
                        placeholder="e.g. Intellectual Property rights"
                      />
                    </div>
                  </div>

                  <textarea
                    value={auditorText}
                    onChange={(e) => setAuditorText(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 leading-relaxed font-mono focus:outline-none"
                    placeholder="Paste contract clauses here..."
                  />

                  <button
                    onClick={runAuditorSimulation}
                    disabled={auditorLoading || !auditorText.trim()}
                    className={`w-full mt-4 h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
                  >
                    {auditorLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{auditorStatus}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Run Swarm Auditor Simulation
                      </>
                    )}
                  </button>

                  {auditorLoading && (
                    <div className="w-full bg-slate-950 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 transition-all duration-500" 
                        style={{ width: `${auditorProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Simulated Audit Log */}
                {auditorLogs.length > 0 && (
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-[11px] text-slate-400 space-y-2">
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block mb-2 border-b border-slate-900 pb-1">
                      Swarm Audit Transaction Ledger
                    </span>
                    {auditorLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-350 border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                        <span>{log.requesting_agent} &rarr; <span className="text-white font-bold">{log.target_agent}</span></span>
                        <div className="flex gap-4">
                          <span className="text-slate-500">{log.task}</span>
                          <span className="text-emerald-400 font-bold">{log.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gotcha receipt cards list */}
                {auditorResults && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Identified Gotchas & Verbatim Clauses ({auditorResults.length})
                    </h4>
                    
                    {auditorResults.map((lib, i) => (
                      <div 
                        key={i} 
                        className="bg-white text-slate-950 border border-slate-200 rounded-xl relative overflow-hidden flex flex-col shadow-md hover:scale-[1.01] hover:shadow-lg transition-all"
                      >
                        {/* Top Accent bar receipt style */}
                        <div className={`h-2 w-full shrink-0 ${lib.severity === 'High' ? 'bg-red-600' : 'bg-orange-500'}`} />

                        {/* Dog ear simulation */}
                        <div className="absolute top-2 right-0 w-3.5 h-3.5 bg-slate-50 border-l border-b border-slate-200 rounded-bl-sm pointer-events-none" />

                        <div className="p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={auditorSelected.includes(i)}
                                onChange={() => {
                                  if (auditorSelected.includes(i)) {
                                    setAuditorSelected(auditorSelected.filter(idx => idx !== i));
                                  } else {
                                    setAuditorSelected([...auditorSelected, i]);
                                  }
                                }}
                                className="w-4 h-4 cursor-pointer accent-emerald-600"
                              />
                              <h5 className="font-extrabold text-sm text-slate-800">{lib.title}</h5>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${lib.severity === 'High' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                              {lib.severity} Risk
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-600">
                              <span className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Verbatim Source Jargon</span>
                              &quot;{lib.legal_text}&quot;
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 leading-relaxed font-sans font-medium">
                              <span className="text-[9px] font-bold text-blue-500 uppercase block mb-1">Plain English Translation</span>
                              {lib.plain_english}
                            </div>
                          </div>

                          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-900 leading-relaxed font-sans font-medium">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">A-La-Carte Pushback Email Draft</span>
                            {lib.pushback_draft}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Consolidated Email & Code Blueprints (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Consolidated Email Draft */}
                {auditorResults && (
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-1.5">
                        <Mail className="w-5 h-5 text-emerald-400" />
                        Packaged Negotiation Draft
                      </h4>
                      <p className="text-slate-450 text-[11px] leading-normal mb-4">
                        Consolidates selected pushbacks into a unified client-facing email. Toggle checkboxes on the left to customize.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[300px] overflow-y-auto">
                        {getConsolidatedEmail()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(getConsolidatedEmail(), "consolidated-email")}
                      disabled={auditorSelected.length === 0}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md w-full"
                    >
                      Copy Entire Email
                    </button>
                  </div>
                )}

                {/* Implementation Blueprint */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">How it works under the hood</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This use case splits text pages into batches of 50, parses them parallelly via `X-Membrane-Preserve-Context: false` (to strip prompt memory and avoid token blowup), and routes the final verbatim array to a synthesis completions pass.
                  </p>
                  <button 
                    onClick={() => handleCopy(`SWARM_URL = "http://localhost:8000/v1/swarm/map"\n\npayload = {\n    "model": "membrane-engagement-layer",\n    "system_prompt": "Extract clauses exactly.",\n    "chunks": batch_chunks\n}\n\nres = requests.post(SWARM_URL, json=payload)\nclauses = res.json().get("extractions", [])`, "auditor-blueprint")}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 py-2.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    Copy Swarm Map Python Blueprint
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: USE CASE 2 (ZONING ORACLE)
            ========================================== */}
        {activeTab === "zoning-oracle" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Split Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive Playground (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-[80%] h-[150px] bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
                  
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                    <Compass className="w-5 h-5 text-emerald-400" /> GIS-Linked Policy Query Bench
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Type</label>
                      <select 
                        value={zoningIntent}
                        onChange={(e) => setZoningIntent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-350"
                      >
                        <option value="ADU">Accessory Dwelling Unit (ADU)</option>
                        <option value="Shed">Storage Shed</option>
                        <option value="Fence">Fence / Boundary Wall</option>
                        <option value="Pool">Swimming Pool</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Property Street Address</label>
                      <input 
                        type="text" 
                        value={zoningAddress}
                        onChange={(e) => setZoningAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-350"
                        placeholder="e.g. 22808 E Country Vista Drive"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runZoningSimulation}
                    disabled={zoningLoading || !zoningAddress.trim()}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {zoningLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{zoningStatus}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Run GIS Policy Simulation
                      </>
                    )}
                  </button>
                </div>

                {/* Pre-filtering Savings Visualizer */}
                {zoningResult && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Local Pre-filtering Savings</span>
                      <p className="text-slate-400">Total Code database: <strong className="text-white">80,000 tokens</strong></p>
                      <p className="text-slate-400">Filtered context: <strong className="text-emerald-400">4,820 tokens</strong></p>
                      <p className="text-slate-500 text-[10px] italic">Saves ~93.7% token cost before Swarm dispatch.</p>
                    </div>
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-900 pt-3 md:pt-0 md:pl-5 flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Handshake Status</span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cache Status:</span>
                        <span className="text-emerald-400 font-bold">{zoningResult.cacheStatus}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-400">Resolved Zone:</span>
                        <span className="text-white font-bold">{zoningResult.zone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Assistant Response */}
                {zoningResult && (
                  <div className="bg-white text-slate-950 border border-slate-200 rounded-3xl p-6 shadow-xl leading-relaxed space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <TreePineIcon className="w-5 h-5 text-emerald-600" />
                      <span className="font-extrabold text-sm text-slate-800">GIS Policy Assistant</span>
                    </div>

                    {/* Parser with inline popovers */}
                    <div className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                      In the <strong className="text-slate-950">{zoningResult.zone}</strong> zone, detached accessory dwelling units (ADUs) are permitted subject to structural limitations under{" "}
                      <button
                        onClick={() => setSelectedCitation(zoningResult.citations[0])}
                        className="text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm border border-emerald-100 mx-1"
                      >
                        LLMC § 10-2-8
                      </button>
                      . Fences must follow building height clearances and setbacks. Access to utility lines must be verified via{" "}
                      <button
                        className="text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm border border-emerald-100 mx-1"
                      >
                        LLMC § 10-2-8.b
                      </button>
                      .<br /><br />
                      To begin, ensure your structure has a roof pitch of at least 4:12{" "}
                      <button
                        onClick={() => setSelectedCitation(zoningResult.citations[1])}
                        className="text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm border border-emerald-100 mx-1"
                      >
                        LLMC § 10-2-8.f
                      </button>
                      {" "}and maintains proper setbacks to protect your neighbor's privacy. Would you like me to walk you through the utility application?
                    </div>

                    {/* Zoning limits standard card */}
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl border border-emerald-100/50 space-y-3 mt-4">
                      <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                        <Ruler className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Zoning Limits & Standards</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 font-sans text-xs">
                        {Object.entries(zoningResult.dimensions).map(([key, value]: any) => (
                          <div key={key} className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                            <span className="text-slate-800 font-extrabold mt-0.5 leading-snug">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Clickable Citation Popover Context (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Popover Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl min-h-[160px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                      Source Citation Verbatim
                    </h4>
                    
                    {selectedCitation ? (
                      <div className="space-y-3 font-mono text-[11px] text-slate-350">
                        <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="text-emerald-400 font-bold">{selectedCitation.key}</span>
                          <span className="text-slate-500 font-sans">{selectedCitation.title}</span>
                        </div>
                        <p className="leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-850 italic text-emerald-50">
                          &quot;{selectedCitation.content}&quot;
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs leading-normal italic py-6 text-center">
                        Click on any highlighted LLMC citation in the query assistant to display the verbatim source context here.
                      </p>
                    )}
                  </div>
                </div>

                {/* Blueprint */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">How it works under the hood</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This use case employs regex pre-filtering, chapter slicing, parallel swarm map-reduce to pull facts, and standard OpenAI chat completions with structured JSON outputs.
                  </p>
                  <button 
                    onClick={() => handleCopy(`def filter_snippets(intent, zone):\n    # Local regex pre-filter to stay under context limits\n    return [s for s in db if match(intent, s.content)]`, "zoning-blueprint")}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 py-2.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    Copy Pre-Filtering Python Blueprint
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Tree Pine Icon SVG local definition
function TreePineIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m17 14 3-3-3-3m-10 6-3-3 3-3" />
      <path d="M12 3v18" />
    </svg>
  );
}
