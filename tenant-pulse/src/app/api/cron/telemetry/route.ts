import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://membrane_dlq_user:H34pMze5BoLmfgRcw7TlzcSB5FJVf81i@dpg-d7sbdl28qa3s73e2ip00-a.oregon-postgres.render.com/membrane_dlq?sslmode=require',
});

export const maxDuration = 10;

export async function GET() {
  try {
    const query = `
      SELECT project, event, COUNT(*) as count 
      FROM telemetry_events 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY project, event
      ORDER BY project, count DESC;
    `;
    const { rows } = await pool.query(query);

    let report = "**Daily Pulse Telemetry (Last 24h)**\n\n";
    if (rows.length === 0) {
      report += "No new traffic in the last 24 hours.";
    } else {
      const tp = rows.filter(r => r.project === 'Tenant Pulse');
      const cp = rows.filter(r => r.project === 'Contract Pulse');

      if (tp.length > 0) {
        report += "**Tenant Pulse**\n";
        tp.forEach(r => { report += `- ${r.event}: ${r.count}\n`; });
      }
      if (cp.length > 0) {
        report += "\n**Contract Pulse**\n";
        cp.forEach(r => { report += `- ${r.event}: ${r.count}\n`; });
      }
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: report })
      });
    }

    return NextResponse.json({ status: 'Report sent', rows: rows.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
