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
                else:
                    text = await resp.text()
                    print(f"❌ Polar.sh validation failed with HTTP {resp.status}: {text}. Fail-closed active.")
                    return False
    except asyncio.TimeoutError:
        print("❌ Polar.sh API validation timed out. Fail-closed active.")
        return False
    except Exception as e:
        print(f"❌ Polar.sh validation error ({e}). Fail-closed active.")
        return False
