"use client";

import { useState, useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { Source_Serif_4 } from "next/font/google";
import { ShieldAlert, Zap, FileText, Loader2, Lock, ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";


const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface SeoData {
  title?: string; clause?: string;
  gotcha_title: string;
  gotcha_text: string;
  fix_title: string;
  fix_text: string;
  deep_dive_html?: string;
  deep_slide_html?: string;
}

const PERSONAS = ["Restaurant Owner", "Dental Practice", "Tech Startup", "Retail Store", "Franchisee"];

export default function ClauseClient({ titleWord, seoData }: { titleWord: string, seoData: SeoData }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<string>(PERSONAS[0]);
  const [isCustomPersona, setIsCustomPersona] = useState(false);
  const [customPersonaValue, setCustomPersonaValue] = useState("");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Custom Telemetry wrapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackTelemetry = (event: string, metadata?: any) => {
    sendGAEvent('event', event, metadata);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lease-scanner-backend.onrender.com";
    fetch(`${apiUrl}/api/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, metadata, project: 'Tenant Pulse' }), keepalive: true }).catch(() => {});
  };

  useEffect(() => {
    // Custom Pageview tracking
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lease-scanner-backend.onrender.com";
    fetch(`${apiUrl}/api/telemetry`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        event: "Pageview", 
        metadata: { path: window.location.pathname, search: window.location.search, referrer: document.referrer }, 
        project: 'Tenant Pulse' 
      }), 
      keepalive: true 
    }).catch(() => {});
  }, []);

  const handleUpload = async (selectedFile?: File) => {
    trackTelemetry("Scan_lease_Clicked", { keyword: titleWord, persona });
    const fileToScan = selectedFile || file;
    if (!fileToScan) return;
    setLoading(true);
    
    // Fake Door Delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setShowWaitlistModal(true);
    trackTelemetry("Waitlist_Modal_Opened", { keyword: titleWord, persona });
  };

  const htmlContent = seoData.deep_dive_html || seoData.deep_slide_html || "<p>Analysis unavailable.</p>";

  return (
    <div className="bg-[#f8fafc] text-[#0F172A] min-h-screen relative overflow-clip font-sans selection:bg-emerald-200">
      
      {/* Dynamic CSS for the injected HTML content */}
      <style dangerouslySetInnerHTML={{__html: `
        .clause-deep-dive h3 {
            font-family: ui-sans-serif, system-ui, sans-serif;
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 40px;
            margin-bottom: 16px;
        }
        .clause-deep-dive ul {
            list-style-type: disc;
            padding-left: 32px;
            margin-top: 16px;
            margin-bottom: 16px;
        }
        .clause-deep-dive li {
            margin-bottom: 12px;
            color: #334155;
            font-family: ui-sans-serif, system-ui, sans-serif;
            font-size: 18px;
        }
        .clause-deep-dive p {
            margin-bottom: 24px;
        }
        .clause-deep-dive b, .clause-deep-dive strong {
            color: #0f172a;
            font-weight: 700;
        }
        .clause-deep-dive a {
            color: #10B981;
            text-decoration: underline;
            text-underline-offset: 4px;
            font-weight: 600;
        }
      `}} />

      {/* MANG Noise Overlay */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-[99]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* MANG Topo Background */}
      <svg className="absolute top-[-10%] right-[-10%] w-[80%] opacity-[0.08] z-0 pointer-events-none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,500 C150,400 350,600 500,500 C650,400 850,600 1000,500" stroke="#004D40" strokeWidth="5" fill="none" />
          <path d="M0,520 C150,420 350,620 500,520 C650,420 850,620 1000,520" stroke="#004D40" strokeWidth="3" fill="none" />
          <path d="M0,540 C150,440 350,640 500,540 C650,440 850,640 1000,540" stroke="#004D40" strokeWidth="1" fill="none" />
      </svg>

      {/* Main Content Area */}
      <div className="w-full max-w-[1400px] px-6 py-12 relative z-10 mx-auto">
        
        {/* Nav */}
        <div className="flex items-center justify-between mb-16">
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-black/5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mb-[3px]">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg> 
                Tenant Pulse
            </Link>
            <div className="flex items-center gap-4">
              
              
            </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 items-start">
            
            {/* Left Side: The SEO Article & Pitch */}
            <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600 mb-6">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" /> Legal Risk Analysis
                </div>

                <h1 className="font-black text-[52px] md:text-[64px] leading-[1.05] tracking-[-0.04em] mb-8 text-[#0F172A]">
                    {seoData.clause ? (
                      <>
                        Predatory <span className="text-emerald-500">{seoData.clause}</span> Clauses Exposed
                      </>
                    ) : (
                      <>Instantly expose predatory <span className="text-emerald-500">{titleWord}</span> clauses.</>
                    )}
                </h1>

                {/* MANG Cards Grid */}
                <div className="grid sm:grid-cols-2 gap-6 mb-16">
                  
                  {/* The Gotcha Card */}
                  <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                    <div className="font-black text-[11px] uppercase tracking-[0.05em] text-[#f97316] mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> The Gotcha: {seoData.gotcha_title}
                    </div>
                    <p className="text-[#64748b] text-[15px] leading-[1.6]">
                        {seoData.gotcha_text}
                    </p>
                  </div>

                  {/* The Fix Card */}
                  <div className="bg-gradient-to-br from-[#004D40] to-[#00332c] p-8 rounded-[32px] shadow-[0_20px_40px_rgba(0,77,64,0.2)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="font-black text-[11px] uppercase tracking-[0.05em] text-emerald-400 mb-4 flex items-center gap-2 relative z-10">
                        <CheckCircle className="w-4 h-4" /> The Pulse Fix: {seoData.fix_title}
                    </div>
                    <p className="text-[#ccfbf1] text-[15px] leading-[1.6] relative z-10">
                        {seoData.fix_text}
                    </p>
                  </div>

                </div>

                {/* The Deep Dive Article (SEO Fodder) */}
                <div className="pt-12 border-t border-slate-200">
                    <h2 className="font-black text-[32px] mb-6 text-[#0F172A]">Deep Dive: Understanding {titleWord}</h2>
                    <div 
                        className={`${sourceSerif.className} text-[20px] leading-[1.8] text-[#334155] clause-deep-dive`}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </div>

            {/* Right Side: The Sticky Dropzone Scanner */}
            <div className="lg:sticky lg:top-12">
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] border border-slate-200/60 shadow-[0_20px_60px_rgba(0,77,64,0.08)] relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-emerald-400/10 blur-[60px] pointer-events-none rounded-full" />
                    
                    <div className="text-center mb-6 relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6 shadow-inner border border-emerald-100">
                            <Zap className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="font-black text-[28px] text-[#0F172A] mb-2 tracking-tight">Scan Your Lease</h3>
                        <p className="text-[16px] text-slate-500 font-medium">We&apos;ll find the {titleWord} risks in seconds.</p>
                    </div>

                    {/* Persona Selector */}
                    <div className="mb-6 relative z-10">
                        <label className="block text-sm font-bold text-slate-700 mb-2">My Role / Perspective:</label>
                        <select 
                            value={isCustomPersona ? "Custom" : persona} 
                            onChange={(e) => {
                                if (e.target.value === "Custom") {
                                    setIsCustomPersona(true);
                                    setPersona(customPersonaValue || "Custom Persona");
                                } else {
                                    setIsCustomPersona(false);
                                    setPersona(e.target.value);
                                }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white text-sm font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                        >
                            {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="Custom">Other (Custom)</option>
                        </select>
                        
                        {isCustomPersona && (
                            <input
                                type="text"
                                placeholder="e.g. Landlord, Developer..."
                                value={customPersonaValue}
                                onChange={(e) => {
                                    setCustomPersonaValue(e.target.value);
                                    setPersona(e.target.value || "Custom Persona");
                                }}
                                className="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 text-sm shadow-inner"
                            />
                        )}
                    </div>

                    <div className={`relative group rounded-[32px] border-2 border-dashed transition-all duration-500 p-10 text-center bg-slate-50/50 backdrop-blur-sm z-10
                      ${file ? 'border-emerald-500 bg-emerald-50 shadow-[inset_0_0_40px_rgba(16,185,129,0.05)]' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'}`}>
                      
                      <FileText className={`w-14 h-14 mx-auto mb-5 transition-all duration-500 ${file ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-emerald-400 group-hover:scale-110'}`} />
                      
                      <label className="cursor-pointer block w-full h-full absolute inset-0 z-20" id="file-upload-label">
                        <input type="file" id="file-upload" accept=".pdf" onChange={(e) => {
                          const selected = e.target.files?.[0] || null;
                          setFile(selected);
                        }} className="hidden" />
                      </label>

                      <div className="relative z-0">
                        <p className="text-[20px] font-black text-[#0F172A] mb-2">
                          {file ? file.name : "Drop Lease PDF here"}
                        </p>
                        <p className="text-[15px] text-slate-500 font-medium">
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
                      className={`w-full mt-8 h-[64px] rounded-[24px] font-black text-[18px] transition-all flex items-center justify-center gap-3 relative z-20 bg-[#10B981] text-[#004D40] hover:-translate-y-1 hover:scale-[1.02] shadow-[0_10px_30px_rgba(16,185,129,0.25)]
                        ${loading ? 'opacity-80 cursor-wait' : ''}`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin shrink-0" /> Scanning...
                        </>
                      ) : (
                        <>
                          Scan My Lease <ChevronLeft className="w-5 h-5 rotate-180" />
                        </>
                      )}
                    </button>

                    {/* MANG Seal of Trust */}
                    <div className="mt-8 flex items-center justify-center gap-4 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-slate-100 shrink-0">
                            <Lock className="w-5 h-5 text-[#004D40]" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Seal of Trust</div>
                            <div className="text-[12px] font-bold text-slate-700">Verified by Membrane API</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Legal Disclaimer */}
      <footer className="relative z-10 border-t border-slate-200 mt-24 py-12 bg-slate-50">
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
                    trackTelemetry("Waitlist_Email_Submitted", { email: waitlistEmail, keyword: titleWord, persona });
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

      </footer>
    </div>
  );
}


// Dummy icon for AlertTriangle
function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
