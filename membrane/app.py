import os
import re
import asyncio
import warnings
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import asyncpg

# Import Membrane packaged configurations and logic
from membrane.config import *
from membrane.licensing import license_state, validate_polar_license
from membrane.database_init import initialize_db_schema
from membrane.cache import sweep_l1_cache

warnings.filterwarnings("ignore")

# Define global database pool reference
db_pool: Optional[asyncpg.Pool] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    
    # 1. Environment Key Assertions
    detected_keys = [k for k in ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY"] if os.environ.get(k)]
    if not detected_keys:
        print("⚠️ Warning: No common AI provider API keys detected in environment.")
        
    # 2. Polar.sh license check
    license_key = os.environ.get("MEMBRANE_LICENSE_KEY")
    if not license_key:
        license_key = "test_license_key"
        print("ℹ️ MEMBRANE_LICENSE_KEY not set. Defaulting to 'test_license_key' for friction-free local contributor testing.")
    
    print(f"🔍 Validating Membrane License Key: {license_key[:4]}...")
    is_valid = await validate_polar_license(license_key)
    license_state["validated"] = is_valid
    license_state["key"] = license_key
    
    # 3. Database connection pool initialization
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        is_dev = os.environ.get("ENVIRONMENT", "production").lower() in ("development", "local", "dev")
        DATABASE_SSL_STR = os.environ.get("DATABASE_SSL", "false" if is_dev else "true")
        DATABASE_SSL = DATABASE_SSL_STR.lower() == "true"
        print(f"🔌 Connecting to PostgreSQL (SSL={DATABASE_SSL})...")
        try:
            db_pool = await asyncpg.create_pool(db_url, ssl=DATABASE_SSL, min_size=10, max_size=100)
            app.state.db_pool = db_pool
            
            # Inject references into sub-modules for backwards-compatibility
            import server
            server.db_pool = db_pool
            
            import membrane.cache
            membrane.cache.db_pool = db_pool
            import membrane.database
            membrane.database.db_pool = db_pool
            import membrane.telemetry
            membrane.telemetry.db_pool = db_pool
            
            # Run DDL schemas & migrations asynchronously from specialized module
            await initialize_db_schema(db_pool)
            print("✅ Database connected. Multi-Tenant Ledger initialized and migrations completed.")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
    else:
        print("⚠️ DATABASE_URL not found. DLQ and Caching will be disabled.")

    # 4. Spawn background L1 Cache Sweeper task
    sweep_task = asyncio.create_task(sweep_l1_cache())

    yield
    
    # 5. Clean up resources on shutdown
    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        pass
    if db_pool:
        await db_pool.close()

# Create FastAPI app instance
app = FastAPI(title="Membrane API - Swarm Edition", lifespan=lifespan)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Head Request Handler middleware
@app.middleware("http")
async def handle_head_requests(request: Request, call_next):
    if request.method == "HEAD":
        response = await call_next(request)
        if response.status_code == 405:
            from fastapi import Response
            new_headers = dict(response.headers)
            new_headers.pop("allow", None)
            new_headers["Access-Control-Allow-Origin"] = "*"
            new_headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
            new_headers["Access-Control-Allow-Headers"] = "*"
            return Response(status_code=200, headers=new_headers)
        return response
    return await call_next(request)

# --- Exception Sanitization ---

from membrane.security import sanitize_exception_message

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        if "message" in detail:
            detail["message"] = sanitize_exception_message(str(detail["message"]))
    elif isinstance(detail, str):
        detail = sanitize_exception_message(detail)
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={"detail": detail}
    )

def make_serializable_errors(errors: list) -> list:
    cleaned = []
    for err in errors:
        c_err = {}
        for k, v in err.items():
            if k == "ctx" and isinstance(v, dict):
                c_err["ctx"] = {ck: (str(cv) if isinstance(cv, Exception) else cv) for ck, cv in v.items()}
            else:
                c_err[k] = v
        cleaned.append(c_err)
    return cleaned

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": make_serializable_errors(exc.errors())}
    )

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": make_serializable_errors(exc.errors())}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    exc_name = type(exc).__name__
    exc_msg = str(exc)
    if "AuthenticationError" in exc_name or "APIConnectionError" in exc_name or \
       any(kw in exc_msg.lower() for kw in ["missing credentials", "api_key", "openai_api_key", "litellm", "auth"]):
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized: Upstream credentials are unconfigured or invalid."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please check server logs for details."}
    )

# Routers registration
from membrane.routers.chat import router as chat_router
from membrane.routers.swarm import router as swarm_router
from membrane.routers.admin import router as admin_router

app.include_router(chat_router)
app.include_router(swarm_router)
app.include_router(admin_router)

