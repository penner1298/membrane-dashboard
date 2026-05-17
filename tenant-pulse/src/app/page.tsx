"use client";

import { useState, useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { ShieldAlert, Zap, FileText, Loader2, CheckCircle, AlertTriangle, Lock, Unlock, Mail, User, CheckSquare, Square, X, Calendar, ChevronLeft } from "lucide-react";


interface AnalyzedItem {
  title?: string;
  legal_text?: string;
  plain_english?: string;
  severity?: string;
  pushback_draft?: string;
}

interface ExtractionData {
  entities?: string[];
  dates?: string[];
  obligations?: AnalyzedItem[];
  liabilities?: AnalyzedItem[];
}

interface PageResult {
  page: number;
  data?: ExtractionData;
  status: string;
}

interface ScanResponse {
  filename: string;
  pages_processed: number;
  persona: string;
  results: PageResult[];
}

const PERSONAS = ["Restaurant Owner", "Dental Practice", "Tech Startup", "Retail Store", "Franchisee"];

export default function TenantPulse() {
  const [file, setFile] = useState<File | null>(null);
  const [persona, setPersona] = useState<string>(PERSONAS[0]);
  const [isCustomPersona, setIsCustomPersona] = useState(false);
  const [customPersonaValue, setCustomPersonaValue] = useState("");
  const [focus, setFocus] = useState("");
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [results, setResults] = useState<ScanResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false); // The Dev Bypass
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const user = null; const isLoaded = true;
  // MOCK: If they are signed in, we treat them as Pro for now.
  const isPro = process.env.NODE_ENV === "development" || (isLoaded && !!user);
  
  // Default to selecting everything initially so the email is fully populated when unlocked
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [dynamicClause, setDynamicClause] = useState<string | null>(null);

  // Local Storage & Stripe Success Hook
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    
    // Check for dynamic clause from SEO pages
    const clauseParam = query.get("clause");
    if (clauseParam) {
      setDynamicClause(decodeURIComponent(clauseParam).replace(/-/g, ' '));
    }

    // Check if returning from Stripe
    const scanId = query.get("scanId");
    if (scanId) {
      setLoading(true);
      const apiUrl = "https://lease-scanner-backend.onrender.com";
      fetch(`${apiUrl}/api/scan/${scanId}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          // Historical scans are unlocked (dashboard is gated anyway)
          setUnlocked(true);
          const liabilities = data.results.flatMap((r: PageResult) => r.data?.liabilities || []) || [];
          setSelectedIndices(liabilities.map((_: unknown, i: number) => i));
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
          setError("Failed to load scan");
        });
      // Clean up the URL
      window.history.replaceState(null, "", window.location.pathname);
    } else if (query.get("success")) {
      const cached = localStorage.getItem("lease_pulse_results");
      if (cached) {
        const parsed = JSON.parse(cached);
        setResults(parsed);
        setUnlocked(true);
        const liabilities = parsed.results.flatMap((r: PageResult) => r.data?.liabilities || []) || [];
        setSelectedIndices(liabilities.map((_: AnalyzedItem, i: number) => i));
      }
      // Clean up the URL
      window.history.replaceState(null, "", window.location.pathname);
    } else if (query.get("new")) {
      // Clear cache if explicitly requesting a new scan
      localStorage.removeItem("lease_pulse_results");
      localStorage.removeItem("lease_pulse_unlocked");
      setResults(null);
      setUnlocked(false);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
       // Just normal load, check if they have a cached session
       const cached = localStorage.getItem("lease_pulse_results");
       const isUnlocked = localStorage.getItem("lease_pulse_unlocked") === "true";
       if (cached) {
         const parsed = JSON.parse(cached);
         setResults(parsed);
         setUnlocked(isUnlocked);
         if (isUnlocked) {
           const liabilities = parsed.results.flatMap((r: PageResult) => r.data?.liabilities || []) || [];
           setSelectedIndices(liabilities.map((_: unknown, i: number) => i));
         }
       }
    }
  }, [isPro]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % 5);
      }, 3500);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const LOADING_MESSAGES = [
    `Scanning from the perspective of the ${persona}...`,
    "To ensure high fidelity, we're running extra tests...",
    "Extracting entities via Membrane architecture...",
    "Translating legal jargon into plain English...",
    "Hunting for predatory liability caps..."
  ];

  const allLiabilities = results?.results.flatMap(r => r.data?.liabilities || []) || [];
  
  // Auto-unlock for Pro users
  useEffect(() => {
    if (results && isPro && !unlocked) {
      setUnlocked(true);
    }
  }, [results, isPro, unlocked]);



  const handleUpload = async (selectedFile?: File) => {
    sendGAEvent("event", "Scan_Lease_Clicked", { keyword: "homepage", persona });
    const fileToScan = selectedFile || file;
    if (!fileToScan) return;
    setLoading(true);
    setError(null);
    
    // Fake Door Delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setShowWaitlistModal(true);
    sendGAEvent("event", "Waitlist_Modal_Opened");
  };

  const handleCheckout = async (plan: 'payg' | 'pro' = 'payg') => {
    try {
        let apiUrl = "https://lease-scanner-backend.onrender.com";
        if (apiUrl.endsWith('/')) {
            apiUrl = apiUrl.slice(0, -1);
        }
        
        const email = null;
        const res = await fetch(`${apiUrl}/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ plan, email })
        });
        const data = await res.json();
        if (data.url) {
             window.location.href = data.url;
        } else {
            alert("Checkout failed: " + data.detail);
        }
    } catch {
        alert("Failed to connect to checkout.");
    }
  };

  const highRiskCount = allLiabilities.filter(l => l.severity?.toLowerCase() === 'high').length;

  const generateEmailDraft = () => {
    const selected = allLiabilities.filter((_, i) => selectedIndices.includes(i));
    if (selected.length === 0) return "Please select at least one item to include in your negotiation email.";

    let email = `Hi team,\n\nI reviewed the lease and have a few questions/requests regarding some of the terms before we can move forward:\n\n`;
    selected.forEach((item, i) => {
        email += `${i + 1}. ${item.pushback_draft}\n\n`;
    });
    email += `Let me know if we can adjust these. Thanks!`;
    return email;
  };

  const toggleSelection = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleCopyConsolidatedEmail = () => {
    navigator.clipboard.writeText(generateEmailDraft());
    alert("Consolidated negotiation email copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0F172A] font-sans relative overflow-x-hidden">
      {/* MANG Background Elements */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-[99]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />
      
      <svg className="absolute top-[-10%] right-[-10%] w-[80%] opacity-[0.08] z-0 pointer-events-none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,500 C150,400 350,600 500,500 C650,400 850,600 1000,500" stroke="#004D40" strokeWidth="5" fill="none" />
          <path d="M0,520 C150,420 350,620 500,520 C650,420 850,620 1000,520" stroke="#004D40" strokeWidth="3" fill="none" />
          <path d="M0,540 C150,440 350,640 500,540 C650,440 850,640 1000,540" stroke="#004D40" strokeWidth="1" fill="none" />
      </svg>

      {/* Header */}
      <header className="relative z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-black/5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mb-[3px]">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg> 
                Tenant Pulse
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-[100]">
            {false ? (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <a href="/dashboard" className="text-sm font-bold text-slate-700 hover:text-emerald-600 inline-block">Pro Dashboard (Dev Mode)</a>
              </div>
            ) : (
              <>
                
                
                
              </>
            )}
            

          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
        {/* Upload Zone */}
        {!results && (
                      <div className="max-w-4xl mx-auto mt-12">
            <div className="text-center mb-16 relative">
              {dynamicClause ? (
                <>
                  <h2 className="text-[48px] md:text-[64px] font-black tracking-[-0.04em] leading-[1.05] text-[#0F172A] mb-8">
                    Instantly expose predatory <span className="text-emerald-600">{dynamicClause}</span> clauses.
                  </h2>
                  <p className="text-[20px] text-slate-600 max-w-2xl mx-auto leading-[1.6]">
                    Drop your lease below. Our AI reads the legal jargon, flags the gotchas, and generates the exact pushback email you need to protect your business.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-[48px] md:text-[64px] font-black tracking-[-0.04em] leading-[1.05] text-[#0F172A] mb-8">
                    Never sign a predatory commercial lease.
                  </h2>
                  <p className="text-[20px] text-slate-600 max-w-2xl mx-auto leading-[1.6]">
                    Drop your NNN, Gross, or Retail lease below. Our AI translates CAM jargon into blunt English and drafts the exact email you need to push back on hidden traps.
                  </p>
                </>
              )}
            </div>
            <div className="max-w-3xl mx-auto items-center">
              {/* Single Column Upload Box - Premium MANG Style */}
              <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[40px] border border-white shadow-[0_20px_60px_rgba(0,77,64,0.08)] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-emerald-400/20 blur-[80px] pointer-events-none rounded-full" />
                
                {/* Persona Selector */}
                
                <div className="mb-6 relative z-10 text-left space-y-4">
                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-wider">Select Your Role</label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONAS.map(p => (
                        <button
                          key={p}
                          onClick={() => { setPersona(p); setIsCustomPersona(false); }}
                          className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${persona === p && !isCustomPersona ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] scale-105 border-transparent' : 'bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 shadow-sm'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => { setIsCustomPersona(true); setPersona(customPersonaValue || "Custom"); }}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${isCustomPersona ? 'bg-slate-800 text-white shadow-[0_8px_20px_rgba(15,23,42,0.3)] scale-105 border-transparent' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'}`}
                      >
                        + Custom
                      </button>
                    </div>
                  </div>

                  {isCustomPersona && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        placeholder="e.g. Subtenant, Investor..."
                        value={customPersonaValue}
                        onChange={(e) => {
                          setCustomPersonaValue(e.target.value);
                          setPersona(e.target.value || "Custom");
                        }}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white text-sm font-medium shadow-inner transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-black text-slate-800 mb-2 uppercase tracking-wider mt-2">Specific Concern (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Uncapped CAM fees, early termination penalties..."
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white text-sm font-medium shadow-inner transition-all"
                    />
                  </div>
                </div>


                <div className={`relative group rounded-[32px] border-2 border-dashed transition-all duration-500 p-16 md:p-24 text-center bg-white/50 backdrop-blur-sm z-10
                  ${file ? 'border-emerald-500 bg-emerald-50/50 shadow-[inset_0_0_40px_rgba(16,185,129,0.1)]' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                  
                  <FileText className={`w-16 h-16 mx-auto mb-6 transition-all duration-500 ${file ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-emerald-500 group-hover:scale-110'}`} />
                  
                  <label className="cursor-pointer block w-full h-full absolute inset-0 z-20" id="file-upload-label">
                    <input type="file" id="file-upload" accept=".pdf" onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      setFile(selected);
                    }} className="hidden" />
                  </label>

                  <div className="relative z-0">
                    <p className="text-[24px] font-black text-slate-800 mb-2">
                      {file ? file.name : "Drop your lease here"}
                    </p>
                    <p className="text-[16px] text-slate-500">
                      {file ? "Analyzing..." : "or click to browse"}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (file) {
                      handleUpload(file);
                    } else {
                      document.getElementById('file-upload')?.click();
                    }
                  }}
                  disabled={loading}
                  className={`w-full mt-6 h-[72px] rounded-[24px] font-black text-[20px] transition-all flex items-center justify-center gap-3 relative z-20 hover:-translate-y-1 hover:scale-[1.02] shadow-[0_10px_30px_rgba(16,185,129,0.3)] ${loading ? 'opacity-80 cursor-wait bg-[#10B981] text-[#004D40]' : (file ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-[0_15px_40px_rgba(15,23,42,0.3)]')}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center w-full h-[24px]">
                      <div className="w-8 flex justify-end mr-3"><Loader2 className="w-8 h-8 animate-spin shrink-0" /></div>
                      <span className="text-left text-[16px] leading-tight w-[280px] md:w-[320px] truncate">
                        {LOADING_MESSAGES[loadingMessageIndex]}
                      </span>
                    </span>
                  ) : (
                    <>
                      <Zap className="w-8 h-8" />
                      {file ? "Scan Lease Now" : "Select PDF & Scan"}
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                  <Lock className="w-4 h-4" /> Secure, zero-retention analysis
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Features Section */}
            <div className="mt-32 max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-black/5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] shadow-sm mb-6 text-slate-500">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  What you get instantly
                </div>
                <h3 className="text-[36px] md:text-[48px] font-black tracking-[-0.03em] leading-[1.1] text-[#0F172A] mb-6">
                  Don&apos;t just find the gotchas.<br />
                  <span className="text-emerald-600">Push back and win.</span>
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-[20px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-black/5 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-[20px] font-black text-slate-900 mb-2">Expose Hidden Liabilities</h4>
                      <p className="text-[16px] text-slate-600 leading-relaxed">
                        We scan for uncapped Common Area Maintenance (CAM) fees, one-sided personal guarantees, and sneaky relocation clauses that commercial landlords try to hide.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-[20px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-black/5 flex items-center justify-center shrink-0">
                      <FileText className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-[20px] font-black text-slate-900 mb-2">Plain English Translations</h4>
                      <p className="text-[16px] text-slate-600 leading-relaxed">
                        Stop guessing what &quot;Tenant&apos;s Proportionate Share&quot; actually means. We translate every predatory lease clause into blunt, undeniable English so you know exactly what it will cost your business.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-[20px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-black/5 flex items-center justify-center shrink-0">
                      <Mail className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-[20px] font-black text-slate-900 mb-2">Ready-to-Send Pushback Drafts</h4>
                      <p className="text-[16px] text-slate-600 leading-relaxed">
                        Don&apos;t pay a real estate attorney $400/hr to draft an email. We automatically generate polite, firm email copy you can paste straight to your landlord or broker to negotiate better lease terms.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 blur-3xl rounded-full" />
                  <div className="w-full rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white/60 bg-white/40 backdrop-blur-3xl relative z-10 p-8 flex flex-col gap-6 overflow-hidden select-none" style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px) rotateX(2deg) rotateY(-2deg)' }}>
                    {/* Inner highlight for glassmorphism */}
                    <div className="absolute inset-0 rounded-[32px] border border-white pointer-events-none opacity-50" style={{ mixBlendMode: 'overlay' }}></div>
                    
                    <div className="flex items-center justify-between mb-2 border-b border-slate-200/50 pb-4 relative z-10">
                      <div className="h-6 w-1/3 bg-slate-800/10 rounded-md shadow-inner"></div>
                      <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]">Scan Complete</div>
                    </div>
                    
                    {/* Text lines */}
                    <div className="space-y-3 relative z-10">
                      <div className="h-3 w-full bg-slate-800/5 rounded-full"></div>
                      <div className="h-3 w-5/6 bg-slate-800/5 rounded-full"></div>
                    </div>
                    
                    {/* Threat Card */}
                    <div className="p-6 rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-50/80 to-white/60 shadow-[0_10px_30px_rgba(239,68,68,0.1)] mt-2 relative transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(239,68,68,0.2)] z-10 backdrop-blur-md">
                       <div className="absolute -top-3 left-6 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] uppercase tracking-[0.15em] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-red-400/50">
                         <AlertTriangle className="w-3 h-3" /> Trap: Uncapped CAM Fees
                       </div>
                       <div className="h-3 w-full bg-red-500/10 rounded-full mb-3 mt-3 shadow-inner"></div>
                       <div className="h-3 w-3/4 bg-red-500/10 rounded-full shadow-inner"></div>
                    </div>
                    
                    <div className="space-y-3 mt-2 relative z-10">
                      <div className="h-3 w-full bg-slate-800/5 rounded-full"></div>
                      <div className="h-3 w-4/5 bg-slate-800/5 rounded-full"></div>
                    </div>
                    
                    {/* Fix Card */}
                    <div className="p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-50/80 to-white/60 shadow-[0_10px_30px_rgba(16,185,129,0.1)] mt-2 relative transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] z-10 backdrop-blur-md">
                       <div className="absolute -top-3 left-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] uppercase tracking-[0.15em] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-400/50">
                         <CheckCircle className="w-3 h-3" /> AI Pushback Drafted
                       </div>
                       <div className="h-3 w-full bg-emerald-500/10 rounded-full mb-3 mt-3 shadow-inner"></div>
                       <div className="h-3 w-3/4 bg-emerald-500/10 rounded-full shadow-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1400px] mx-auto">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white/70 backdrop-blur-lg border border-white p-6 rounded-3xl shadow-sm gap-4">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => {
                    localStorage.removeItem("lease_pulse_results");
                    localStorage.removeItem("lease_pulse_unlocked");
                    setResults(null);
                    setUnlocked(false);
                    window.history.replaceState(null, "", window.location.pathname);
                  }}
                  className="shrink-0 flex items-center justify-center w-12 h-12 bg-white rounded-full border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all group"
                  title="Back to Upload"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
                    Analyzing as: <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{results.persona}</span>
                    {isPro && (
                      <button onClick={() => setShowRerunModal(true)} className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors underline decoration-slate-300 hover:decoration-emerald-500 underline-offset-2">
                        Change
                      </button>
                    )}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900">{results.filename}</h3>
                </div>
              </div>
              <div className="flex items-center gap-6 md:text-right">
                <div className="hidden md:block">
                  <p className="text-sm text-slate-500 font-medium mb-1">Gotcha Score</p>
                  <p className={`text-2xl font-black ${highRiskCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {highRiskCount > 0 ? `${highRiskCount} Red Flags` : 'Looks Clean'}
                  </p>
                </div>
                {isPro && (
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full font-bold shadow-sm transition-all text-sm"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" /> Past Scans
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Column: The Risks */}
              <div className={`w-full ${unlocked ? 'lg:w-7/12 xl:w-8/12' : ''} space-y-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                    Hidden Gotchas & Liabilities
                  </h4>
                  {unlocked && (
                    <p className="text-sm text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                      <CheckSquare className="w-4 h-4" /> Select items to build email
                    </p>
                  )}
                </div>
              
              {allLiabilities.length === 0 ? (
                <div className="bg-white/60 border border-white p-8 rounded-3xl text-center shadow-sm">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-600">No major liabilities found for your persona.</p>
                </div>
              ) : (
                allLiabilities.map((lib, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex gap-4">
                      {/* Selection Checkbox */}
                      <div className="shrink-0 mt-1 cursor-pointer" onClick={() => toggleSelection(i)}>
                        {selectedIndices.includes(i) ? (
                          <CheckSquare className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Square className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                        )}
                      </div>
                      
                      <div className="shrink-0 mt-1">
                        {lib.severity?.toLowerCase() === 'high' ? (
                          <div className="bg-red-100 p-2 rounded-xl border border-red-200">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                          </div>
                        ) : (
                          <div className="bg-orange-100 p-2 rounded-xl border border-orange-200">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-4 flex items-center justify-between">
                          <h5 className="font-black text-lg text-slate-800">
                            {lib.title || (lib.plain_english ? lib.plain_english.split(' ').slice(0, 6).join(' ') + '...' : "Identified Liability")}
                          </h5>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${lib.severity?.toLowerCase() === 'high' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                            {lib.severity || 'Medium'} Risk
                          </span>
                        </div>
                        
                        {/* The Flip: Legal vs Plain English */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legal Jargon</p>
                            <p className="text-sm text-slate-600 font-serif italic">&quot;{lib.legal_text || 'Text not extracted.'}&quot;</p>
                          </div>
                          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Plain English Translation</p>
                            <p className="text-sm text-blue-900 font-medium">{lib.plain_english || 'Translation pending.'}</p>
                          </div>
                        </div>

                        {/* The Paywall / AI Negotiator */}
                        <div className="border-t border-slate-100 pt-6">
                          {!unlocked ? (
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
                              <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
                              <div className="relative z-10">
                                <h5 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                  <Mail className="w-5 h-5 text-emerald-400" />
                                  The Negotiator
                                </h5>
                                <p className="text-slate-400 text-sm">Unlock the exact email copy to push back on this term.</p>
                              </div>
                              <button 
                                onClick={() => setShowPricingModal(true)}
                                className="relative z-10 bg-white text-slate-900 font-bold px-6 py-2.5 rounded-full hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
                              >
                                Unlock Analysis
                              </button>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                              <h5 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                                <Unlock className="w-5 h-5 text-emerald-600" />
                                Suggested Pushback Email
                              </h5>
                              <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed font-medium">
                                {lib.pushback_draft || "Could not generate draft for this item."}
                              </p>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(lib.pushback_draft || "");
                                  alert("Copied to clipboard!");
                                }}
                                className="mt-4 text-xs font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors"
                              >
                                Copy Snippet
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>

              {/* Right Column: The Sticky Email Builder */}
              {unlocked && (
                <div className="w-full lg:w-5/12 xl:w-4/12 sticky top-24">
                  <div className="bg-white border-2 border-emerald-100 p-6 rounded-3xl shadow-xl">
                    <h5 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-emerald-500" />
                      Your Negotiation Draft
                    </h5>
                    <p className="text-slate-500 text-sm mb-6 pb-4 border-b border-slate-100">
                      Check/uncheck the boxes on the left to add or remove bullet points. When you are ready, copy the final draft.
                    </p>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto">
                      {generateEmailDraft()}
                    </div>
                    
                    <button 
                      onClick={handleCopyConsolidatedEmail}
                      disabled={selectedIndices.length === 0}
                      className="mt-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all w-full shadow-md flex justify-center items-center gap-2"
                    >
                      Copy Entire Email
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-12 flex flex-col items-center gap-6">
               <button onClick={() => { setResults(null); setFile(null); setUnlocked(false); setSelectedIndices([]); }} className="text-slate-500 hover:text-slate-800 font-bold transition-colors mt-4">
                ← Scan Another Document
              </button>
            </div>
          </div>
        )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setShowPricingModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Unlock Your Lease</h2>
            <p className="text-slate-500 text-center mb-8">Choose the plan that works best for you. No lease data is ever saved.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pay-As-You-Go */}
              <div className="border border-slate-200 rounded-2xl p-6 hover:border-emerald-500 transition-colors bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Pay-As-You-Go</h3>
                <p className="text-4xl font-black text-slate-900 mb-4">$1.99 <span className="text-sm font-medium text-slate-500">/ scan</span></p>
                <ul className="space-y-3 mb-6 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> One-time unlock</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Full plain English translation</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Pushback email drafts</li>
                  <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" /> Zero retention</li>
                </ul>
                {false ? (
                  <button onClick={() => { setShowPricingModal(false); handleCheckout('payg'); }} className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                    Unlock Single Scan (Dev Mode)
                  </button>
                ) : (
                  <button onClick={() => { setShowPricingModal(false); handleCheckout('payg'); }} className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                    Unlock Single Scan
                  </button>
                )}
              </div>

              {/* Pro (Consumer) */}
              <div className="border-2 border-emerald-500 rounded-2xl p-6 bg-white shadow-xl relative">
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Pro</h3>
                <p className="text-4xl font-black text-slate-900 mb-4">$10.99 <span className="text-sm font-medium text-slate-500">/ mo</span></p>
                <ul className="space-y-3 mb-6 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Unlimited scans</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Priority processing</li>
                  <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" /> Zero retention</li>
                  <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500" /> Auto-renew, cancel anytime</li>
                </ul>
                {false ? (
                  <button onClick={() => { setShowPricingModal(false); handleCheckout('pro'); }} className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-opacity">
                    Subscribe Now (Dev Mode)
                  </button>
                ) : (
                  <>
                    
                    
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

              {showRerunModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowRerunModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Rerun Scan</h3>
              <p className="text-slate-500 mb-6">Select a different persona to view this lease from a new perspective.</p>
              
              {!file && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-700">For your security, we do not store your lease files. You will need to select the PDF again to rerun the scan.</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" /> New Persona
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PERSONAS.map(p => (
                      <button
                        key={p}
                        onClick={() => { setPersona(p); setIsCustomPersona(false); }}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${persona === p && !isCustomPersona ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-200'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => { setIsCustomPersona(true); setPersona(customPersonaValue || "Custom Persona"); }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${isCustomPersona ? 'bg-slate-800 text-white shadow-md' : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      <Zap className="w-3 h-3" /> Custom
                    </button>
                  </div>
                  
                  {isCustomPersona && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="e.g. Landlord, Developer..."
                        value={customPersonaValue}
                        onChange={(e) => {
                          setCustomPersonaValue(e.target.value);
                          setPersona(e.target.value || "Custom Persona");
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 text-sm shadow-inner"
                      />
                    </div>
                  )}
                </div>

                {!file && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" /> Select PDF
                    </label>
                    <div className="relative group rounded-xl border-2 border-dashed transition-all duration-300 p-6 text-center bg-slate-50 border-slate-300 hover:border-slate-400">
                      <label className="cursor-pointer block w-full h-full absolute inset-0 z-10">
                        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                      </label>
                      <p className="text-sm font-bold text-slate-600">Select file to rerun</p>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    setShowRerunModal(false);
                    handleUpload();
                  }}
                  disabled={!file || loading}
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                    ${file && !loading ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  Rerun Scan
                </button>
              </div>
            </div>
          </div>
        )}
      {showWaitlistModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowWaitlistModal(false)} />
            <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-md w-full relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-white/20">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 text-center">We&apos;re at Capacity</h3>
              <p className="text-slate-600 text-center mb-8 leading-relaxed">
                Tenant Pulse is currently in private beta and we&apos;ve hit our daily scan limit. Join the waitlist to get early access when we open up more slots.
              </p>
              
              {waitlistSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-center font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> You&apos;re on the list!
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setWaitlistSubmitted(true);
                    sendGAEvent("event", "Waitlist_Email_Submitted", { email: waitlistEmail });
                  }}
                  className="space-y-4"
                >
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-50 font-medium"
                  />
                  <button 
                    type="submit"
                    className="w-full h-[60px] rounded-2xl font-black text-[18px] transition-all flex items-center justify-center gap-2 bg-[#10B981] text-[#004D40] hover:-translate-y-1 hover:scale-[1.02] shadow-[0_10px_20px_rgba(16,185,129,0.3)]"
                  >
                    Join Waitlist
                  </button>
                </form>
              )}
              
              <button 
                onClick={() => setShowWaitlistModal(false)}
                className="w-full mt-4 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Legal Disclaimer */}
      <footer className="relative z-10 border-t border-slate-200 mt-12 py-8 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Disclaimer</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Tenant Pulse is an AI tool designed for informational purposes only. It is <strong>not</strong> a law firm and does <strong>not</strong> provide legal advice. Using this tool does not create an attorney-client relationship. Always consult with a qualified legal professional before signing any legally binding agreement or sending negotiation communications.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-medium text-slate-500 border border-slate-200">
            <Zap className="w-3 h-3 text-emerald-500" />
            Powered by <a href="https://membrane-api.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-700 hover:text-emerald-600 transition-colors underline decoration-slate-300 underline-offset-2">Membrane AI Infrastructure</a>
          </div>
        </div>
      </footer>
    </div>
  );
}