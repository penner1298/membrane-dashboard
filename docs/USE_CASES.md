# Membrane Use Cases

Membrane is strongest when the same structured extraction pattern runs across many long, similar, or expensive inputs.

## Strong Fits

| Use case | Why Membrane helps |
| :--- | :--- |
| Contract and policy review | Chunks long documents, preserves extraction criteria, and reduces repeated analysis cost through semantic cache hits. |
| Earnings calls and transcripts | Reuses stable signals across repeated transcript formats while avoiding full-context prompt waste. |
| Log and incident analysis | Uses early gates and canaries to reject malformed or risky batches before broad fan-out. |
| Multi-document research packets | Runs isolated chunk extraction and reduces omissions caused by large context windows. |
| Agent workflows doing bulk extraction | Provides an OpenAI-compatible base URL so existing clients can route repetitive jobs through Membrane first. |

## Poor Fits

- One-off short prompts.
- Open-ended chat where every turn is novel.
- Workflows that require provider-specific APIs not routed through Membrane yet.
- Tasks where setup overhead is larger than expected token or reliability savings.

## Integration Rule of Thumb

If the task is long-document structured extraction or repeated extraction over many similar documents, call `/v1/swarm/plan` first, then choose `early_gate` or `canary` for execution unless the request is already trusted and well-tested.
