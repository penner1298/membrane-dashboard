import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Docs() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <nav className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Membrane<span className="text-blue-600">.</span>
        </h1>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">Dashboard</Link>
          <UserButton />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-10 p-6 space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">API Documentation</h2>
          <p className="text-gray-600">Learn how to connect to Membrane's patent-pending Swarm gateway.</p>
        </div>

        {/* Authentication Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">1. Authentication</h3>
          <p className="text-sm text-gray-600 mb-4">
            Every request to the Swarm requires your unique API key. You can generate or roll your key on your Dashboard. Pass this key in the headers of your request using <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-xs">X-Gearbox-Key</code>.
          </p>
        </div>

        {/* Endpoint Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">2. The Chat Endpoint</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-green-100 text-green-800 font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">POST</span>
            <code className="font-mono text-sm text-gray-800 border-b border-gray-300">https://membrane-wh1g.onrender.com/api/chat</code>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Send a prompt to the Swarm. Our gateway will automatically route your request to the most cost-effective and capable model while leveraging our global semantic cache.
          </p>

          {/* Code Snippets */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">cURL Example</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-green-400 font-mono text-xs leading-relaxed">
{`curl -X POST https://membrane-wh1g.onrender.com/api/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Gearbox-Key: sk_live_YOUR_API_KEY" \\
  -d '{
    "prompt": "Explain quantum entanglement in simple terms.",
    "use_global_cache": true
  }'`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 mt-6">Python Example</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-blue-400 font-mono text-xs leading-relaxed">
{`import requests

url = "https://membrane-wh1g.onrender.com/api/chat"
headers = {
    "X-Gearbox-Key": "sk_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "Explain quantum entanglement in simple terms.",
    "use_global_cache": True
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Response Format Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">3. The Response Format</h3>
          <p className="text-sm text-gray-600 mb-4">
            The Swarm returns a detailed receipt alongside your answer, allowing you to track exactly how much money Membrane saved you on every request.
          </p>
          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-yellow-400 font-mono text-xs leading-relaxed">
{`{
  "receipt_id": "md5_hash_string",
  "answer": "Quantum entanglement is...",
  "route_used": "Membrane Swarm",
  "status": "CACHE HIT",
  "total_tokens": 184,
  "hypothetical_pro_cost": 0.0022,
  "actual_cost": 0.00002,
  "billed_amount": 0.0001,
  "savings_percent": 95.4
}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}