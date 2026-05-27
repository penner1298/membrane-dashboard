from membrane import MembraneClient

# Initialize Membrane Client. Assumes MEMBRANE_BASE_URL and MEMBRANE_API_KEY environment variables are set, or uses defaults.
client = MembraneClient()

print("Sending standard chat completions query through Membrane Proxy...")
completion = client.client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from this contract..."}]
)

print("\nResponse:")
print(completion.choices[0].message.content)
