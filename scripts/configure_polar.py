#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
import urllib.error

# Polar.sh API Host
API_BASE_URL = "https://api.polar.sh/v1"

def make_request(url, token, method="GET", payload=None):
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        method=method
    )
    
    if payload:
        req.data = json.dumps(payload).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (307, 308):
            redirect_url = e.headers.get("Location")
            if redirect_url:
                return make_request(redirect_url, token, method=method, payload=payload)
        error_msg = e.read().decode("utf-8")
        print(f"\n❌ API Error ({method} {url} returned HTTP {e.code}):")
        try:
            parsed_error = json.loads(error_msg)
            print(json.dumps(parsed_error, indent=2))
        except Exception:
            print(error_msg)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Request failed: {e}")
        sys.exit(1)

def main():
    print("====================================================")
    # Grounded description of action
    print("Polar.sh Setup Automation - Membrane Commercial License")
    print("====================================================\n")
    
    token = os.environ.get("POLAR_API_TOKEN")
    if not token:
        token = input("🔑 Enter your Polar.sh Organization Access Token (OAT): ").strip()
        if not token:
            print("❌ Access token is required.")
            sys.exit(1)
            
    # 1. Fetch Organizations
    print("\n🔍 Fetching your Polar.sh organizations...")
    orgs_data = make_request(f"{API_BASE_URL}/organizations", token)
    
    # Polar returns organizations list directly or in a paginated object
    orgs = []
    if isinstance(orgs_data, list):
        orgs = orgs_data
    elif isinstance(orgs_data, dict) and "items" in orgs_data:
        orgs = orgs_data["items"]
        
    if not orgs:
        print("❌ No organizations found under this token. Make sure you are using an Organization Access Token (OAT).")
        sys.exit(1)
        
    print("\nSelect Organization:")
    for idx, org in enumerate(orgs):
        print(f" [{idx}] {org.get('name')} (Slug: {org.get('slug')})")
        
    try:
        selection = int(input("\nSelect index [0]: ").strip() or 0)
        selected_org = orgs[selection]
    except (ValueError, IndexError):
        print("❌ Invalid selection.")
        sys.exit(1)
        
    org_id = selected_org["id"]
    org_name = selected_org["name"]
    print(f"\nSelected: {org_name} (ID: {org_id})")
    
    # 2. Create the License Keys Benefit
    print("\n🎫 Creating License Key Benefit...")
    benefit_payload = {
        "type": "license_keys",
        "description": "Commercial Production License for Membrane",
        "properties": {
            "prefix": "MEMBRANE_",
            "activations": {
                "limit": 1,
                "enable_customer_admin": True
            }
        }
    }
    
    benefit_result = make_request(f"{API_BASE_URL}/benefits", token, method="POST", payload=benefit_payload)
    benefit_id = benefit_result["id"]
    print(f"✅ Created Benefit: '{benefit_result.get('description')}' (ID: {benefit_id})")
    print("Benefit API Response:")
    print(json.dumps(benefit_result, indent=2))
    
    # 3. Create the Product
    print("\n📦 Creating Subscription Product...")
    product_payload = {
        "name": "Membrane Commercial License",
        "description": (
            "Flat-fee commercial production license for Membrane. "
            "Enables deploying Membrane on public cloud infrastructure (such as AWS, Render, GCP, Fly.io, Vercel) "
            "to power active applications or APIs. "
            "Includes unlimited swarm parallel extraction slices, L1/L2 semantic caching, and full context preservation support."
        ),
        "is_recurring": True,
        "recurring_interval": "month",
        "recurring_interval_count": 1,
        "prices": [
            {
                "price_amount": 2900,
                "price_currency": "usd",
                "amount_type": "fixed"
            }
        ]
    }
    
    product_result = make_request(f"{API_BASE_URL}/products", token, method="POST", payload=product_payload)
    product_id = product_result["id"]
    print(f"✅ Created Monthly Product: '{product_result.get('name')}' (ID: {product_id})")
    
    # 3.5 Create the Yearly Product
    print("\n📦 Creating Yearly Subscription Product...")
    yearly_product_payload = {
        "name": "Membrane Commercial License",
        "description": (
            "Flat-fee commercial production license for Membrane. "
            "Enables deploying Membrane on public cloud infrastructure (such as AWS, Render, GCP, Fly.io, Vercel) "
            "to power active applications or APIs. "
            "Includes unlimited swarm parallel extraction slices, L1/L2 semantic caching, and full context preservation support. "
            "Billed annually (saves 20% compared to monthly)."
        ),
        "is_recurring": True,
        "recurring_interval": "year",
        "recurring_interval_count": 1,
        "prices": [
            {
                "price_amount": 29000,
                "price_currency": "usd",
                "amount_type": "fixed"
            }
        ]
    }
    
    yearly_product_result = make_request(f"{API_BASE_URL}/products", token, method="POST", payload=yearly_product_payload)
    yearly_product_id = yearly_product_result["id"]
    print(f"✅ Created Yearly Product: '{yearly_product_result.get('name')}' (ID: {yearly_product_id})")
    
    # 3.7 Create the Founding Lifetime Product
    print("\n📦 Creating Founding Lifetime Product...")
    founding_product_payload = {
        "name": "Membrane Founding License",
        "description": (
            "Lifetime commercial production license for Membrane. "
            "Enables deploying Membrane on public cloud infrastructure (such as AWS, Render, GCP, Fly.io, Vercel) "
            "to power active applications or APIs. "
            "Includes unlimited swarm parallel extraction slices, L1/L2 semantic caching, and full context preservation support. "
            "One-time payment. Limited to first 75 buyers."
        ),
        "is_recurring": False,
        "prices": [
            {
                "price_amount": 49000,
                "price_currency": "usd",
                "amount_type": "fixed"
            }
        ]
    }
    
    founding_product_result = make_request(f"{API_BASE_URL}/products", token, method="POST", payload=founding_product_payload)
    founding_product_id = founding_product_result["id"]
    print(f"✅ Created Founding Product: '{founding_product_result.get('name')}' (ID: {founding_product_id})")
    
    # 4. Link Benefit to Products
    print("\n🔗 Linking License Key Benefit to Products...")
    link_payload = {
        "benefits": [benefit_id]
    }
    
    make_request(f"{API_BASE_URL}/products/{product_id}/benefits", token, method="POST", payload=link_payload)
    make_request(f"{API_BASE_URL}/products/{yearly_product_id}/benefits", token, method="POST", payload=link_payload)
    make_request(f"{API_BASE_URL}/products/{founding_product_id}/benefits", token, method="POST", payload=link_payload)
    print("✅ License Key Benefit successfully attached to all Products.")
    
    # 5. Create Checkout Link
    print("\n🔗 Creating Checkout Link...")
    checkout_payload = {
        "products": [product_id, yearly_product_id, founding_product_id],
        "payment_processor": "stripe"
    }
    
    checkout_result = make_request(f"{API_BASE_URL}/checkout-links", token, method="POST", payload=checkout_payload)
    checkout_url = checkout_result.get("url")
    
    print("\n====================================================")
    print("🎉 Polar.sh Setup Complete!")
    print(f"Monthly Product ID: {product_id}")
    print(f"Yearly Product ID: {yearly_product_id}")
    print(f"Founding Product ID: {founding_product_id}")
    print(f"Benefit ID: {benefit_id}")
    print(f"Checkout URL: {checkout_url}")
    print("====================================================")

if __name__ == "__main__":
    main()
