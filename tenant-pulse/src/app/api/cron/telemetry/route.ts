import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://membrane_dlq_user:H34pMze5BoLmfgRcw7TlzcSB5FJVf81i@dpg-d7sbdl28qa3s73e2ip00-a.oregon-postgres.render.com/membrane_dlq?sslmode=require',
});

export const maxDuration = 10;

export async function GET() {
  try {
    const eventsQuery = `
      SELECT project, event, COUNT(*) as count 
      FROM telemetry_events 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY project, event
      ORDER BY project, count DESC;
    `;
    const { rows: eventRows } = await pool.query(eventsQuery);

    const trafficQuery = `
      SELECT project, 
             COUNT(DISTINCT ip_address) as unique_visitors,
             COUNT(*) as total_pageviews
      FROM telemetry_events
      WHERE timestamp > NOW() - INTERVAL '24 hours' AND event = 'Pageview'
      GROUP BY project;
    `;
    const { rows: trafficRows } = await pool.query(trafficQuery);
    
    const referrersQuery = `
      SELECT project, referrer, COUNT(*) as count
      FROM telemetry_events
      WHERE timestamp > NOW() - INTERVAL '24 hours' AND event = 'Pageview' AND referrer IS NOT NULL AND referrer != ''
      GROUP BY project, referrer
      ORDER BY count DESC
      LIMIT 10;
    `;
    const { rows: referrersRows } = await pool.query(referrersQuery);

    let report = "**Daily Pulse Traffic & Telemetry (Last 24h)**\n\n";
    if (eventRows.length === 0) {
      report += "No new traffic in the last 24 hours.";
    } else {
      const tpEvents = eventRows.filter(r => r.project === 'Tenant Pulse');
      const cpEvents = eventRows.filter(r => r.project === 'Contract Pulse');
      const tpTraffic = trafficRows.find(r => r.project === 'Tenant Pulse');
      const cpTraffic = trafficRows.find(r => r.project === 'Contract Pulse');
      const tpRefs = referrersRows.filter(r => r.project === 'Tenant Pulse');
      const cpRefs = referrersRows.filter(r => r.project === 'Contract Pulse');

      if (tpEvents.length > 0) {
        report += "**Tenant Pulse**\n";
        if (tpTraffic) {
          report += `*Traffic:* ${tpTraffic.unique_visitors} unique visitors, ${tpTraffic.total_pageviews} pageviews\n`;
        }
        report += "*Events:*\n";
        tpEvents.forEach(r => { report += `- ${r.event}: ${r.count}\n`; });
        if (tpRefs.length > 0) {
           report += "*Top Referrers:*\n";
           tpRefs.forEach(r => { report += `- ${r.referrer}: ${r.count}\n`; });
        }
      }
      
      if (cpEvents.length > 0) {
        report += "\n**Contract Pulse**\n";
        if (cpTraffic) {
          report += `*Traffic:* ${cpTraffic.unique_visitors} unique visitors, ${cpTraffic.total_pageviews} pageviews\n`;
        }
        report += "*Events:*\n";
        cpEvents.forEach(r => { report += `- ${r.event}: ${r.count}\n`; });
        if (cpRefs.length > 0) {
           report += "*Top Referrers:*\n";
           cpRefs.forEach(r => { report += `- ${r.referrer}: ${r.count}\n`; });
        }
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

    return NextResponse.json({ status: 'Report sent' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
