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
          <p className="text-gray-600 text-sm">Everything you need to connect to Membrane's Swarm in under 60 seconds.</p>
        </div>

        {/* 1. Base Fundamentals & Auth */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">1. The Basics</h3>
          <p className="text-sm text-gray-600 mb-4">
            Membrane exposes a single, powerful endpoint. All requests must be sent as a <code className="bg-gray-100 px-1 rounded">POST</code> request and include your API key in the headers.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="bg-gray-200 text-gray-600 font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">URL</span>
              <code className="font-mono text-sm text-gray-800">https://membrane-wh1g.onrender.com/api/chat</code>
            </div>
            <div className="flex items-center gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
              <span className="bg-red-200 text-red-800 font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">HEADER</span>
              <code className="font-mono text-sm text-red-700">X-Gearbox-Key: sk_live_YOUR_API_KEY</code>
            </div>
          </div>
        </div>

        {/* 2. Request Structure */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">2. Request Parameters</h3>
          <p className="text-sm text-gray-600 mb-4">
            Send your data as a JSON body. Here are the parameters you can use to control the Swarm:
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Parameter</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">prompt</td>
                  <td className="px-4 py-3 text-xs">string <span className="text-red-500 font-bold">*</span></td>
                  <td className="px-4 py-3">The question, instruction, or text you want the AI to process.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">use_global_cache</td>
                  <td className="px-4 py-3 text-xs">boolean</td>
                  <td className="px-4 py-3">Set to <code className="bg-gray-100 px-1 rounded">true</code> to pull from community history for massive savings, or <code className="bg-gray-100 px-1 rounded">false</code> for a unique generation.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">response_format</td>
                  <td className="px-4 py-3 text-xs">JSON object</td>
                  <td className="px-4 py-3">Optional. Provide a JSON Schema to strictly force the AI to return structured data.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Quickstart Tooling */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">3. Quickstart Code</h3>
          <p className="text-sm text-gray-600 mb-6">
            Copy and paste these snippets to make your first request immediately.
          </p>

          <div className="space-y-6">
            {/* JS Example */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">Node.js / JavaScript</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-yellow-400 font-mono text-xs leading-relaxed">
{`const response = await fetch("https://membrane-wh1g.onrender.com/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Gearbox-Key": "sk_live_YOUR_API_KEY"
  },
  body: JSON.stringify({
    prompt: "Write a haiku about artificial intelligence.",
    use_global_cache: true
  })
});

const data = await response.json();
console.log(data.answer);`}
                </pre>
              </div>
            </div>

            {/* Python Example */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">Python</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-blue-400 font-mono text-xs leading-relaxed">
{`import requests

url = "https://membrane-wh1g.onrender.com/api/chat"
headers = {
    "X-Gearbox-Key": "sk_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "Write a haiku about artificial intelligence.",
    "use_global_cache": True
}

response = requests.post(url, headers=headers, json=data)
print(response.json()["answer"])`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Responses & Errors */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-3">4. Responses & Errors</h3>
          <p className="text-sm text-gray-600 mb-4">
            If successful, you will receive a <code className="bg-gray-100 px-1 rounded">200 OK</code> status with your answer and a billing receipt. If something goes wrong, Membrane uses standard HTTP error codes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">✅ Success Payload</h4>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto h-full">
                <pre className="text-gray-300 font-mono text-xs leading-relaxed">
{`{
  "receipt_id": "md5_hash_string",
  "answer": "Silicon minds wake,\\nLearning patterns in the dark,\\nData blooms like spring.",
  "route_used": "Membrane Swarm",
  "status": "FLASH OK",
  "total_tokens": 42,
  "billed_amount": 0.0001
}`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">❌ Common Errors</h4>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 h-full flex flex-col justify-center space-y-4">
                <div>
                  <span className="font-bold text-red-800 text-sm">401 Unauthorized</span>
                  <p className="text-xs text-red-600 mt-1">You forgot your API key, or the key is invalid.</p>
                </div>
                <div>
                  <span className="font-bold text-red-800 text-sm">402 Payment Required</span>
                  <p className="text-xs text-red-600 mt-1">Your prepaid balance hit $0.00. Top up on the dashboard.</p>
                </div>
                <div>
                  <span className="font-bold text-red-800 text-sm">422 Unprocessable Entity</span>
                  <p className="text-xs text-red-600 mt-1">The AI failed to format the data into your requested JSON schema.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}