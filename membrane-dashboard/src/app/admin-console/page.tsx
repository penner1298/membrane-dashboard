import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { AdminClient } from "./admin-client";

export default async function AdminConsolePage() {
  const user = await currentUser();

  // ONLY allow your specific Clerk ID (or emails) to access this route
  const allowedEmails = ["josh@penner.com", "thejoshpenner@gmail.com", "joshpenner@gmail.com", "josh@corevaluesconsulting.com"]; 
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
  let recentLogs: any[] = [];
  let benchmarks: any[] = [];
  
  try {
      const statsResult = await pool.query(`
        SELECT 
          SUM(billed_amount) as total_retail,
          SUM(wholesale_cost) as total_wholesale,
          COUNT(*) as total_calls,
          SUM(CASE WHEN endpoint ILIKE '%CACHE%' THEN 1 ELSE 0 END) as cache_hits
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
  
  const stats = {
      totalRetail,
      totalWholesale,
      margin,
      totalCalls,
      schemaRescues,
      thwartedAttacks,
      recentLogs,
      benchmarks
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
        <AdminClient stats={stats} />
    </div>
  );
}
