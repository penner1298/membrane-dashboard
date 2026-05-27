import os
from dotenv import load_dotenv

# Ensure dotenv is loaded so that environment variables are available when config is imported.
load_dotenv()

# --- PRICING & ECONOMICS ---
FLASH_INPUT_COST = 0.075
FLASH_OUTPUT_COST = 0.30
PRO_INPUT_COST = 1.25
PRO_OUTPUT_COST = 5.00

MARKUP_MULTIPLIER = 2.0  # You charge 2x the raw API cost
L1_CACHE_FEE = 0.0001   # Subsidized micro-transaction for Global Hive Mind
L2_CACHE_FEE = 0.0025   # Discounted rate for Private Silo Database Read

# --- AGENT-AGNOSTIC MODEL SPECIFICATIONS ---
# We support FLASH_MODEL (or CANARY_MODEL), APEX_MODEL, and EMBED_MODEL (or EMBEDDING_MODEL).
FLASH_MODEL = (
    os.environ.get("MEMBRANE_FLASH_MODEL")
    or os.environ.get("FLASH_MODEL")
    or os.environ.get("CANARY_MODEL")
    or "gemini/gemini-2.5-flash"
)
APEX_MODEL = (
    os.environ.get("MEMBRANE_APEX_MODEL")
    or os.environ.get("APEX_MODEL")
    or "gemini/gemini-3.5-flash"
)
EMBED_MODEL = (
    os.environ.get("EMBED_MODEL")
    or os.environ.get("EMBEDDING_MODEL")
    or "gemini/text-embedding-004"
)
BOUNCER_MODEL = os.environ.get("BOUNCER_MODEL") or FLASH_MODEL

# Maintain variables for backwards compatibility
CANARY_MODEL = FLASH_MODEL
EMBEDDING_MODEL = EMBED_MODEL

# Sandbox & Swarm Parameters
MAX_SANDBOX_CHUNKS = 25
MAX_SWARM_CEILING_CHUNKS = 50
MAX_SAFE_CHUNK_CHARS = 25000

# Cache configurations
MAX_L1_CACHE_SIZE = 10000
L1_CACHE_TTL = 300  # 5 minutes
