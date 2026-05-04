import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Membrane<span className="text-blue-600">.</span>
        </h1>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            Back to Dashboard
          </Link>
          <UserButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto mt-10 p-6 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Membrane API Reference</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Integrate the Membrane AI Swarm into your own applications. Our API allows you to route complex prompts 
            through specialized AI agents dynamically. 
          </p>
        </div>

        {/* Authentication */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication</h2>
          <p className="text-gray-600 mb-4">
            The Membrane API uses API keys to authenticate requests. You can view and manage your API keys in the 
            <Link href="/" className="text-blue-600 hover:underline mx-1">Membrane Dashboard</Link>.
          </p>
          <p className="text-gray-600 mb-6">
            Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in 
            publicly accessible areas such as GitHub, client-side code, and so forth.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <span className="text-blue-600 font-bold">ℹ️</span>
            <p className="text-sm text-blue-900">
              All API requests must include your API key in an <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">X-API-Key</code> HTTP header.
            </p>
          </div>
        </div>

        {/* Endpoint: Chat */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">POST</span>
            <h2 className="text-2xl font-bold text-gray-800 font-mono text-xl">/v1/swarm/chat</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Sends a message to the Membrane Swarm. The swarm will automatically determine which specialized agents 
            to invoke to generate the best response.
          </p>

          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Request Body</h3>
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <code className="text-blue-600 font-bold">message</code>
              <span className="text-gray-400 text-xs mt-0.5">string (required)</span>
              <p className="text-gray-600 ml-auto w-1/2">The prompt or question you want to send to the swarm.</p>
            </li>
            <li className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <code className="text-blue-600 font-bold">max_tokens</code>
              <span className="text-gray-400 text-xs mt-0.5">integer (optional)</span>
              <p className="text-gray-600 ml-auto w-1/2">The maximum number of tokens to generate in the response. Defaults to 2048.</p>
            </li>
          </ul>

          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Example Request</h3>
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-inner mb-6">
            <div className="flex bg-gray-800 text-xs font-mono text-gray-400 border-b border-gray-700">
              <button className="px-4 py-2 bg-gray-700 text-gray-100">cURL</button>
              <button className="px-4 py-2 hover:bg-gray-700 transition-colors">Python</button>
              <button className="px-4 py-2 hover:bg-gray-700 transition-colors">Node.js</button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="font-mono text-green-400">
                curl -X POST https://api.membrane.com/v1/swarm/chat \{"\n"}
                {"  "}-H "Content-Type: application/json" \{"\n"}
                {"  "}-H "X-API-Key: sk_live_YOUR_API_KEY" \{"\n"}
                {"  "}-d '{"{"}"message": "Write a python script to scrape a website"{"}"}'
              </code>
            </pre>
          </div>
        </div>

        {/* Errors & Billing */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Errors & Billing</h2>
          <p className="text-gray-600 mb-6">
            Membrane operates on a prepaid credit system. Each API call consumes credits based on the number of tokens 
            processed by the swarm. If your balance drops to $0.00, the API will return a <code className="bg-gray-100 px-1 py-0.5 rounded">402 Payment Required</code> error.
          </p>
          
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-800">Status Code</th>
                <th className="pb-3 font-semibold text-gray-800">Error Type</th>
                <th className="pb-3 font-semibold text-gray-800">Resolution</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 font-mono text-red-600 font-bold">401</td>
                <td className="py-3">Unauthorized</td>
                <td className="py-3">Your API key is missing or invalid. Check your headers.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 font-mono text-orange-500 font-bold">402</td>
                <td className="py-3">Insufficient Balance</td>
                <td className="py-3">Add credits via the Membrane Dashboard to continue using the API.</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-gray-900 font-bold">429</td>
                <td className="py-3">Rate Limit Exceeded</td>
                <td className="py-3">You are sending requests too quickly. Back off and try again.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}