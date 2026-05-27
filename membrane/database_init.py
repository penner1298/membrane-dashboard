import json
from typing import Any

async def initialize_db_schema(db_pool: Any) -> None:
    """
    Initializes database tables, indices, columns, and performs alter migrations.
    This replaces the inline DDL setup previously in server.py's lifespan.
    """
    if not db_pool:
        return
        
    async with db_pool.acquire() as conn:
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        except Exception as e:
            print(f"⚠️ Warning: Could not create pgvector extension: {e}")

        # Tenants Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS tenants (
            id SERIAL PRIMARY KEY,
            api_key_hash VARCHAR(255) UNIQUE NOT NULL,
            balance NUMERIC(10, 4) DEFAULT 0.0000,
            tenant_id VARCHAR(255) UNIQUE,
            referral_code VARCHAR(50) UNIQUE,
            has_redeemed_ref BOOLEAN DEFAULT FALSE,
            has_paid BOOLEAN DEFAULT FALSE,
            total_saved NUMERIC(10, 4) DEFAULT 0.0000,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        # Deprecated Keys Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS deprecated_keys (
            api_key_hash VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255),
            balance NUMERIC(10, 4) DEFAULT 0.0000,
            deprecated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)
        # Automated TTL pruning for expired deprecated keys
        await conn.execute("DELETE FROM deprecated_keys WHERE deprecated_at < NOW() - INTERVAL '5 minutes';")

        # API Logs Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS api_logs (
            id SERIAL PRIMARY KEY,
            tenant_id VARCHAR(255),
            endpoint VARCHAR(255) NOT NULL,
            tokens INTEGER NOT NULL,
            cost DECIMAL(10, 4) NOT NULL,
            wholesale_cost DECIMAL(10, 6) DEFAULT 0.0,
            savings DECIMAL(10, 4) DEFAULT 0.0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        # DLQ Logs Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS dlq_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            api_key_hash VARCHAR(255) NOT NULL,
            inbound_prompt TEXT NOT NULL,
            requested_schema JSONB,
            failed_output TEXT,
            error_message TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_dlq_api_key ON dlq_logs(api_key_hash);
        """)

        # Semantic Cache Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS semantic_cache (
            id SERIAL PRIMARY KEY,
            prompt_text TEXT NOT NULL,
            requested_schema JSONB,
            embedding VECTOR(768),
            cached_response TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            api_key_hash VARCHAR(255) DEFAULT 'legacy',
            is_global BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding
        ON semantic_cache USING hnsw (embedding vector_cosine_ops);
        """)

        # Aversive Memory Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS aversive_memory (
            id SERIAL PRIMARY KEY,
            prompt_hash VARCHAR(255) NOT NULL,
            bad_output TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            api_key_hash VARCHAR(255) DEFAULT 'legacy',
            is_global BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_aversive_hash ON aversive_memory(prompt_hash);
        """)

        # Shadow Telemetry Table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS shadow_telemetry (
            id SERIAL PRIMARY KEY,
            receipt_id VARCHAR(255) UNIQUE,
            ttfb FLOAT,
            died BOOLEAN,
            flash_failed BOOLEAN DEFAULT FALSE,
            prompt_hash VARCHAR(255),
            prompt_embedding VECTOR(768),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_telemetry_receipt ON shadow_telemetry(receipt_id);
        CREATE INDEX IF NOT EXISTS idx_telemetry_embedding
        ON shadow_telemetry USING hnsw (prompt_embedding vector_cosine_ops);
        """)

        # Next.js migrated DDL Alter commands
        await conn.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;")
        await conn.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) UNIQUE;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 4) DEFAULT 0.0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS wholesale_cost DECIMAL(10, 6) DEFAULT 0.0;")

        # Map-Reduce Telemetry Tracking columns
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS raw_input_size INTEGER DEFAULT 0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS optimized_output_size INTEGER DEFAULT 0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS savings_percentage DECIMAL(10, 4) DEFAULT 0.0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS workload_profile VARCHAR(255);")

        # Swarm experiment columns
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS swarm_mode VARCHAR(50) DEFAULT 'legacy';")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS rejected_at_gate BOOLEAN DEFAULT FALSE;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS canary_used BOOLEAN DEFAULT FALSE;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS canary_succeeded BOOLEAN DEFAULT FALSE;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS chunks_reached_model INTEGER DEFAULT 0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS estimated_waste_tokens INTEGER DEFAULT 0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS died BOOLEAN DEFAULT FALSE;")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS task_id VARCHAR(255);")
        await conn.execute("ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS concurrency_level INTEGER DEFAULT 0;")

        # Benchmarking Telemetry lookup table
        await conn.execute("""
        CREATE TABLE IF NOT EXISTS benchmarks (
            id SERIAL PRIMARY KEY,
            dataset_size INTEGER DEFAULT 0,
            aggregate_precision DECIMAL(10, 4) DEFAULT 0.0,
            aggregate_faithfulness DECIMAL(10, 4) DEFAULT 0.0,
            average_latency_sec DECIMAL(10, 4) DEFAULT 0.0,
            total_tokens INTEGER DEFAULT 0,
            retail_cost DECIMAL(10, 4) DEFAULT 0.0,
            wholesale_cost DECIMAL(10, 6) DEFAULT 0.0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        # Seed mock benchmarks if empty
        count = await conn.fetchval("SELECT COUNT(*) FROM benchmarks;")
        if count == 0:
            await conn.execute("""
            INSERT INTO benchmarks (dataset_size, aggregate_precision, aggregate_faithfulness, average_latency_sec, total_tokens, retail_cost, wholesale_cost) VALUES
            (250, 0.965, 0.942, 2.14, 1420500, 120.4500, 60.2250),
            (500, 0.982, 0.958, 1.89, 2841000, 241.9000, 120.9500),
            (100, 0.941, 0.912, 3.42, 580000, 48.2000, 24.1000);
            """)
