import { Membrane } from '../src/client';

async function run() {
  const membrane = new Membrane();

  const payload = {
    model: "membrane-engagement-layer",
    chunks: [
      "SYSTEM_LOG: [AUTH] [CRITICAL] Failed to authorize root session for IP: 198.51.100.42.",
      "SYSTEM_LOG: [DB_POOL] [WARNING] Connection pool size peaked at 180 concurrent threads.",
      "SYSTEM_LOG: [API_GATEWAY] [ERROR] Routing exception generated. Endpoint returned 502."
    ],
    max_concurrency: 3,
    extraction_criteria: {
      system_persona: "Identify error signatures, severity tokens, and root system IP addresses.",
      target_signals: ["CRITICAL", "ERROR", "WARNING"]
    },
    invariant_set_id: "ent_compliance_lock_v1"
  };

  console.log("Requesting pre-flight planning and pricing forecast...");
  const forecast = await membrane.swarm.plan(payload);

  const trajectory = forecast.trajectory || {};
  console.log("\nForecast Results:");
  console.log(` - Estimated Cost: $${(trajectory.estimated_retail_cost || 0).toFixed(6)}`);
  console.log(` - Estimated Latency: ${trajectory.estimated_latency_ms || 0} ms`);
  console.log(` - Concurrency Recommendation: ${trajectory.concurrency_recommendation || 0}`);
  console.log(` - Cache Hits Rate Estimate: ${trajectory.estimated_cache_hit_rate || 0}%`);
  console.log(` - System Compliance Check: ${forecast.compliance_handshake ? 'OK' : 'FAIL'}`);
}

run().catch(console.error);
