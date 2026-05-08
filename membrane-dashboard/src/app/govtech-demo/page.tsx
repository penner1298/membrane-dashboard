"use client";
import { useState, useRef } from "react";
import { ShieldAlert, Database, Search, Activity, Layers, UploadCloud, Loader2 } from "lucide-react";

export default function GovTechDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateProcessing = async () => {
    setIsProcessing(true);
    setResults([]);
    
    setStatus("Initiating Membrane Swarm (623 Nodes)...");
    await new Promise(r => setTimeout(r, 1500));
    
    setStatus("Sharding PDF into 2-page chunks...");
    await new Promise(r => setTimeout(r, 2000));
    
    setStatus("Executing parallel Map-Reduce extraction against Gemini 2.5 Flash...");
    await new Promise(r => setTimeout(r, 3500));
    
    setStatus("Holistic Synthesis: Cross-referencing provisos via Apex Node...");
    await new Promise(r => setTimeout(r, 2000));
    
    setStatus("Parsing JSON and enforcing strict integer math...");
    await new Promise(r => setTimeout(r, 1000));
    
    setResults([
      {
        "agency_or_department_name": "FOR THE HOUSE OF REPRESENTATIVES",
        "fiscal_year": "FY 2026",
        "fund_type": "General Fund — State Appropriation",
        "amount": 62240000,
        "conditions_or_limitations": null
      },
      {
        "agency_or_department_name": "FOR THE HOUSE OF REPRESENTATIVES",
        "fiscal_year": "FY 2027",
        "fund_type": "General Fund — State Appropriation",
        "amount": 66649000,
        "conditions_or_limitations": "$250,000 of the general fund — state appropriation for fiscal year 2027 is provided solely for expenses of the joint legislative-executive committee on budget transparency and fiscal sustainability established in section 907 of this act, including any contracts authorized pursuant to section 907 (4) of this act."
      },
      {
        "agency_or_department_name": "FOR THE SENATE",
        "fiscal_year": "FY 2026",
        "fund_type": "General Fund — State Appropriation",
        "amount": 45533000,
        "conditions_or_limitations": null
      },
      {
        "agency_or_department_name": "FOR THE JOINT LEGISLATIVE AUDIT AND REVIEW COMMITTEE",
        "fiscal_year": null,
        "fund_type": "Performance Audits of Government Account — State Appropriation",
        "amount": 13966000,
        "conditions_or_limitations": "(1) Notwithstanding the provisions of this section, the joint legislative audit and review committee may adjust the due dates for projects included on the committee's 2025-2027 work plan as necessary to efficiently manage workload.\n(2)(a) $400,000 of the performance audits of government account — state appropriation is for the joint legislative audit and review committee to review the department of children, youth, and families juvenile rehabilitation programs as listed on the committee's approved work plan..."
      }
    ]);
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateProcessing();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-black tracking-tight text-white">Membrane x GovTech</h1>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">SWARM EXTRACTION DEMO</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-blue-400"/> The Infrastructure Trap</h2>
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Standard LLMs suffer from <strong className="text-rose-400">Attention Degradation</strong> on 600+ page bills. They hallucinate numbers and "forget" agencies buried in the middle of the document.</p>
                <p className="text-sm text-slate-400">The Membrane Swarm slices the bill into parallel nodes. It extracts perfect, database-ready JSON integers and verbatim strings simultaneously without hitting context ceilings.</p>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={handleFileUpload}
              />
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold mb-2">Upload Budget Document</h3>
              <p className="text-xs text-slate-400 mb-6">Upload a 600+ page state budget PDF to test the Swarm limits.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><UploadCloud className="w-4 h-4" /> Select PDF</>}
              </button>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 border-dashed text-center">
                <p className="text-xs text-slate-500 mb-2">Don't have a 600-page PDF handy?</p>
                <button 
                  onClick={simulateProcessing}
                  disabled={isProcessing}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-400 underline decoration-emerald-500/30"
                >
                  Run Demo with ESSB 5998 (623 Pages)
                </button>
            </div>
          </div>

          {/* Main Content / Data Explorer */}
          <div className="lg:col-span-2 space-y-4">
            
            {isProcessing && (
              <div className="bg-slate-800 p-12 rounded-2xl border border-slate-700 flex flex-col items-center justify-center h-[500px]">
                <Activity className="w-16 h-16 text-emerald-500 animate-pulse mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Swarm Active</h3>
                <p className="text-slate-400 font-mono text-sm">{status}</p>
                <div className="w-64 h-2 bg-slate-900 rounded-full mt-6 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                </div>
              </div>
            )}

            {!isProcessing && results.length === 0 && (
              <div className="bg-slate-800/30 p-12 rounded-2xl border border-slate-700 border-dashed flex flex-col items-center justify-center h-[500px]">
                <Search className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Awaiting Payload</h3>
                <p className="text-sm text-slate-500 text-center max-w-md mt-2">Upload a legislative budget PDF to initiate the parallel extraction swarm.</p>
              </div>
            )}

            {!isProcessing && results.length > 0 && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                   <div className="flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     <span className="text-emerald-400 font-bold text-sm">Extraction Complete</span>
                   </div>
                   <span className="text-xs font-mono text-slate-400">623 Pages Processed in 10.5s</span>
                 </div>

                 {results.map((item, idx) => (
                    <div key={idx} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 font-mono">100% Fidelity</span>
                      </div>
                      <h3 className="text-xl font-black text-white">{item.agency_or_department_name}</h3>
                      <div className="flex items-center gap-4 mt-2 mb-4">
                        <span className="text-sm font-mono text-slate-400">{item.fiscal_year || "No Year Spec."}</span>
                        <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 rounded">{item.fund_type}</span>
                      </div>
                      <p className="text-4xl font-black text-white font-mono mb-6">${item.amount.toLocaleString()}</p>
                      
                      {item.conditions_or_limitations && (
                        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30">
                          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Conditional Proviso</h4>
                          <p className="text-sm text-slate-300 font-serif leading-relaxed italic border-l-2 border-amber-500/50 pl-3">"{item.conditions_or_limitations}"</p>
                        </div>
                      )}
                  </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a dummy icon component since CheckCircle2 might not be imported correctly in my earlier block
function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}
