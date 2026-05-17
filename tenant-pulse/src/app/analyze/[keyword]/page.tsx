import { ShieldAlert, Zap, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AnalyzeMirror({ params }: { params: { keyword: string } }) {
  const keyword = decodeURIComponent(params.keyword).replace(/-/g, ' ');
  
  // Simple logic to parse the keyword into components for the "Smart Template"
  const isPredatory = keyword.toLowerCase().includes('predatory') || keyword.toLowerCase().includes('unfair');
  const clause = keyword.split(' in ')[0].replace('predatory ', '').replace('aggressive ', '').replace('unfair ', '');
  const audience = keyword.split(' in ')[1] || 'your lease';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-12">
          <Link href="/" className="text-emerald-600 font-bold flex items-center gap-2 hover:underline">
            <Zap className="w-4 h-4" /> Tenant Pulse
          </Link>
        </nav>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldAlert className="w-3 h-3" /> Risk Analysis Mirror
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight capitalize">
            Is that {clause} in {audience} {isPredatory ? 'predatory' : 'standard'}?
          </h1>
          <p className="mt-6 text-xl text-slate-600 leading-relaxed">
            We analyzed thousands of agreements to find how {clause} terms typically impact {audience}. 
            Our AI-driven &quot;Tenant Pulse&quot; identifies if you&apos;re signing a standard deal or a liability trap.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> The &quot;Gotcha&quot;
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Predatory {clause} clauses often hide in plain sight using dense legal jargon. For {audience}, this can result in unexpected costs or total loss of intellectual property.
            </p>
          </div>
          <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> The Pulse Fix
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Drop your PDF into Tenant Pulse. We translate this {clause} into plain English and draft the exact email you need to push back—instantly.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 bg-emerald-400 text-emerald-950 px-6 py-3 rounded-full font-bold hover:bg-emerald-300 transition-all">
              Scan Your Lease Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <section className="border-t border-slate-200 pt-12">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Related Risk Mirrors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/analyze/predatory-non-compete-in-freelancer-agreement" className="p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors text-sm font-medium">
              Non-Compete Risks for Freelancers &rarr;
            </Link>
            <Link href="/analyze/unlimited-liability-in-saas-agreement" className="p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors text-sm font-medium">
              Unlimited Liability in SaaS Agreements &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
