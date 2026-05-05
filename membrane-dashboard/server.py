from fastapi import FastAPI
from pydantic import BaseModel
import time
import uuid

app = FastAPI()

class Query(BaseModel):
    prompt: str
    worker_id: str | None = None

@app.post("/generate")
def generate(query: Query):
    start = time.time()

    # Simulated “LLM call” (replace with real API call)
    time.sleep(0.2)

    return {
        "receipt_id": str(uuid.uuid4()),
        "worker_id": query.worker_id,
        "answer": f"Echo: {query.prompt}",
        "latency_ms": round((time.time() - start) * 1000, 2),
    }

@app.get("/health")
def health():
    return {"status": "ok"}
