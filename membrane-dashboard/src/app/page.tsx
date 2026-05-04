import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Pool } from "pg";
import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function hashApiKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export default async function Dashboard() {
  const { userId } = await auth();
  
  let balance = "0.00";
  let totalSaved = "0.00"; 
  let displayKey = "No key found.";
  let isNewKey = false;
  let referralCode = "";
  let hasRedeemed = false;
  let transactions: any[] = [];
  let apiLogs: any[] = []; 
  
  const cookieStore = await cookies();
  const flashKey = cookieStore.get("new_key")?.value;

  async function rollKey() {
    "use server";
    const { userId } = await auth();
    if (!userId) return;
    const rawKey = "sk_live_" + crypto.randomBytes(24).toString("hex");
    const hashedKey = hashApiKey(rawKey);
    const client = await pool.connect();
    try { await client.query(`UPDATE tenants SET api_key_hash = $1 WHERE clerk_user_id = $2`, [hashedKey, userId]); } 
    finally { client.release(); }
    const activeCookies = await cookies();
    activeCookies.set("new_key", rawKey, { maxAge: 10 }); 
    revalidatePath("/");
  }

  async function redeemReferral(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) return;
    const codeToRedeem = formData.get("code") as string;
    if (!codeToRedeem) return;

    const client = await pool.connect();
    try {
      const userCheck = await client.query(`SELECT has_redeemed_ref, referral_code FROM tenants WHERE clerk_user_id = $1`, [userId]);
      if (userCheck.rows[0].has_redeemed_ref || userCheck.rows[0].referral_code === codeToRedeem) return; 

      const referrerCheck = await client.query(`SELECT clerk_user_id FROM tenants WHERE referral_code = $1`, [codeToRedeem]);
      if (referrerCheck.rows.length === 0) return; 
      const referrerId = referrerCheck.rows[0].clerk_user_id;

      await client.query("BEGIN");
      await client.query(`UPDATE tenants SET balance = balance + 10, has_redeemed_ref = TRUE WHERE clerk_user_id = $1`, [userId]);
      await client.query(`INSERT INTO transactions (clerk_user_id, amount, description) VALUES ($1, 10.00, 'Redeemed Referral Code')`, [userId]);
      await client.query(`UPDATE tenants SET balance = balance + 10 WHERE clerk_user_id = $1`, [referrerId]);
      await client.query(`INSERT INTO transactions (clerk_user_id, amount, description) VALUES ($1, 10.00, 'Referral Bonus')`, [referrerId]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
    } finally {
      client.release();
      revalidatePath("/");
    }
  }

  if (userId) {
    const client = await pool.connect();
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, clerk_user_id VARCHAR(255) NOT NULL, amount DECIMAL(10, 2) NOT NULL, description VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
      await client.query(`CREATE TABLE IF NOT EXISTS api_logs (id SERIAL PRIMARY KEY, clerk_user_id VARCHAR(255) NOT NULL, endpoint VARCHAR(255) NOT NULL, tokens INTEGER NOT NULL, cost DECIMAL(10, 4) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
      
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;`);
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;`);
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_redeemed_ref BOOLEAN DEFAULT FALSE;`);
      await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_saved DECIMAL(10, 4) DEFAULT 0.0000;`); 

      const result = await client.query(`SELECT balance, total_saved, api_key_hash, referral_code, has_redeemed_ref FROM tenants WHERE clerk_user_id = $1`, [userId]);
      
      if (result.rows.length > 0) {
        balance = Number(result.rows[0].balance).toFixed(2);
        totalSaved = Number(result.rows[0].total_saved || 0).toFixed(4);
        hasRedeemed = result.rows[0].has_redeemed_ref;
        referralCode = result.rows[0].referral_code;

        if (!referralCode) {
          referralCode = "REF-" + crypto.randomBytes(3).toString("hex").toUpperCase();
          await client.query(`UPDATE tenants SET referral_code = $1 WHERE clerk_user_id = $2`, [referralCode, userId]);
        }
        if (flashKey) { displayKey = flashKey; isNewKey = true; } 
        else { displayKey = "sk_live_••••••••••••••••••••••••••••"; }
      } else {
        const rawKey = "sk_live_" + crypto.randomBytes(24).toString("hex");
        const hashedKey = hashApiKey(rawKey);
        referralCode = "REF-" + crypto.randomBytes(3).toString("hex").toUpperCase();
        await client.query(`INSERT INTO tenants (api_key_hash, balance, clerk_user_id, referral_code) VALUES ($1, 0.0000, $2, $3)`, [hashedKey, userId, referralCode]);
        displayKey = rawKey;
        isNewKey = true;
      }

      const txResult = await client.query(`SELECT amount, description, created_at FROM transactions WHERE clerk_user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]);
      transactions = txResult.rows;

      const apiLogsResult = await client.query(`SELECT endpoint, tokens, cost, created_at FROM api_logs WHERE clerk_user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]);
      apiLogs = apiLogsResult.rows;

    } catch (e) {
      console.error("Database Error:", e);
    } finally {
      client.release();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <nav className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Membrane<span className="text-blue-600">.</span></h1>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-sm font-medium text-gray-500 hover:text-gray-900">Documentation</Link>
          <UserButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto mt-10 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Billing Card (RESTORED CUSTOM INPUT) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Current Balance</h2>
            <p className="text-3xl font-bold tracking-tight text-gray-900 mt-2">${balance}</p>
            <p className="text-xs text-gray-500 mt-1 mb-6">Prepaid credits for API usage.</p>
            
            <form action="/api/stripe/checkout" method="POST" className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button type="submit" name="amount" value="10" className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 rounded-xl transition-all border border-blue-200">$10</button>
                <button type="submit" name="amount" value="50" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-all shadow-sm">$50</button>
                <button type="submit" name="amount" value="100" className="flex-1 bg-gray-900 hover:bg-black text-white font-medium py-2 rounded-xl transition-all shadow-sm">$100</button>
              </div>

              <div className="flex gap-2 mt-1">
                <div className="relative flex-grow">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input 
                    type="number" 
                    name="amount" 
                    min="1" 
                    placeholder="Custom" 
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
                  />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-all shadow-sm text-sm">
                  Pay
                </button>
              </div>
            </form>
          </div>

          {/* Savings Card - UPDATED WITH PROPRIETARY COPY */}
          <div className="bg-green-50 p-6 rounded-2xl shadow-sm border border-green-200">
            <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-1">Swarm Savings</h2>
            <p className="text-3xl font-bold tracking-tight text-green-700">${totalSaved}</p>
            <p className="text-xs text-green-600 mt-2 font-medium">Money saved using Membrane's patent-pending Swarm technology.</p>
          </div>

          {/* Referral Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Send $10, Get $10</h2>
            <p className="text-xs text-gray-500 mb-4">Share your code. When a friend redeems it, you both get $10 in credits instantly.</p>
            
            <div className="mb-5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Your Code:</span>
              <div className="bg-green-50 text-green-700 border border-green-200 p-2 rounded-lg font-mono text-sm text-center font-bold tracking-widest">
                {referralCode}
              </div>
            </div>

            {!hasRedeemed ? (
              <form action={redeemReferral} className="flex gap-2 border-t border-gray-50 pt-4">
                <input type="text" name="code" placeholder="Friend's code" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs uppercase transition-all" required />
                <button type="submit" className="bg-gray-900 hover:bg-black text-white font-medium py-2 px-4 rounded-lg text-xs transition-all shadow-sm">
                  Redeem
                </button>
              </form>
            ) : (
              <p className="text-xs text-green-700 font-medium mt-4 text-center bg-green-50 py-2 rounded-lg border border-green-100">
                ✅ You redeemed a referral code.
              </p>
            )}
          </div>

          {/* API Key Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Authentication</h2>
              <form action={rollKey}>
                <button type="submit" className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors border border-red-100 shadow-sm">Roll Key</button>
              </form>
            </div>
            <p className="text-xs text-gray-500 mb-4">Pass this key as <code className="bg-gray-100 px-1 rounded">X-Gearbox-Key</code>.</p>
            {isNewKey && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">⚠️ Copy immediately.</div>}
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-xs text-gray-700 break-all border border-gray-200">{displayKey}</div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-2 space-y-6">
          
          {/* API Usage Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent API Usage</h2>
            {apiLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No recent API usage.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-medium">Endpoint</th>
                      <th className="px-4 py-3 font-medium">Tokens</th>
                      <th className="px-4 py-3 font-medium">Cost</th>
                      <th className="px-4 py-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.map((log, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                        {/* WHITE-LABELING MAGIC */}
                        <td className="px-4 py-3 font-mono text-xs text-gray-800">
                          {log.endpoint.includes('(') ? 'Membrane Swarm' : log.endpoint}
                        </td>
                        <td className="px-4 py-3">{log.tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-red-600">-${Number(log.cost).toFixed(4)}</td>
                        <td className="px-4 py-3 text-right">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Billing History */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Billing History</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No recent transactions.</p>
            ) : (
              <ul className="space-y-3">
                {transactions.map((tx, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+${Number(tx.amount).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}