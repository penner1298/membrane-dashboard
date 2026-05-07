import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { ShieldAlert, Trophy, TrendingDown, Layers, Zap } from "lucide-react";

export default async function AdminConsolePage() {
  const user = await currentUser();

  // ONLY allow your specific Clerk ID (or emails) to access this route
  const allowedEmails = ["josh@penner.com", "thejoshpenner@gmail.com", "joshpenner@gmail.com", "josh@corevaluesconsulting.com"]; // Add yours
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  if (!user || !userEmail || !allowedEmails.includes(userEmail)) {
    redirect("/"); // Kick anyone else back to the homepage
  }

  // --- LIVE POSTGRES QUERIES ---
  let totalRetail = 0;
  let totalWholesale = 0;
  let schemaRescues = 0;
  let thwartedAttacks = 0;
  let totalCalls = 0;
  
  try {
      const statsResult = await pool.query(`
        SELECT 
          SUM(billed_amount) as total_retail,
          SUM(wholesale_cost) as total_wholesale,
          COUNT(*) as total_calls,
          SUM(CASE WHEN status LIKE '%CACHE%' THEN 1 ELSE 0 END) as cache_hits
        FROM api_logs 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `);
      
      totalRetail = parseFloat(statsResult.rows[0]?.total_retail || 0);
      totalWholesale = parseFloat(statsResult.rows[0]?.total_wholesale || 0);
      totalCalls = parseInt(statsResult.rows[0]?.total_calls || 0);
      
      const rescueResult = await pool.query(`
        SELECT COUNT(*) as rescues 
        FROM api_logs 
        WHERE route_used = 'HEURISTIC_RECOVERY'
      `);
      schemaRescues = parseInt(rescueResult.rows[0]?.rescues || 0);
      
      const dlqResult = await pool.query(`
        SELECT COUNT(*) as blocked 
        FROM dlq_logs 
        WHERE error_message ILIKE '%Policy Violation%' OR error_message ILIKE '%Jailbreak%'
      `);
      thwartedAttacks = parseInt(dlqResult.rows[0]?.blocked || 0);
      
  } catch (e) {
      console.error("Failed to fetch admin stats:", e);
  }

  const margin = totalRetail > 0 ? ((totalRetail - totalWholesale) / totalRetail) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <h1 className="text-3xl font-black tracking-tight">Apex Operator Console</h1>
          <span className="ml-auto text-xs font-bold px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">RESTRICTED ACCESS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">30d Retail Revenue</p>
            <p className="text-3xl font-black text-emerald-400">${totalRetail.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">30d Wholesale Cost</p>
            <p className="text-3xl font-black text-rose-400">${totalWholesale.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Profit Margin</p>
            <p className="text-3xl font-black text-white">{margin.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total API Calls</p>
            <p className="text-3xl font-black text-blue-400">{totalCalls.toLocaleString()}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500"/> Live Infrastructure Fidelity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <Layers className="w-8 h-8 text-indigo-400 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schema Rescues (Waterfall)</p>
            <p className="text-4xl font-black text-white">{schemaRescues.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <Zap className="w-8 h-8 text-amber-400 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thwarted Attacks (Sniper DLQ)</p>
            <p className="text-4xl font-black text-white">{thwartedAttacks.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
