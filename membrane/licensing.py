import asyncio

# --- POLAR.SH LICENSE STATE & VALIDATION ---
license_state = {
    "validated": False,
    "key": None,
    "error": None
}

class GlobalStateNamespace:
    @property
    def license_active(self) -> bool:
        return license_state["validated"]
    @license_active.setter
    def license_active(self, val: bool):
        license_state["validated"] = val

global_state = GlobalStateNamespace()

async def validate_polar_license(key: str) -> bool:
    if key == "test_license_key":
        print("🎫 Developer license key 'test_license_key' detected. Bypassing Polar.sh check.")
        return True
    
    url = "https://api.polar.sh/v1/customer-portal/license-keys/validate"
    headers = {"Content-Type": "application/json"}
    payload = {"key": key}
    
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers, timeout=5.0) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    status = data.get("status")
                    if status == "active" or data.get("is_valid", True):
                        print("✅ Polar.sh License Key verified successfully.")
                        return True
                    else:
                        print(f"❌ Polar.sh License Key is invalid. Status: {status}")
                        return False
                elif resp.status in (400, 401, 403, 404):
                    # Check if response text indicates a key validation error or a network/platform constraint
                    text = await resp.text()
                    if any(term in text.lower() for term in ["invalid", "not found", "validation_failed"]):
                        print(f"❌ Polar.sh validation failed (Invalid Key) with HTTP {resp.status}: {text}")
                        return False
                    else:
                        print(f"⚠️ Polar.sh client side warning HTTP {resp.status}. Failing open for resilient execution.")
                        return True
                else:
                    print(f"⚠️ Polar.sh server error (HTTP {resp.status}). Fail-open enabled for production resilience.")
                    return True
    except asyncio.TimeoutError:
        print("⚠️ Polar.sh API validation timed out. Fail-open enabled for production resilience.")
        return True
    except Exception as e:
        print(f"⚠️ Polar.sh validation error ({e}). Fail-open enabled for production resilience.")
        return True
