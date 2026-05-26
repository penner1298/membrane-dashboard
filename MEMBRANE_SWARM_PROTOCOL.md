# Membrane Swarm Ingestion Guidelines

## The Core Rule
**Never manually truncate data.**
**Never glue pages into a single string for LLM ingestion.**
**Never use `[text_chunk[:20000]]` or similar naive hardcoded slicing.**

When extracting data from documents (especially large PDFs, contracts, or municipal packets), you should use the native **Swarm Map-Reduce architecture** defined in the dashboard documentation (`/docs`). This applies whether you are calling the local Membrane API or using our local `/v1/swarm/map` endpoint.

## The Correct Process (Array of Pages)
The Swarm endpoint is explicitly designed to handle massive files natively by spinning up parallel extraction agents for each chunk.

To achieve this, you MUST structure your payload with the `chunks` parameter as an **Array of Pages** (or logical blocks), like this:

```json
{
    "chunks": [
        "Page 1 of the PDF...",
        "Page 2 of the PDF...",
        "Page 3 of the PDF..."
    ],
    "system_prompt": "Extract all actionable items neutrally.",
    "response_format": {"type": "object", "properties": {...}}
}
```

### Python Implementation Example
```python
def extract_pages_from_pdf(pdf_path):
    pages = []
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            text = reader.pages[page_num].extract_text()
            if text and len(text.strip()) > 10:
                pages.append(text)  # Append as an individual array element
    return pages

# Passing to Gearbox / Membrane
payload = {
    "chunks": extract_pages_from_pdf("massive_contract.pdf"),
    "system_prompt": "..."
}
```

## Why Swarm Ingestion is Recommended
1. **Zero Data Loss:** We previously lost critical municipal data (resolutions, fiscal approvals) buried on page 13+ because scripts naively truncated the PDF at 20,000 characters.
2. **Parallel Map-Reduce:** Membrane natively fans out the request. Sending an array of pages allows processing the entire document concurrently without hitting token limits or losing context.
3. **No Bias Injection:** Pass a neutral system prompt. Let the Swarm extract the raw facts, and save synthesis for the presentation layer.

**Any future automation script should follow these guidelines.**

---

## Swarm Execution Modes & Early Rejection

To manage token spend and concurrency pressure under high traffic or malformed inputs, Membrane supports configurable **Swarm Execution Modes**. 

### Configuration & Control
You can control the strategy via request headers or environment variables:
*   **Header:** `X-Membrane-Swarm-Mode: legacy | early_gate | canary`
*   **Environment Variable:** `MEMBRANE_SWARM_MODE=legacy | early_gate | canary` (fallback default is `legacy`)

### Mode Behaviors

| Mode | Strategy | Validation & Rejection Behavior |
| :--- | :--- | :--- |
| **`legacy`** | Parallel fan-out (baseline) | Processes all slices concurrently. Fails at runtime on model errors or syntax issues. |
| **`early_gate`** | Pre-Fan-Out Structural Gate | Validates the request shape instantly before execution. If validation fails, rejects with HTTP 422 (0 tokens charged). |
| **`canary`** | Canary Sentinel Probe | Runs the structural gate, then executes **chunk 0** serially. If chunk 0 fails, aborts the request, logs the error, and charges *only* for the first chunk. |

### Strict Structural Gate Rules (Experiment 1)
When running in `early_gate` or `canary` modes, payloads must satisfy the following criteria:
1.  **Chunks Count:** `1 <= len(chunks) <= 25` (prevents concurrency spikes).
2.  **Per-Chunk Size:** Each chunk must be a string and `len(chunk) <= 25,000` characters.
3.  **Total Size Ceiling:** Sum of all chunk characters must be `<= 200,000` characters.
4.  **Extraction Criteria Shape:** `extraction_criteria` must be a dictionary containing:
    *   `system_persona` (string)
    *   `target_signals` (a list of strings; no type coercion is performed)

Requests failing any of these rules return an `HTTP 422 Unprocessable Entity` containing details of the failed check.

