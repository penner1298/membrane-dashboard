# Membrane Benchmarks

This document records the benchmark claims currently used by the dashboard and `public/llms.txt`.

## Public Summary

| Workload | Raw OpenAI Cost | Membrane Cost | Savings | Speedup | Cache Hit | Notes |
| :--- | ---: | ---: | :---: | :---: | :---: | :--- |
| 200-page contract analysis | $18.40 | $2.71 | 85% | 3.8x | 74% | Full swarm plus early gate |
| 50 earnings call transcripts | $9.20 | $1.38 | 85% | 4.2x | 91% | Heavy semantic repeat |
| 1,000 log-line anomaly detection | $4.10 | $0.82 | 80% | 2.9x | 63% | Canary saved failed runs |
| Multi-PDF research, 32 docs | $12.60 | $3.15 | 75% | 4.7x | 82% | Map-reduce isolation |

Average across these workloads: 81% cost reduction and 3.9x faster than raw full-context calls for repetitive structured extraction.

## Reproducibility Status

The old `/benchmarks` directory is not part of the active repository. Do not reference it in docs or pull requests.

The active local experiment helper is:

```bash
python3 scripts/simulate_swarm_load.py
```

That script starts a local backend process, runs synthetic traffic across `legacy`, `early_gate`, and `canary` swarm modes, and prints request, token, rejection, and latency summaries.

For externally reproducible benchmark claims, add the raw fixtures, command invocation, model/provider versions, environment variables, and output artifacts to this document or a dedicated `docs/benchmarks/` folder before publishing new numbers.

## Related Notes

- `docs/SWARM_PROTOCOL.md` explains the swarm execution modes.
- `docs/internal/SWARM_EXPERIMENT_TRACKER.md` records the early rejection experiment history and baseline simulation results.
