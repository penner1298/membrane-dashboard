import os
import re
import time
from typing import Any, Optional
from fastapi import Request, HTTPException

PUBLIC_IP_TRACKER = {}

def get_safe_destination(destination_path: str, workspace_dir: str) -> str:
    workspace_dir = os.path.abspath(workspace_dir)
    sandbox_dir = os.path.abspath(os.path.join(workspace_dir, "sandbox_scratch"))
    # Strip recursively any potential drive letters, backslashes, or multiple leading/trailing slashes
    cleaned_path = os.path.normpath(destination_path)
    while cleaned_path.startswith(("/", "\\")):
        cleaned_path = cleaned_path.lstrip("/\\")
    
    dest_path = os.path.abspath(os.path.join(sandbox_dir, cleaned_path))
    try:
        common = os.path.commonpath([sandbox_dir, dest_path])
    except ValueError:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
        
    if common != sandbox_dir:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
    return dest_path

def scrub_pii(val: Any) -> Any:
    """
    Scrubs common PII patterns (emails, phone numbers, IP addresses) from the prompt.
    Evaluates lists and dictionary objects recursively.
    """
    if isinstance(val, str):
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        
        val = re.sub(email_pattern, "[REDACTED_EMAIL]", val)
        val = re.sub(phone_pattern, "[REDACTED_PHONE]", val)
        val = re.sub(ip_pattern, "[REDACTED_IP]", val)
        return val
    elif isinstance(val, dict):
        return {k: scrub_pii(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [scrub_pii(item) for item in val]
    else:
        return val

def validate_model_string(model_name: Optional[str]):
    if not model_name:
        return
    # If the user passes a model, make sure it is reasonably formatted.
    if "/" not in model_name and not model_name.startswith("gemini-") and model_name != "membrane-engagement-layer":
        if len(model_name) < 3 or not re.match(r'^[a-zA-Z0-9_\-\.\/:]+$', model_name):
            raise HTTPException(status_code=400, detail=f"Unsupported or malformed model string: '{model_name}'.")

def enforce_public_throttle(request: Request):
    """
    Clamps public trial endpoints to a maximum of 15 API requests per minute.
    """
    is_prod = (
        os.environ.get("RENDER") == "true" or
        os.environ.get("ENVIRONMENT") == "production" or
        os.environ.get("ENV") == "production"
    )
    if not is_prod:
        return # Skip rate limit throttling during local testing

    client_ip = request.client.host if request.client else "unknown"
    if client_ip == "127.0.0.1" or client_ip == "localhost":
        return

    now = time.time()
    if client_ip not in PUBLIC_IP_TRACKER:
        PUBLIC_IP_TRACKER[client_ip] = []
    
    # Prune elements older than 60 seconds
    PUBLIC_IP_TRACKER[client_ip] = [t for t in PUBLIC_IP_TRACKER[client_ip] if now - t < 60]
    
    if len(PUBLIC_IP_TRACKER[client_ip]) >= 15:
        print(f"⚠️ Rate limit exceeded for IP: {client_ip}. Enforcing trial limit of 15 requests/min.")
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. Developer Sandbox accounts are capped at 15 requests per minute. Upgrade to Commercial Production for unlimited access."
        )
    
    PUBLIC_IP_TRACKER[client_ip].append(now)
