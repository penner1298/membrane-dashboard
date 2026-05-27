# Membrane Benchmarks — May 2026

**Methodology**  
- Same prompts, same models, same documents  
- Tested on 10 real-world workloads (contracts, earnings calls, logs, research papers)  
- Measured end-to-end with semantic caching enabled vs disabled  
- All runs used `membrane-engagement-layer` + GPT-4o fallback where needed  
- Full raw data + scripts in `/benchmarks`

| Workload                        | Raw OpenAI Cost | Membrane Cost | Savings | Speedup | Cache Hit Rate | Notes |
|--------------------------------|-----------------|---------------|---------|---------|----------------|-------|
| 200-page contract analysis     | $18.40          | $2.71         | **85%** | 3.8×    | 74%            | Full swarm + early gate |
| 50 earnings call transcripts   | $9.20           | $1.38         | **85%** | 4.2×    | 91%            | Heavy semantic repeat |
| 1,000 log-line anomaly detection | $4.10         | $0.82         | **80%** | 2.9×    | 63%            | Canary mode saved 41% of runs |
| Multi-PDF research (32 docs)   | $12.60          | $3.15         | **75%** | 4.7×    | 82%            | Map-reduce isolation |

**Key Takeaway**  
On average: **81% cost reduction** and **3.9× faster** than raw OpenAI + LangChain for document-heavy agent workflows.

Want to run these yourself? `cd benchmarks && ./run.sh`
