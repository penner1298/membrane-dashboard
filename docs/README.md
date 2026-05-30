# Membrane Docs

This folder holds maintainer-facing technical documentation for the Membrane monorepo.

## Index

| Document | Purpose |
| :--- | :--- |
| `BENCHMARKS.md` | Current benchmark claims, reproducibility notes, and active simulation entry points. |
| `SWARM_PROTOCOL.md` | Technical reference for swarm request planning, gated execution, and response metadata. |
| `USE_CASES.md` | Practical fit notes for the strongest Membrane workloads. |
| `internal/SWARM_EXPERIMENT_TRACKER.md` | Engineering history and baseline metrics for the swarm early-rejection experiments. |

User-facing product docs live in the Next.js app under `membrane-dashboard/src/app/`.

Avoid adding loose drafts, generated static exports, or abandoned package promises here. If a document names a path, package, or command, keep it current or mark it as historical.
