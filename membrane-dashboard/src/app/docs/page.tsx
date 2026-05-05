import Link from "next/link";
import { ArrowLeft, Terminal, Server, ShieldAlert, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Docs Header */}
      <header className="border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-gray-900 text-lg">Membrane Documentation</span>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-green-600 hover:text-green-700">
            Go to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Swarm API Specification
          </h1>
          <p className="text-lg text-gray-500 mb-12">
            Membrane is a high-speed, agent-agnostic routing layer. Send a prompt, get an answer. Everything you need to integrate is on this single page.
          </p>

          <hr className="my-10 border-gray-200" />

          {/* Section 1: Endpoint */}
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 m-0">1. The Endpoint</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Make a <code>POST</code> request to our primary chat endpoint. All requests must be authenticated using your API key.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 mb-10 overflow-x-auto">
            <div className="flex gap-4 mb-2">
              <span className="text-green-400 font-bold">POST</span>
              <span className="text-white">https://membrane-api.com/api/chat</span>
            </div>
            <div className="flex gap-4">
              <span className="text-purple-400">Headers:</span>
              <span>X-Gearbox-Key: sk_live_YOUR_API_KEY</span>
            </div>
          </div>

          {/* Section 2: Payload */}
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 m-0">2. Request Payload</h2>
          </div>
          <p className="text-gray-600 mb-4">Send your data as a JSON body with the following parameters:</p>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-10">
            <table className="w-full text-left text-sm m-0">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">Parameter</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-mono text-gray-900">prompt <span className="text-red-500">*</span></td>
                  <td className="px-6 py-4 text-gray-500">string</td>
                  <td className="px-6 py-4 text-gray-600">The question, instruction, or text you want the AI to process.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gray-900">use_global_cache</td>
                  <td className="px-6 py-4 text-gray-500">boolean</td>
                  <td className="px-6 py-4 text-gray-600">Set to <code>true</code> to pull from community history for massive savings and speed. Defaults to <code>false</code>.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-gray-900">response_format</td>
                  <td className="px-6 py-4 text-gray-500">JSON object</td>
                  <td className="px-6 py-4 text-gray-600">Optional. Provide a JSON Schema to strictly force the AI to return structured data.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Response */}
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 m-0">3. Success Response</h2>
          </div>
          <p className="text-gray-600 mb-4">
            If successful, you will receive a <code>200 OK</code> status. Extract your text from the <code>answer</code> key.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 mb-10 overflow-x-auto">
            <pre>
{`{
  "receipt_id": "md5_hash_string",
  "answer": "Silicon paths glow, routing requests in the dark, speed is all we know.",
  "route_used": "Membrane-Engagement-Layer",
  "status": "DEEP_COGNITION",
  "total_tokens": 42,
  "hypothetical_pro_cost": 0.0003,
  "actual_cost": 0.0001,
  "billed_amount": 0.0002,
  "savings_percent": 33.3
}`}
            </pre>
          </div>

          {/* Section 4: Errors */}
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 m-0">4. Error Handling</h2>
          </div>
          <ul className="space-y-3 text-gray-600">
            <li><strong className="text-gray-900">401 Unauthorized:</strong> Missing or invalid <code>X-Gearbox-Key</code>.</li>
            <li><strong className="text-gray-900">402 Payment Required:</strong> Your prepaid balance hit $0.00. Time to top up.</li>
            <li><strong className="text-gray-900">422 Unprocessable Entity:</strong> The AI failed to format the data into your requested JSON schema.</li>
          </ul>

        </div>
      </main>
    </div>
  );
}