import asyncio
import aiohttp
import time
import random
import os
import json
from statistics import mean, median

BASE_URL = "https://membrane-wh1g.onrender.com/api/chat"

API_KEY = os.getenv("MEMBRANE_API_KEY")

if not API_KEY:
    raise Exception("Missing MEMBRANE_API_KEY env var")

HEADERS = {
    "Content-Type": "application/json",
    "X-Gearbox-Key": API_KEY
}

# -----------------------------
# PROMPT GENERATION (CRITICAL FIX)
# -----------------------------

BASE_PROMPTS = [
    "Design a scalable chat system",
    "Explain Redis pub/sub in simple terms",
    "What breaks first in distributed systems under load?",
    "Compare Kafka vs RabbitMQ for messaging",
    "How do WebSockets scale to millions of users?",
    "Design rate limiting for an API gateway",
    "Explain backpressure in event-driven systems",
    "How do you shard a message database?",
    "Design presence detection for chat apps",
    "What happens when a message queue overloads?"
]

ADVERSARIAL_PROMPTS = [
    "Design a system that survives 10M concurrent WebSockets with zero message loss",
    "Explain how you'd prevent cascading failure in a distributed chat system under DDoS",
    "Design global message ordering across multi-region clusters",
    "What fails first: DB, cache, or message broker under extreme write load?",
    "Design a system that must degrade gracefully without dropping messages"
]

def generate_prompt(i: int) -> str:
    category = random.random()

    if category < 0.6:
        base = random.choice(BASE_PROMPTS)
    elif category < 0.9:
        base = random.choice(ADVERSARIAL_PROMPTS)
    else:
        base = f"Random system design challenge seed={i}: design a resilient distributed system"

    # Ensure uniqueness (this is what fixes your broken test)
    return f"{base}. Context token: {i}-{random.randint(1000,9999)}"


# -----------------------------
# SINGLE REQUEST
# -----------------------------

async def fetch(session, i):
    payload = {
        "prompt": generate_prompt(i),
        "use_global_cache": False
    }

    start = time.perf_counter()

    try:
        async with session.post(BASE_URL, json=payload, headers=HEADERS) as resp:
            text = await resp.text()
            latency = (time.perf_counter() - start) * 1000

            return {
                "status": resp.status,
                "latency": latency,
                "body": text,
                "error": None
            }

    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return {
            "status": "error",
            "latency": latency,
            "body": None,
            "error": str(e)
        }


# -----------------------------
# SWARM RUNNER
# -----------------------------

async def run_swarm(total_requests=200, concurrency=50):

    connector = aiohttp.TCPConnector(limit=concurrency)
    sem = asyncio.Semaphore(concurrency)

    results = []

    async with aiohttp.ClientSession(connector=connector) as session:

        async def bound_fetch(i):
            async with sem:
                return await fetch(session, i)

        tasks = [bound_fetch(i) for i in range(total_requests)]

        start = time.time()
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start

    return results, total_time


# -----------------------------
# ANALYSIS
# -----------------------------

def analyze(results, total_time, concurrency):

    latencies = [r["latency"] for r in results if r["status"] != "error"]

    status_counts = {}
    for r in results:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1

    success = sum(1 for r in results if r["status"] == 200)

    print("\n=== SWARM RESULTS ===")
    print(f"Total requests: {len(results)}")
    print(f"Concurrency: {concurrency}")
    print(f"Total time: {total_time:.2f}s")
    print(f"Requests/sec: {len(results)/total_time:.2f}")

    print(f"\nSuccess: {success}")
    print(f"Failures: {len(results) - success}")

    print("\nStatus codes:")
    for k, v in status_counts.items():
        print(f"  {k}: {v}")

    if latencies:
        latencies.sort()
        print("\nLatency (ms):")
        print(f"Avg: {mean(latencies):.2f}")
        print(f"P50: {median(latencies):.2f}")
        print(f"P95: {latencies[int(len(latencies)*0.95)]:.2f}")
        print(f"P99: {latencies[int(len(latencies)*0.99)]:.2f}")
        print(f"Max: {max(latencies):.2f}")

    # Sample output
    print("\n=== SAMPLE RESPONSE ===")
    for r in results[:5]:
        print(r)


# -----------------------------
# MAIN
# -----------------------------

async def main():
    print("Running SWARM diversity test...\n")

    results, total_time = await run_swarm(
        total_requests=200,
        concurrency=50
    )

    analyze(results, total_time, concurrency=50)


if __name__ == "__main__":
    asyncio.run(main())