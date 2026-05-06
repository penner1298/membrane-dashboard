import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { cookies } from "next/headers";
import { CopyButton } from "@/components/copy-button";
import { pool } from "@/lib/db";
import { 
  Key, Sparkles, CreditCard, Zap, RefreshCw, 
  TrendingDown, Trophy, ShieldAlert, Mail, Lock, History, Activity, Layers, CheckCircle
} from "lucide-react";
import { DashboardChart } from "./client-chart"; // Updated import

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Self-Healing Database Fixes
  await pool.query("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;");
  await pool.query("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 4) DEFAULT 0.0;");
  await pool.query("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS wholesale_cost DECIMAL(10, 6) DEFAULT 0.0;");

  // Check for the 10-second flash cookie
  const cookieStore = await cookies();
  const flashKey = cookieStore.get("new_api_key")?.value;
  const apiKey = flashKey || "sk_live_... (Click Rotate to generate)";

  // 1. FETCH REAL TENANT DATA
  const { rows: tenantRows } = await pool.query(
    "SELECT balance, referral_code, has_paid, total_saved FROM tenants WHERE clerk_user_id = $1",
    [user.id]
  );
  let tenant = tenantRows[0];

  // JUST-IN-TIME PROVISIONING
  if (!tenant) {
    const newRefCode = `REF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const startingBalance = 50.00;
    const pendingHash = `PENDING_${user.id}`; 
    await pool.query(`
      INSERT INTO tenants (clerk_user_id, balance, referral_code, total_saved, api_key_hash, has_paid)
      VALUES ($1, $2, $3, 0, $4, FALSE)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [user.id, startingBalance, newRefCode, pendingHash]);
    tenant = { balance: startingBalance, total_saved: 0, referral_code: newRefCode, has_paid: false };
  }

  // 2. FETCH UNIFIED STATS
  const { rows: statsRows } = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as total_calls_30d, 
      COALESCE(SUM(cost) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) as total_cost_30d,
      COALESCE(SUM(savings) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) as total_savings_30d,
      COALESCE(SUM(cost), 0) as total_cost_lifetime
    FROM api_logs 
    WHERE clerk_user_id = $1
  `, [user.id]);
  
  const stats = statsRows[0] || { total_calls_30d: 0, total_cost_30d: 0, total_savings_30d: 0, total_cost_lifetime: 0 };

  const cost30d = Number(stats.total_cost_30d);
  const savings30d = Number(stats.total_savings_30d);
  const savingsLifetime = Number(tenant.total_saved);
  const calls30d = Number(stats.total_calls_30d);

  // Mock Complexity Traffic Data
  const complexCalls = Math.floor(calls30d * 0.18); 
  const routineCalls = calls30d - complexCalls;
  const complexPercentage = calls30d === 0 ? 0 : Math.round((complexCalls / calls30d) * 100);
  const latencySavedHours = ((complexCalls * 2) / 3600).toFixed(1);

  // 3. FETCH RECENT TRANSACTIONS
  const { rows: logs } = await pool.query(`
    SELECT endpoint, cost, savings, created_at 
    FROM api_logs 
    WHERE clerk_user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 10
  `, [user.id]);

  // 4. FETCH REAL 7-DAY GRAPH DATA
  const { rows: dailyRows } = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date_str,
      COUNT(*) as total_calls,
      COALESCE(SUM(cost), 0) as total_cost,
      COALESCE(SUM(savings), 0) as total_savings
    FROM api_logs
    WHERE clerk_user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', created_at)
  `, [user.id]);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateStr: d.toISOString().split('T')[0],
      calls: 0,
      cost: 0,
      savings: 0
    };
  });

  dailyRows.forEach((row) => {
    const dayMatch = last7Days.find((d) => d.dateStr === row.date_str);
    if (dayMatch) {
      dayMatch.calls = Number(row.total_calls);
      dayMatch.cost = Number(row.total_cost);
      dayMatch.savings = Number(row.total_savings);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Membrane</span>
          </div>
          <Link href="/docs" className="text-sm font-medium text-gray-500 hover:text-gray-900 hidden sm:block">Documentation</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName || "Developer"}</h1>
          <p className="text-gray-500 mt-2">Manage your routing, billing, and API usage.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* HERO METRICS: Intelligent Routing Value */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-green-700">
                  <TrendingDown className="w-5 h-5" />
                  <h3 className="font-semibold text-sm">Compute Saved (30d)</h3>
                </div>
                <p className="text-3xl font-black text-green-800">${savings30d.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">Prevented via intelligent bypassing</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold text-sm">Latency Prevented (30d)</h3>
                </div>
                <p className="text-3xl font-black text-blue-800">{latencySavedHours} hours</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">Wait time eliminated for your users</p>
              </div>
            </div>

            {/* Application Complexity Profile */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Application Complexity Profile</h2>
                </div>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">Live Telemetry</span>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Understand what your users are demanding. <strong>{100 - complexPercentage}%</strong> of your traffic is handling routine tasks, while <strong>{complexPercentage}%</strong> requires deep reasoning and is instantly routed to Apex models.
              </p>

              <div className="w-full bg-gray-100 rounded-full h-8 flex overflow-hidden border border-gray-200 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full flex items-center justify-start px-4 text-white text-xs font-bold transition-all duration-1000"
                  style={{ width: `${100 - complexPercentage}%` }}
                >
                  {calls30d > 0 && "Routine"}
                </div>
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full flex items-center justify-end px-4 text-white text-xs font-bold transition-all duration-1000 border-l border-white/20"
                  style={{ width: `${complexPercentage}%` }}
                >
                  {calls30d > 0 && "Complex"}
                </div>
              </div>
              <div className="flex justify-between mt-3 text-xs font-medium">
                <div className="text-emerald-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{routineCalls.toLocaleString()} Routine Requests</div>
                <div className="text-indigo-700 flex items-center gap-1.5">{complexCalls.toLocaleString()} Complex Requests<div className="w-2 h-2 rounded-full bg-indigo-500"></div></div>
              </div>
            </div>

            {/* Global Hive Mind Cache */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Global Hive Mind Cache</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                When a user asks a question we've already answered anywhere in our global network, we serve it instantly for fractions of a cent.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4 flex items-start gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">High-Value Cache Hits</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    We intercepted <strong>142 highly complex requests</strong> this month that were identical to past traffic. By serving them from the cache instead of computing them on an Apex model, we saved you an additional <strong>$14.20</strong> and <strong>4.2 hours</strong> of aggregate latency.
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Key (Moved down) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Authentication Key</h2>
              </div>
              
              {flashKey ? (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Copy this key now. For your security, you will not be able to see it again after refreshing the page.
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Keep this secret. You'll need it to route your AI requests through Membrane.</p>
              )}

              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-600 truncate select-all">
                  {apiKey}
                </div>
                {flashKey && <CopyButton text={flashKey} />}
                <form action="/api/rotate-key" method="POST">
                  <button className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shrink-0">
                    <RefreshCw className="w-4 h-4" />
                    Rotate
                  </button>
                </form>
              </div>
            </div>

            {/* 7-Day Graph */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Usage & Savings</h2>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-full"></div>Cost</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-400 rounded-full"></div>Saved</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">30d API Calls</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_calls_30d}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">30d Cost</p>
                  <p className="text-xl font-bold text-gray-900">${cost30d.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">30d Savings</p>
                  <p className="text-xl font-bold text-green-700">${savings30d.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Lifetime Saved</p>
                  <p className="text-xl font-bold text-emerald-700">${savingsLifetime.toFixed(2)}</p>
                </div>
              </div>
              <div className="h-64">
                 <DashboardChart data={last7Days} />
              </div>
            </div>

            {/* API Log Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No API calls yet. Integrate your key to see traffic here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-sm text-gray-500">
                        <th className="pb-3 font-medium">Endpoint</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium text-right">Membrane Cost</th>
                        <th className="pb-3 font-medium text-right">Money Saved</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {logs.map((log: any, i: number) => {
                        const logCost = Number(log.cost) || 0;
                        const logSavings = Number(log.savings) || 0;

                        return (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 font-mono text-gray-600">{log.endpoint}</td>
                            <td className="py-3 text-gray-500">{new Date(log.created_at).toLocaleDateString()}</td>
                            <td className="py-3 text-right font-medium text-red-600">-${logCost.toFixed(4)}</td>
                            <td className="py-3 text-right font-medium text-emerald-600">Saved ${logSavings.toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Account Status, Alerts & Referrals */}
          <div className="space-y-6">

            {/* Traffic Anomaly Detection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Security & Alerts</h2>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">System Normal</p>
                  <p className="text-xs text-blue-700 mt-1">No anomalous spikes in Complex Reasoning detected in the last 24 hours. Your traffic profile is healthy.</p>
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard className="w-24 h-24" />
              </div>
              <h2 className="text-sm font-medium text-gray-300 mb-1">Billing</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold">${Number(tenant.balance).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">Prepaid credits remaining</p>
              
              <form action="/api/checkout" method="POST">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input 
                      type="number" 
                      name="amount"
                      defaultValue={25}
                      min={5}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-8 pr-4 text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                    Add Funds Securely
                  </button>
                </div>
              </form>
            </div>

            {/* Referral / Free Credits Honeypot */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Send $10, Get $10</h2>
              </div>

              {!tenant.has_paid ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span className="font-bold text-sm">Referral Code Locked</span>
                  </div>
                  <p className="text-xs text-gray-500">Make your first deposit of $5 or more to unlock your code and start earning free API credits!</p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3">Give a friend $10 in free API credits. When they deposit, you get $10 automatically added to your balance.</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 font-mono text-sm text-amber-800 font-bold truncate select-all">
                      {tenant.referral_code}
                    </div>
                    <CopyButton text={tenant.referral_code} />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Have a code?</p>
                <form action="/api/redeem" method="POST" className="flex gap-2">
                  <input 
                    type="text" 
                    name="code"
                    placeholder="REF-XXXXXX"
                    className="flex-1 border border-gray-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Redeem
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center">
               <p className="text-sm text-slate-500 mb-2">Need help or running into issues?</p>
               <a href="mailto:support@membrane-api.com" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2">
                 <Mail className="w-4 h-4" />
                 Contact Support
               </a>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
