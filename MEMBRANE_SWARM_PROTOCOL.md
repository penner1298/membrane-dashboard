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
