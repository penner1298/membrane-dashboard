
import asyncio
import aiohttp
import time
import statistics

# ----------------------------
# CONFIG
# ----------------------------

MEMBRANE_URL = "https://membrane-wh1g.onrender.com/api/chat"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

API_KEY = "sk_live_34a672f440a0d15626c2e4a6eeb15d0dd141dca86e3c6509"   # <-- PUT YOUR REAL KEY
OPENAI_KEY = "sk-..."               # optional baseline

TEST_PROMPTS = [
    "Explain Redis caching simply",
    "Design a scalable chat system",
    "What is message queue backpressure",
    "Explain database sharding",
    "How does consistent hashing work",
]

# ----------------------------
# PARSERS
# ----------------------------

def parse_membrane(data):
    if not isinstance(data, dict):
        return None, False

    text = data.get("answer")

    ok = (
        isinstance(text, str)
        and len(text) > 50
        and "receipt_id" in data
    )

    return text, ok


def parse_openai(data):
    try:
        return data["choices"][0]["message"]["content"], True
    except:
        return None, False


# ----------------------------
# CALLS
# ----------------------------

async def call_membrane(session, prompt):
    start = time.time()

    try:
        async with session.post(
            MEMBRANE_URL,
            headers={
                "Content-Type": "application/json",
                "X-Gearbox-Key": API_KEY
            },
            json={
                "prompt": prompt,
                "use_global_cache": True
            },
            timeout=90
        ) as resp:

            data = await resp.json()
            latency = time.time() - start

            text, ok = parse_membrane(data)

            if not ok:
                print("\n[MEMBRANE FAIL]")
                print(data)

            return {
                "ok": ok,
                "latency": latency,
                "text": text,
                "tokens": data.get("total_tokens", 0),
                "cost": data.get("billed_amount", 0)
            }

    except Exception as e:
        return {
            "ok": False,
            "latency": time.time() - start,
            "text": None,
            "tokens": 0,
            "cost": 0,
            "error": str(e)
        }


async def call_openai(session, prompt):
    if not OPENAI_KEY:
        return {"ok": False, "latency": 0, "text": None, "tokens": 0, "cost": 0}

    start = time.time()

    try:
        async with session.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {OPENAI_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0
            },
            timeout=90
        ) as resp:

            data = await resp.json()
            latency = time.time() - start

            text, ok = parse_openai(data)

            if not ok:
                print("\n[OPENAI FAIL]")
                print(data)

            return {
                "ok": ok,
                "latency": latency,
                "text": text,
                "tokens": data.get("usage", {}).get("total_tokens", 0),
                "cost": 0
            }

    except Exception as e:
        return {
            "ok": False,
            "latency": time.time() - start,
            "text": None,
            "tokens": 0,
            "cost": 0,
            "error": str(e)
        }


# ----------------------------
# QUALITY SCORING (NON-BROKEN)
# ----------------------------

def score(text):
    if not text:
        return 0

    t = text.lower()
    s = 0

    if len(text) > 300:
        s += 1
    if len(text) > 800:
        s += 1
    if "architecture" in t:
        s += 1
    if "latency" in t or "scale" in t:
        s += 1
    if "1." in text or "-" in text:
        s += 1

    return s


# ----------------------------
# RUN
# ----------------------------

async def run_one(session, prompt):
    print(f"Testing: {prompt}")

    mem = await call_membrane(session, prompt)
    base = await call_openai(session, prompt)

    return {"mem": mem, "base": base}


# ----------------------------
# SUMMARY
# ----------------------------

def summarize(results, key):
    items = [r[key] for r in results]

    success = sum(1 for x in items if x["ok"])
    latencies = [x["latency"] for x in items if x["latency"]]
    scores = [score(x["text"]) for x in items]

    return {
        "success_rate": success / len(items),
        "avg_latency": statistics.mean(latencies) if latencies else 0,
        "p95_latency": sorted(latencies)[int(len(latencies)*0.95)-1] if latencies else 0,
        "avg_score": sum(scores) / len(scores),
        "total_tokens": sum(x["tokens"] for x in items),
        "total_cost": sum(x["cost"] for x in items),
    }


def value(m):
    # Avoid zero collapse
    return (
        (m["success_rate"] + 0.01)
        * (m["avg_score"] + 0.01)
    ) / max(m["avg_latency"], 0.001)


# ----------------------------
# MAIN
# ----------------------------

async def main():
    async with aiohttp.ClientSession() as session:

        results = await asyncio.gather(*[
            run_one(session, p) for p in TEST_PROMPTS
        ])

        mem = summarize(results, "mem")
        base = summarize(results, "base")

        print("\n====================")
        print("VALUE REPORT (REAL)")
        print("====================\n")

        print("MEMBRANE:", mem)
        print("BASELINE:", base)

        mv = value(mem)
        bv = value(base)

        print("\n====================")
        print("VALUE SCORE")
        print("====================")

        print("Membrane:", mv)
        print("Baseline:", bv)
        print("Delta:", mv - bv)

        if mv > bv:
            print("\n✅ Membrane ADDS VALUE")
        else:
            print("\n❌ Membrane does NOT clearly add value")


if __name__ == "__main__":
    asyncio.run(main())