import os
import re
import time
from typing import Any, Optional
from fastapi import Request, HTTPException

PUBLIC_IP_TRACKER = {}

def get_safe_destination(destination_path: str, workspace_dir: str) -> str:
    workspace_dir = os.path.realpath(workspace_dir)
    sandbox_dir = os.path.realpath(os.path.join(workspace_dir, "sandbox_scratch"))
    # Strip recursively any potential drive letters, backslashes, or multiple leading/trailing slashes
    cleaned_path = os.path.normpath(destination_path)
    while cleaned_path.startswith(("/", "\\")):
        cleaned_path = cleaned_path.lstrip("/\\")
    
    dest_path = os.path.realpath(os.path.join(sandbox_dir, cleaned_path))
    try:
        common = os.path.commonpath([sandbox_dir, dest_path])
    except ValueError:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
        
    if common != sandbox_dir:
        raise HTTPException(status_code=400, detail="Security Exception: Path traversal attempt detected.")
    return dest_path

EMAIL_PATTERN = re.compile(r'\b[a-zA-Z0-9_.+-]{1,64}@[a-zA-Z0-9-]{1,63}\.[a-zA-Z0-9-.]{2,63}\b')
PHONE_PATTERN = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
IPV6_PATTERN = re.compile(r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b')
PRIVATE_KEY_PATTERN = re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----[^-]+-----END [A-Z ]*PRIVATE KEY-----')

def scrub_pii(val: Any) -> Any:
    """
    Scrubs common PII patterns (emails, phone numbers, IP addresses, IPv6, private keys) from the prompt.
    Evaluates lists and dictionary objects recursively.
    """
    if isinstance(val, str):
        val = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", val)
        val = PHONE_PATTERN.sub("[REDACTED_PHONE]", val)
        val = IP_PATTERN.sub("[REDACTED_IP]", val)
        val = IPV6_PATTERN.sub("[REDACTED_IP]", val)
        val = PRIVATE_KEY_PATTERN.sub("[REDACTED_PRIVATE_KEY]", val)
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
    
    if len(PUBLIC_IP_TRACKER) > 5000:
        # Evict old/expired entries to prevent memory leak
        expired_ips = [ip for ip, times in PUBLIC_IP_TRACKER.items() if not times or now - times[-1] > 60]
        for ip in expired_ips:
            del PUBLIC_IP_TRACKER[ip]
        if len(PUBLIC_IP_TRACKER) > 5000:
            # Still too large: clear oldest 1,000 IPs
            sorted_ips = sorted(PUBLIC_IP_TRACKER.keys(), key=lambda ip: PUBLIC_IP_TRACKER[ip][-1] if PUBLIC_IP_TRACKER[ip] else 0)
            for ip in sorted_ips[:1000]:
                del PUBLIC_IP_TRACKER[ip]

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


def sanitize_exception_message(message: str) -> str:
    if not message:
        return message
    sensitive_keywords = [
        "litellm", "openai", "gemini", "anthropic", "cohere", "missing credentials",
        "api_key", "api-key", "apikey", "openai_api_key", "google_api_key", "secret",
        "token", "credentials", "auth", "authentication", "authorization"
    ]
    message_lower = message.lower()
    if any(kw in message_lower for kw in sensitive_keywords):
        return "Upstream provider authentication or configuration error. Please verify server environment credentials."
    return message
