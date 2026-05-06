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

  // 1. FETCH REAL TENANT DATA (Balance, Referral, & Paid Status)
  const { rows: tenantRows } = await pool.query(
    "SELECT balance, referral_code, has_paid, total_saved FROM tenants WHERE clerk_user_id = $1",
    [user.id]
  );
  let tenant = tenantRows[0];

  // 👇 JUST-IN-TIME PROVISIONING FOR NEW USERS ($50 PROMO)
  if (!tenant) {
    const newRefCode = `REF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const startingBalance = 50.00;
    const pendingHash = `PENDING_${user.id}`; // Makes the placeholder unique

    // Insert them into the database instantly with their $50 and a unique placeholder
    await pool.query(`
      INSERT INTO tenants (clerk_user_id, balance, referral_code, total_saved, api_key_hash, has_paid)
      VALUES ($1, $2, $3, 0, $4, FALSE)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [user.id, startingBalance, newRefCode, pendingHash]);

    // Set the local variable so the UI updates instantly
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
      savings: 0,
    };
  });

  dailyRows.forEach((row) => {
    const match = last7Days.find(d => d.dateStr === row.date_str);
    if (match) {
      match.calls = Number(row.total_calls);
      match.cost = Number(row.total_cost);
      match.savings = Number(row.total_savings);
    }
  });

  const maxOpenAiCost = Math.max(...last7Days.map(d => d.cost + d.savings)) || 1;

  const chartData = last7Days.map(d => {
    return {
      day: d.day,
      calls: d.calls >= 1000 ? (d.calls / 1000).toFixed(1) + 'k' : d.calls.toString(),
      costHeight: `${(d.cost / maxOpenAiCost) * 100}%`,
      savedHeight: `${(d.savings / maxOpenAiCost) * 100}%`
    };
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-green-600 rounded-md">M</div>
          <span className="text-xl font-bold text-gray-900">Membrane Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
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
                <input type="text" readOnly value={apiKey} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-mono text-sm text-gray-500 focus:outline-none" />
                <CopyButton textToCopy={apiKey} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800" />
                <form action="/api/keys/reset" method="POST">
                  <button type="submit" title="Rotate Key" className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">AI Quick Start</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Membrane is a drop-in replacement for OpenAI with a powerful anti-hallucination engine. By using our Zero-Shot Isolation Protocol, you can load your Agent DNA (rules) into <code className="bg-gray-100 px-1 rounded">system</code> messages and your immediate task into the last <code className="bg-gray-100 px-1 rounded">user</code> message.
              </p>
              
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Base URL</span>
                    <code className="text-sm font-mono text-gray-900">https://membrane-api.com/v1</code>
                  </div>
                  <CopyButton textToCopy="https://membrane-api.com/v1" className="text-gray-400 hover:text-gray-900" />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">API Key</span>
                    <code className="text-sm font-mono text-gray-900">Bearer {apiKey.substring(0, 12)}...</code>
                  </div>
                  <CopyButton textToCopy={apiKey} className="text-gray-400 hover:text-gray-900" />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Model Name</span>
                  <code className="text-sm font-mono text-gray-900">membrane-engagement-layer</code>
                  <p className="text-xs text-gray-500 mt-1">Routing is automatic. We strip conversational bloat, apply your System Rules, and route to the most efficient tier.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">${Number(tenant.balance).toFixed(2)}</span>
                <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Prepaid credits remaining
                </p>
              </div>

              <form action="/api/stripe/checkout" method="POST" className="space-y-4">
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input type="number" name="amount" defaultValue="25" min="5" step="1" className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700">
                  Add Funds Securely
                </button>
              </form>
            </div>

            {/* 👇 THE NEW SYBIL-RESISTANT REFERRAL CARD */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10 mb-4">
                <h3 className="text-lg font-bold text-green-900 mb-2">Send $10, Get $10</h3>
                
                {tenant.has_paid ? (
                  <div className="bg-white/60 border border-green-200 p-3 rounded-lg flex justify-between items-center text-sm font-mono text-green-900">
                    <span className="font-bold tracking-wider">{tenant.referral_code}</span>
                    <CopyButton textToCopy={tenant.referral_code} className="font-medium text-green-700 hover:text-green-800 bg-transparent border-none p-0" />
                  </div>
                ) : (
                  <div className="bg-white/50 border border-green-200/60 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                    <Lock className="w-5 h-5 text-green-700 mb-2" />
                    <p className="text-sm font-bold text-green-900 mb-1">Referral Code Locked</p>
                    <p className="text-xs text-green-800 leading-relaxed">Make your first deposit of $5 or more to unlock your code and start earning free API credits!</p>
                  </div>
                )}
              </div>
              
              <div className="relative z-10 pt-4 border-t border-green-200/50">
                <p className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">Have a code?</p>
                <form action="/api/referral/redeem" method="POST" className="flex gap-2">
                  <input 
                    type="text" 
                    name="code" 
                    placeholder="REF-XXXXXX" 
                    className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 uppercase placeholder:normal-case"
                    required
                  />
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    Redeem
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-600" /> Usage & Savings
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">30d API Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_calls_30d}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">30d Cost</p>
                  <p className="text-2xl font-bold text-gray-900">${cost30d.toFixed(4)}</p>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3 border border-green-100/50">
                  <p className="text-xs font-medium text-green-700 mb-1 uppercase tracking-wider">30d Savings</p>
                  <p className="text-2xl font-bold text-green-600">${savings30d.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200 shadow-sm relative overflow-hidden group">
                  <Trophy className="absolute -right-2 -top-2 w-12 h-12 text-green-600 opacity-20" />
                  <p className="text-xs font-bold text-green-800 mb-1 uppercase tracking-wider relative z-10">Lifetime Saved</p>
                  <p className="text-2xl font-black text-green-700 relative z-10">${savingsLifetime.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="relative flex-1 flex items-end justify-between gap-2 min-h-[200px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-t border-b border-gray-100">
                  <div className="border-b border-gray-100 border-dashed flex-1"></div>
                  <div className="border-b border-gray-100 border-dashed flex-1"></div>
                  <div className="border-b border-gray-100 border-dashed flex-1"></div>
                </div>
                {chartData.map((data, i) => (
                  <div key={i} className="relative flex flex-col justify-end items-center w-full h-full group z-10">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none">
                      {data.calls} calls
                    </div>
                    <div className="w-full max-w-[48px] h-full flex flex-col justify-end rounded-t-md overflow-hidden">
                      <div className="bg-green-500 w-full hover:opacity-90" style={{ height: data.savedHeight }}></div>
                      <div className="bg-gray-900 w-full hover:opacity-90" style={{ height: data.costHeight }}></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6 text-sm mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-900"></span>
                  <span className="text-gray-600 font-medium">Membrane Cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-600 font-medium">Money Saved vs OpenAI</span>
                </div>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px]">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr><td className="p-6 text-center text-gray-500">No transactions yet.</td></tr>
                    ) : (
                      logs.map((log: any, index: number) => (
                        <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">
                              {log.endpoint.includes('L1_GLOBAL_CACHE') && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" title="L1 Global Cache"></span>}
                              {log.endpoint.includes('L2_SILO_CACHE') && <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2" title="L2 Silo Cache"></span>}
                              {log.endpoint.includes('DEEP_COGNITION') && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2" title="Deep Cognition"></span>}
                              {log.endpoint.includes('SURFACE_ENGAGEMENT') && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" title="Surface Engagement"></span>}
                              {log.endpoint}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{new Date(log.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-gray-900 font-medium">-${Number(log.cost).toFixed(4)}</div>
                            {Number(log.savings) > 0 && (
                              <div className="text-xs text-green-600 font-medium mt-0.5">
                                Saved ${Number(log.savings).toFixed(4)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Support Footer */}
      <footer className="max-w-6xl mx-auto px-6 mt-8 mb-4 flex justify-center">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200/50 rounded-full text-sm text-gray-500">
          <Mail className="w-4 h-4" />
          <span>Need help or running into issues?</span>
          <a href="mailto:josh@pennerstrategy.com?subject=Membrane%20Support" className="font-medium text-gray-900 hover:text-green-600 transition-colors">
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}