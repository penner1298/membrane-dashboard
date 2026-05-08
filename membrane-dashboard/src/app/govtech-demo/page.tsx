import { ShieldAlert, Database, FileText, Search, Activity, Layers } from "lucide-react";

export default function GovTechDemo() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-4">
          <Layers className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-black tracking-tight text-white">Membrane x GovTech: Budget Explorer</h1>
          <span className="ml-auto text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">SWARM EXTRACTION DEMO</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-blue-400"/> Source Document</h2>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 mb-4">
                <p className="text-sm font-bold text-white">ESSB 5998: Operating Budget</p>
                <p className="text-xs text-slate-400 mt-1">69th Legislature - 2026 Regular Session</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pages: 312</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Swarm Extracted in 18.0s</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Problem with standard LLMs</h3>
                <p className="text-sm text-slate-400">Standard models suffer from <strong className="text-rose-400">Attention Degradation</strong> on 300+ page bills. They hallucinate numbers and "forget" agencies buried in the middle of the document.</p>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4">The Membrane Advantage</h3>
                <p className="text-sm text-slate-400">The Swarm Architecture slices the bill into 150 parallel nodes. It extracts perfect, database-ready JSON integers and verbatim strings simultaneously.</p>
              </div>
            </div>
            
            {/* Filter Mockup */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Search className="w-4 h-4 text-amber-400"/> Filter Appropriations</h2>
              <input type="text" placeholder="Search agency or proviso..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 mb-4" />
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 cursor-pointer hover:bg-blue-500/30">FY 2026</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 cursor-pointer hover:bg-purple-500/30">FY 2027</span>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 cursor-pointer hover:bg-rose-500/30">Has Proviso</span>
              </div>
            </div>
          </div>

          {/* Main Content / Data Explorer */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 font-mono">100% Fidelity</span>
                </div>
                <h3 className="text-xl font-black text-white">House of Representatives</h3>
                <div className="flex items-center gap-4 mt-2 mb-4">
                  <span className="text-sm font-mono text-slate-400">FY 2027</span>
                  <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 rounded">General Fund - State</span>
                </div>
                <p className="text-4xl font-black text-white font-mono mb-6">$66,649,000</p>
                
                <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Conditional Proviso</h4>
                  <p className="text-sm text-slate-300 font-serif leading-relaxed italic border-l-2 border-amber-500/50 pl-3">"$250,000 of the general fund — state appropriation for fiscal year 2027 is provided solely for expenses of the joint legislative-executive committee on budget transparency and fiscal sustainability established in section 907 of this act, including any contracts authorized pursuant to section 907 (4) of this act."</p>
                </div>
             </div>

             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 font-mono">100% Fidelity</span>
                </div>
                <h3 className="text-xl font-black text-white">Joint Legislative Audit and Review Committee</h3>
                <div className="flex items-center gap-4 mt-2 mb-4">
                  <span className="text-sm font-mono text-slate-400">No Year Spec.</span>
                  <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 rounded">Performance Audits Acct</span>
                </div>
                <p className="text-4xl font-black text-white font-mono mb-6">$13,966,000</p>
                
                <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Complex Condition & Limitation</h4>
                  <p className="text-sm text-slate-300 font-serif leading-relaxed italic border-l-2 border-amber-500/50 pl-3">"(1) Notwithstanding the provisions of this section, the joint legislative audit and review committee may adjust the due dates for projects included on the committee's 2025-2027 work plan as necessary to efficiently manage workload.<br/><br/>(2)(a) $400,000 of the performance audits of government account — state appropriation is for the joint legislative audit and review committee to review the department of children, youth, and families juvenile rehabilitation programs as listed on the committee's approved work plan..."</p>
                </div>
             </div>

             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden opacity-75">
                <h3 className="text-xl font-black text-white">The Senate</h3>
                <div className="flex items-center gap-4 mt-2 mb-4">
                  <span className="text-sm font-mono text-slate-400">FY 2026</span>
                  <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 rounded">General Fund - State</span>
                </div>
                <p className="text-4xl font-black text-white font-mono">$45,533,000</p>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
