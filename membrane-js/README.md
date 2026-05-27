# membrane-js

TypeScript/JavaScript SDK for Membrane: The Drop-In LLM Proxy That Actually Saves You Money.

## Installation

```bash
npm install membrane-js
```

## Quickstart

```typescript
import { Membrane } from 'membrane-js';

const membrane = new Membrane({ apiKey: 'your-key-here' });

// Normal chat completions
const completion = await membrane.client.chat.completions.create({
  model: "membrane-engagement-layer",
  messages: [{ role: "user", content: "Extract liabilities from this contract..." }]
});

// Swarm map operations
const plan = await membrane.swarm.plan({
  model: 'membrane-engagement-layer',
  chunks: ["Contract text chunk 1..."],
  extraction_criteria: {
    system_persona: 'Extract values',
    target_signals: ['amount']
  }
});
console.log("Swarm planning forecast:", plan);
```
