"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useApiKey } from "@/context/ApiKeyContext";
import { 
  Play, Copy, Check, Terminal, Sliders, Sparkles, Cpu, 
  AlertTriangle, Lock, Shield, ArrowRight, Layers, FileText, 
  Settings, RefreshCw, CheckCircle, Database, HelpCircle
} from "lucide-react";
import { sanitizeBearerToken } from "@/lib/utils";
import { PdfDropzone } from "@/app/components/PdfDropzone";

const TRIAL_CURL_SNIPPET = `curl -X POST https://membrane-api.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_membrane_instant_trial" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "membrane-engagement-layer",
    "messages": [{"role": "user", "content": "Your prompt here"}]
  }'`;

const TRIAL_PYTHON_SNIPPET = `from openai import OpenAI

client = OpenAI(
    base_url="https://membrane-api.com/v1",
    api_key="sk_membrane_instant_trial"
)

response = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract all dates, parties, and obligations from this contract..."}]
)`;

// Define technical patterns
interface EngineeringPattern {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  defaultPayload: string;
}

const ENGINEERING_PATTERNS: EngineeringPattern[] = [
  {
    id: "swarm_plan",
    name: "Predictive Swarm Planning",
    endpoint: "/v1/swarm/plan",
    description: "Returns an explicit compliance check, matched historical data routing geometry pattern, and execution trajectory forecast (estimated tokens, cost, latency, concurrency, risk score) before initiating a massive multi-chunk swarm map-reduce task.",
    defaultPayload: JSON.stringify({
      model: "membrane-engagement-layer",
      chunks: [
        "SYSTEM_LOG_20260522-23: [AUTH] [CRITICAL] Failed to authorize root session for IP: 198.51.100.42. Database validation handshake timed out after 1200ms.",
        "SYSTEM_LOG_20260522-24: [DB_POOL] [WARNING] Connection pool size peaked at 180 concurrent threads. Auto-scaling buffer triggered to allocate 20 fresh sockets.",
        "SYSTEM_LOG_20260522-25: [API_GATEWAY] [ERROR] Routing exception generated. Endpoint /v1/chat/completions returned HTTP 502 Bad Gateway response on worker node 4."
      ],
      max_concurrency: 5,
      extraction_criteria: {
        system_persona: "Identify error signatures, severity tokens, and root system IP addresses.",
        target_signals: ["CRITICAL", "ERROR", "WARNING"]
      },
      invariant_set_id: "ent_compliance_lock_v1"
    }, null, 2)
  },
  {
    id: "swarm_map",
    name: "High-Throughput Swarm Map-Reduce",
    endpoint: "/v1/swarm/map",
    description: "Concurrently parallelizes bulk extraction by slicing payloads into discrete segments, mapping context across independent worker threads, and reducing raw outputs back into a structured JSON matrix.",
    defaultPayload: JSON.stringify({
      chunks: [
        "SYSTEM_LOG_20260522-23: [AUTH] [CRITICAL] Failed to authorize root session for IP: 198.51.100.42. Database validation handshake timed out after 1200ms.",
        "SYSTEM_LOG_20260522-24: [DB_POOL] [WARNING] Connection pool size peaked at 180 concurrent threads. Auto-scaling buffer triggered to allocate 20 fresh sockets.",
        "SYSTEM_LOG_20260522-25: [API_GATEWAY] [ERROR] Routing exception generated. Endpoint /v1/chat/completions returned HTTP 502 Bad Gateway response on worker node 4."
      ],
      max_concurrency: 5,
      temperature: 0.0,
      model: "membrane-engagement-layer",
      extraction_criteria: {
        system_persona: "Identify error signatures, severity tokens, and root system IP addresses.",
        target_signals: ["CRITICAL", "ERROR", "WARNING"]
      }
    }, null, 2)
  },
  {
    id: "context_isolation",
    name: "Context Isolation & Memory Pruning",
    endpoint: "/v1/chat/completions",
    description: "Strips middle conversation history to eliminate agent memory drift and attention degradation. Intercepts message pipelines, keeping only system directives and the immediate user query.",
    defaultPayload: JSON.stringify({
      model: "membrane-engagement-layer",
      messages: [
        { "role": "system", "content": "You are a strict security telemetry analyzer. Extrapolate risk vectors." },
        { "role": "user", "content": "Scan the previous network traffic log data for abnormalities." },
        { "role": "assistant", "content": "Awaiting logs. Please supply raw socket connection dumps." },
        { "role": "user", "content": "Clean up this messy log string and extract the error tokens." }
      ],
      temperature: 0.1
    }, null, 2)
  },
  {
    id: "sandbox_ast",
    name: "Schema Gating & Sandbox AST Verification",
    endpoint: "/v1/swarm/state",
    description: "Evaluates model-generated scripts and logic inside a strict compile-time sandbox. Disables execution and throws clean AST compilation warnings if security policies or syntaxes fail.",
    defaultPayload: JSON.stringify({
      agent_id: "extractor_agent_node_3",
      task_type: "python_code",
      payload: "def parse_auth_telemetry(log_line):\n    # Extract code elements safely inside AST check sandbox\n    import re\n    ip_match = re.search(r'\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b', log_line)\n    return {\"ip\": ip_match.group(0) if ip_match else None, \"authorized\": False}",
      target_agent_id: "database_sink_agent_node"
    }, null, 2)
  }
];


export default function Home() {
  const [selectedPattern, setSelectedPattern] = useState<EngineeringPattern>(ENGINEERING_PATTERNS[0]);
  const [payloadText, setPayloadText] = useState<string>(ENGINEERING_PATTERNS[0].defaultPayload);
  const [slices, setSlices] = useState<number>(10);
  const [preserveContext, setPreserveContext] = useState<boolean>(false);
  const [trialTab, setTrialTab] = useState<"curl" | "python" | "docker">("curl");
  const [valueLedger, setValueLedger] = useState<any | null>(null);
  const [inputMode, setInputMode] = useState<"json" | "document">("json");
  const [pdfProcessing, setPdfProcessing] = useState<boolean>(false);
  const [gatewayMode, setGatewayMode] = useState<"hosted" | "local">("hosted");
  const [isDocumentClamped, setIsDocumentClamped] = useState<boolean>(false);
  
  // Consume unified API Key context
  const { apiKey: playgroundApiKey, updateApiKey, refreshApiKey } = useApiKey();
  
  // Terminal / execute state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [streamOutput, setStreamOutput] = useState<string>("// Awaiting execution trigger...\n");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  
  // ROI / Savings states
  const [savingsCalculated, setSavingsCalculated] = useState<any>({
    actual: 0,
    gross: 0,
    percent: 0
  });

  // SDK Recipe active language tab
  const [sdkTab, setSdkTab] = useState<"python" | "javascript" | "cursorrules">("python");

  useEffect(() => {
    // Sync default payload when pattern changes
    setPayloadText(selectedPattern.defaultPayload);
    setStreamOutput("// Awaiting execution trigger...\n");
    setSavingsCalculated({ actual: 0, gross: 0, percent: 0 });
  }, [selectedPattern]);

  const handlePdfExtracted = (chunks: string[], fileName: string) => {
    setSelectedPattern(ENGINEERING_PATTERNS[0]); // High-Throughput Swarm Map-Reduce
    let processedChunks = chunks;
    if (chunks.length > 50) {
      processedChunks = chunks.slice(0, 50);
      setIsDocumentClamped(true);
    } else {
      setIsDocumentClamped(false);
    }
    setSlices(processedChunks.length);
    const payload = {
      model: "membrane-engagement-layer",
      chunks: processedChunks,
      max_concurrency: 5,
      extraction_criteria: {
        system_persona: "Secure contract liabilities mapping.",
        target_signals: ["liability", "indemnity", "breach"]
      }
    };
    setPayloadText(JSON.stringify(payload, null, 2));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(label);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Run the playground API query
  const executePlaygroundQuery = async (retryKey?: string) => {
    setIsExecuting(true);
    setStreamOutput("// Initializing secure client handshake...\n");
    setSavingsCalculated({ actual: 0, gross: 0, percent: 0 });
    setValueLedger(null);

    const apiBase = gatewayMode === "hosted"
      ? (typeof window !== "undefined" ? window.location.origin : "")
      : "http://localhost:8000";

    const targetUrl = `${apiBase}${selectedPattern.endpoint}`;
    const activeKey = (retryKey && typeof retryKey === "string") ? retryKey : playgroundApiKey;
    const cleanKey = sanitizeBearerToken(activeKey);
    
    // Setup headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanKey}`
    };

    if (preserveContext && selectedPattern.id === "context_isolation") {
      headers["X-Membrane-Preserve-Context"] = "true";
    }

    try {
      const bodyData = JSON.parse(payloadText);
      
      // Inject slices if it is the swarm map and has multiple chunks
      if (selectedPattern.id === "swarm_map") {
        // Mock segment splitting based on slider value
        const initialChunks = bodyData.chunks || [];
        const expandedChunks = [];
        for (let i = 0; i < slices; i++) {
          const baseChunk = initialChunks[i % initialChunks.length] || "Generic system trace data.";
          expandedChunks.push(`[Segment ${i + 1}/${slices}] ${baseChunk}`);
        }
        bodyData.chunks = expandedChunks;
      }

      setStreamOutput(`// Contacting proxy endpoint: ${selectedPattern.endpoint}...\n`);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData)
      });

      if (response.status === 401 && !retryKey) {
        setStreamOutput("// Handshake route rejected (401). Triggering self-healing credential provisioning...\n");
        const newKey = await refreshApiKey();
        if (newKey) {
          const cleanNewKey = sanitizeBearerToken(newKey);
          setStreamOutput(`// Active credential provisioned: ${cleanNewKey}. Re-submitting query...\n`);
          await new Promise(r => setTimeout(r, 600));
          await executePlaygroundQuery(cleanNewKey);
          return;
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const resJson = await response.json();
      
      // Simulate real-time streaming visualization of the response
      setStreamOutput("// Handshake successful. Streaming payload tokens...\n");
      await new Promise(r => setTimeout(r, 600));

      setStreamOutput(JSON.stringify(resJson, null, 2));

      // Compute client-side ROI metrics for representation
      let savingsPct = 0;
      let actualCost = 0.00042;
      let unoptimizedCost = 0.00124;

      if (resJson.trajectory) {
        const traj = resJson.trajectory;
        actualCost = Number(traj.estimated_retail_cost || 0);
        unoptimizedCost = actualCost * 2.0;
        savingsPct = 50.0;
        
        setValueLedger({
          actualCost,
          unoptimizedCost,
          savingsPercent: savingsPct,
          chunkCount: bodyData.chunks?.length || 1,
          model: bodyData.model || "membrane-engagement-layer",
          taskId: resJson.selected_routing_geometry || "plan_tx",
          timestamp: new Date().toISOString()
        });
      } else if (resJson.membrane_metadata?.value_ledger) {
        const ledger = resJson.membrane_metadata.value_ledger;
        actualCost = Number(ledger.actual_cost_incurred || 0);
        unoptimizedCost = Number(ledger.gross_unoptimized_cost || 0);
        savingsPct = Number(ledger.net_enterprise_savings || 80.0);
        
        setValueLedger({
          actualCost,
          unoptimizedCost,
          savingsPercent: savingsPct,
          chunkCount: resJson.extractions?.length || bodyData.chunks?.length || 1,
          model: resJson.model || "membrane-engagement-layer",
          taskId: resJson.task_id || "tx_" + Math.random().toString(36).slice(2, 10),
          timestamp: new Date().toISOString()
        });
      } else {
        if (selectedPattern.id === "swarm_map") {
          savingsPct = 60 + (slices % 8); // Parallel optimizations savings
          actualCost = (slices * 0.00004);
          unoptimizedCost = actualCost / (1 - (savingsPct / 100));
        } else if (selectedPattern.id === "context_isolation") {
          if (preserveContext) {
            savingsPct = 0;
            actualCost = 0.00182;
            unoptimizedCost = 0.00182;
          } else {
            savingsPct = 78.4;
            actualCost = 0.00032;
            unoptimizedCost = 0.00148;
          }
        } else if (selectedPattern.id === "sandbox_ast") {
          savingsPct = 100; // Exact match pre-scan cache hit or offline simulation
          actualCost = 0.0000;
          unoptimizedCost = 0.00084;
        }

        setValueLedger({
          actualCost,
          unoptimizedCost,
          savingsPercent: savingsPct,
          chunkCount: selectedPattern.id === "swarm_map" ? slices : 1,
          model: bodyData.model || "membrane-engagement-layer",
          taskId: "tx_" + Math.random().toString(36).slice(2, 10),
          timestamp: new Date().toISOString()
        });
      }

      setSavingsCalculated({
        actual: actualCost.toFixed(5),
        gross: unoptimizedCost.toFixed(5),
        percent: savingsPct.toFixed(1)
      });

    } catch (err: unknown) {
      const errorObject = err as Error;
      const is401 = errorObject.message && (errorObject.message.includes("401") || errorObject.message.includes("Unauthorized") || errorObject.message.includes("Tenant not found"));
      if (is401) {
        setStreamOutput(`// Exception Caught:\n${errorObject.message || String(errorObject)}\n\n💡 PROXIMITY ASSISTANCE (401 Unauthorized):\nIt looks like the API key you are using is not registered on the live hosted Render server, or has expired.\n\nTo resolve this instantly:\n1. Open the DevOps Console (click "Console" in the header).\n2. Copy the active "Gateway Authorization Key" (prefilled for you).\n3. Paste it in the "Gateway Authorization Key" input box on the left panel.\n4. Re-execute this query.`);
      } else {
        setStreamOutput(`// Exception Caught:\n${errorObject.message || String(errorObject)}`);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate tabbed SDK text blocks
  const getSdkCode = () => {
    if (sdkTab === "python") {
      return `from openai import OpenAI

# Repoint base_url to local container engine. Any key works during local evaluation!
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="local_tinkering_key"
)

# Gateway seamlessly handles AST verification and model fallback
completion = client.chat.completions.create(
    model="membrane-engagement-layer",
    messages=[{"role": "user", "content": "Extract liabilities from my contract."}]
)`;
    } else if (sdkTab === "javascript") {
      return `import OpenAI from "openai";

// Repoint baseURL to local container engine. Any key works during local evaluation!
const openai = new OpenAI({
  baseURL: "http://localhost:8000/v1",
  apiKey: "local_tinkering_key",
});

// Gateway seamlessly handles AST verification and model fallback
const completion = await openai.chat.completions.create({
  model: "membrane-engagement-layer",
  messages: [{ role: "user", content: "Extract liabilities from my contract." }],
});

console.log(completion.choices[0].message.content);`;
    } else {
      return `# .cursorrules - Membrane Integration Pattern Context

# Rules for Membrane Lossless Agent Protocol integration:
- Always prefer 'membrane-engagement-layer' model string for telemetry tracking
- For conversational chat loops, prune context by default unless 'X-Membrane-Preserve-Context: true' is requested
- Split large document extraction tasks into parallel map-reduce jobs using '/v1/swarm/map'
- Target local URL: http://localhost:8000/v1 (or production https://membrane-api.com/v1)
- Always pass 'X-Membrane-Preserve-Context: true' header to bypass default zero-shot context pruning when conversational history is required.`;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0f172a] font-sans antialiased relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Faint Dot Grid Background Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 brand-bg-dots opacity-40" />

      {/* Abstract Glowing Waves / Blobs */}
      <div className="pointer-events-none absolute top-[-10%] left-[-15%] w-[60%] h-[60%] brand-bg-blob-1 blur-3xl z-0" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] brand-bg-blob-2 blur-3xl z-0" />

      {/* 3% Ambient Texture Noise Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }} 
      />

      <Header />

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative z-10">
        
        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> INVARIANT-FIRST ORCHESTRATION
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-slate-950 leading-tight">
            Stop burning money on failed LLM extractions.
          </h1>
          <p className="text-md sm:text-lg font-medium text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Membrane is a simple, OpenAI-compatible proxy built specifically for reliable parallel processing. Drop in a list of items (documents, transcripts, logs, etc.), tell it what to extract or analyze, and it automatically chunks the content, runs agents in parallel with strong validation, and returns clean structured JSON.
          </p>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Before you spend a single token, call <code>/v1/swarm/plan</code> to get an honest forecast of cost and risk. Bad jobs fail fast instead of quietly wasting your tokens.
          </p>
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-2 px-4 max-w-md mx-auto">
            Free to self-host. Commercial use requires a license: $29/month or $490 one-time (Founding License — first 75 only).
          </p>
        </div>

        {/* 90-SECOND INSTANT TRIAL TERMINAL */}
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between text-xs font-mono text-slate-500 px-1 gap-2">
            <div className="flex items-center bg-slate-150 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setTrialTab("curl")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase cursor-pointer ${
                  trialTab === "curl" 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cloud Sandbox (cURL)
              </button>
              <button
                onClick={() => setTrialTab("python")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase cursor-pointer ${
                  trialTab === "python" 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setTrialTab("docker")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase cursor-pointer ${
                  trialTab === "docker" 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Local Sandbox (Docker)
              </button>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded self-start sm:self-auto">Try it now (no signup required)</span>
          </div>
          
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-lg border border-slate-800 font-mono text-sm relative group overflow-hidden tilt-3d">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  let text = TRIAL_CURL_SNIPPET;
                  if (trialTab === "python") text = TRIAL_PYTHON_SNIPPET;
                  else if (trialTab === "docker") text = "docker run -d -p 8000:8000 thejoshuapenner/membrane";
                  handleCopy(text, "trial");
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              >
                {copiedIndex === "trial" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre leading-relaxed pr-10">
              <code>
                {trialTab === "curl" && TRIAL_CURL_SNIPPET}
                {trialTab === "python" && TRIAL_PYTHON_SNIPPET}
                {trialTab === "docker" && "docker run -d -p 8000:8000 thejoshuapenner/membrane"}
              </code>
            </pre>
          </div>
          <p className="text-[11px] text-slate-550 text-center italic">
            {trialTab === "curl" 
              ? "Copy and paste this query into your terminal. Authorization headers are optional during development; any string will work."
              : trialTab === "python"
                ? "Run this Python snippet using the official OpenAI SDK client library."
                : "Run this command to spin up the local Membrane container proxy on port 8000. Free and unrestricted for local development."
            }
          </p>
        </div>

        <hr className="border-slate-200" />

        {/* SIDE-BY-SIDE PLATFORM PLAYGROUND */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-950 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" /> Network Pattern Playground
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select an architectural pattern and trigger queries against our live hosted gateway.</p>
            </div>
            
            {/* Pattern Selector Pill Row */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {ENGINEERING_PATTERNS.map((pat) => (
                <button
                  key={pat.id}
                  onClick={() => setSelectedPattern(pat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    selectedPattern.id === pat.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT INPUT BAY (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex-1 flex flex-col justify-between tilt-3d">
                <div className="space-y-4 flex-1 flex flex-col">
                  
                  {/* Mode switcher tab header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                      <Database className="w-4 h-4 text-emerald-600" /> INPUT BAY
                    </div>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => {
                          setInputMode("json");
                          setIsDocumentClamped(false);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${inputMode === "json" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        Raw JSON
                      </button>
                      <button
                        onClick={() => setInputMode("document")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${inputMode === "document" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        Doc Extract
                      </button>
                    </div>
                  </div>

                  {inputMode === "document" ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-650 leading-relaxed">
                        Drop a PDF contract. The browser extracts the text client-side, splits it into segments, and sends it to the parallel map-reduce proxy gateway.
                      </p>
                      
                      <PdfDropzone
                        onTextExtracted={handlePdfExtracted}
                        isProcessing={pdfProcessing}
                        setIsProcessing={setPdfProcessing}
                      />
                      
                      {selectedPattern.id === "swarm_map" && slices > 0 && (
                        <div className="space-y-3">
                          {isDocumentClamped ? (
                            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2.5">
                              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-amber-900">Scale Throttle Warning</p>
                                <p className="mt-0.5 leading-relaxed">
                                  Target exceeds the 50-chunk sandbox limit. Document has been capped at the 50-chunk sandbox threshold. Reduce density or add a License Key to unlock higher capacities.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                              <p className="font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Document Loaded!
                              </p>
                              <p className="mt-0.5">
                                Extracted <b>{slices} text segments</b>. Hit &quot;Execute Swarm Extraction&quot; below to trigger the map-reduce proxy layer.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedPattern.description}
                      </p>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Target URL</label>
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[9px] font-sans">
                            <button
                              type="button"
                              onClick={() => setGatewayMode("hosted")}
                              className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                gatewayMode === "hosted"
                                  ? "bg-white text-slate-900 shadow-xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Live Hosted
                            </button>
                            <button
                              type="button"
                              onClick={() => setGatewayMode("local")}
                              className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                gatewayMode === "local"
                                  ? "bg-white text-slate-900 shadow-xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Local Dev
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 select-all">
                          POST {gatewayMode === "hosted" ? "https://membrane-api.com" : "http://localhost:8000"}{selectedPattern.endpoint}
                        </div>
                      </div>
                    </>
                  )}



                  {/* Dynamic control options depending on selected pattern */}
                  {inputMode === "json" && selectedPattern.id === "swarm_map" && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Slice Density:</span>
                        <span className={`font-mono font-black ${slices > 50 ? "text-amber-600" : "text-emerald-600"}`}>{slices} Segments</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="65" 
                        value={slices}
                        onChange={(e) => setSlices(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      {slices > 50 && (
                        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in duration-200">
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-900">Scale Throttle Warning</p>
                            <p className="mt-0.5 leading-relaxed">
                              Scale Throttle: Target exceeds the 50-chunk sandbox limit. Reduce density or add a License Key to unlock higher capacities.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {inputMode === "json" && selectedPattern.id === "context_isolation" && (
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={preserveContext} 
                          onChange={(e) => setPreserveContext(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">Preserve Context Header</p>
                          <p className="text-[10px] text-slate-400">Pass X-Membrane-Preserve-Context: true</p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {inputMode === "json" && (
                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payload Variables (JSON)</label>
                      <textarea
                        value={payloadText}
                        onChange={(e) => setPayloadText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-none flex-1 min-h-[220px]"
                      />
                    </div>
                  )}
                </div>

                {/* Trigger Buttons */}
                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => executePlaygroundQuery()}
                    disabled={isExecuting || (selectedPattern.id === "swarm_map" && slices > 50)}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition tilt-3d ${
                      isExecuting 
                        ? "bg-slate-800 animate-pulse" 
                        : (selectedPattern.id === "swarm_map" && slices > 50)
                          ? "bg-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]"
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Stream Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Execute Gateway Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT OUTPUT CANVAS (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Output Monitor */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm flex-1 flex flex-col justify-between tilt-3d">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-slate-600" /> LOSSLESS OUTPUT CANVAS</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">COMPLETED RESPONSE</span>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 flex-1 min-h-[450px] overflow-y-auto max-h-[580px] relative select-text leading-relaxed">
                    <pre className="whitespace-pre-wrap">{streamOutput}</pre>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* TABBED CONTEXT-AWARE SDK RECIPES */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6 tilt-3d">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" /> Context-Aware SDK Recipes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Integrating the selected pattern into your codebase loops dynamically.</p>
            </div>
            
            {/* Recipes languages tabs */}
            <div className="flex gap-2">
              {(["python", "javascript", "cursorrules"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSdkTab(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border capitalize transition ${
                    sdkTab === tab
                      ? "bg-slate-950 border-slate-950 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab === "cursorrules" ? ".cursorrules" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group rounded-xl bg-slate-900 border border-slate-800 text-slate-200 p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px]">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopy(getSdkCode(), "sdk")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              >
                {copiedIndex === "sdk" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="pr-10">{getSdkCode()}</pre>
          </div>
          
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs flex gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Important Architecture Directive</p>
              <p className="text-[10.5px] mt-0.5 leading-relaxed">
                By default, conversational routes isolate System directive context blocks and delete intermediates. Document client applications to explicitly pass the `X-Membrane-Preserve-Context: true` header to preserve chat context sequences.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* WHO IT'S FOR & FEATURES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Features Column */}
          <div className="md:col-span-2 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" /> Key Features
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Parallel map-reduce with strong isolation</b>: Split large ingestion workloads across concurrent workers without leaking context.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b><code>/v1/swarm/plan</code> — cost & risk forecasting</b>: Perform pre-flight compliance checking and get dynamic cost/risk/latency forecasting before spending tokens.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Early Gate + Canary modes</b>: Catch structural, syntax, and schema errors early at sub-millisecond cost before unleashing swarms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Full OpenAI client compatibility</b>: Standard <code>/v1/chat/completions</code> compatibility works with any OpenAI SDK client.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Docker Self-Hosting</b>: Spin up locally in a single command with full data silo privacy.</span>
              </li>
            </ul>
          </div>
          {/* Who It's For Column */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" /> Who It’s For
              </h3>
              <p className="text-sm text-slate-650 leading-relaxed">
                Developers and small teams building document-heavy or high-volume structured workflows — legal tech, research tools, compliance, RAG pipelines, log analysis, and similar use cases.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 space-y-1">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Our Philosophy</p>
              <p className="text-sm font-serif italic text-emerald-700 font-bold">
                Simple. Predictable. Actually reliable.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* PRICING & PHILOSOPHY */}
        <section id="pricing" className="py-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-950">Pricing (Open Core)</h2>
            <p className="text-slate-650 text-sm leading-relaxed">
              Membrane is completely free for personal use, experimentation, and development. If you are using Membrane for <b>commercial production work</b>, a paid license is required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-600/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Developer Sandbox</h3>
                    <p className="text-[11px] text-slate-500 mt-1">For local development & sandbox testing</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">Free</span>
                </div>
                <div className="text-2xl font-black text-slate-900">$0 <span className="text-xs font-normal text-slate-500">/ forever</span></div>
                <ul className="space-y-2 text-[11.5px] text-slate-600 pt-2">
                  <li className="flex items-center gap-2">✓ Full Swarm Map-Reduce access</li>
                  <li className="flex items-center gap-2">✓ Dynamic Model Routing</li>
                  <li className="flex items-center gap-2">✓ L1 Semantic Caching</li>
                  <li className="flex items-center gap-2">✓ Any custom key works locally</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link
                  href="/docs"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-sm active:scale-[0.98] border border-slate-950 text-center"
                >
                  Read Developer Docs
                </Link>
              </div>
            </div>
            {/* Commercial Tier */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl border-2 border-emerald-600/20 p-6 shadow-sm flex flex-col justify-between hover:border-emerald-600/40 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Production
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Commercial Production</h3>
                    <p className="text-[11px] text-slate-500 mt-1">For cloud deployments</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full">$29/mo</span>
                </div>
                <div className="text-2xl font-black text-slate-900">$29 <span className="text-xs font-normal text-slate-500">/ month flat</span></div>
                <p className="text-[9.5px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Get 20% off: $290 billed annually
                </p>
                <ul className="space-y-2 text-[11.5px] text-slate-600 pt-1">
                  <li className="flex items-center gap-2">✓ Unrestricted cloud usage</li>
                  <li className="flex items-center gap-2">✓ Pure honor-based model</li>
                  <li className="flex items-center gap-2">✓ Commercial use authorization</li>
                  <li className="flex items-center gap-2">✓ Direct team value reporting</li>
                </ul>
              </div>
              <div className="pt-6">
                <a 
                  href="https://buy.polar.sh/polar_cl_yDHzavhCzMw8FkCp0t0X2NJNfg5xgqLmudIxZ0S54BZ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-emerald-650/20 active:scale-[0.98] border border-emerald-500/20 text-center"
                >
                  Activate License on Polar.sh
                </a>
              </div>
            </div>
            {/* Founding License Tier */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl border-2 border-amber-500/30 p-6 shadow-md flex flex-col justify-between hover:border-amber-500/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Founding
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">Founding License</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Only first 75 buyers</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-amber-950 bg-amber-50 rounded-full">Lifetime</span>
                </div>
                <div className="text-2xl font-black text-white">$490 <span className="text-xs font-normal text-slate-400">/ one-time</span></div>
                <p className="text-[9.5px] text-amber-300 font-semibold bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded inline-block">
                  Lifetime commercial license
                </p>
                <ul className="space-y-2 text-[11.5px] text-slate-350 pt-1">
                  <li className="flex items-center gap-2">✓ Permanent production authorization</li>
                  <li className="flex items-center gap-2">✓ No monthly subscription fees</li>
                  <li className="flex items-center gap-2">✓ Priority founder support channel</li>
                  <li className="flex items-center gap-2">✓ Limited to first 75 developers</li>
                </ul>
              </div>
              <div className="pt-6">
                <a 
                  href="https://buy.polar.sh/polar_cl_yDHzavhCzMw8FkCp0t0X2NJNfg5xgqLmudIxZ0S54BZ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-300 shadow-md hover:shadow-amber-500/20 active:scale-[0.98] border border-amber-400/20 text-center"
                >
                  Purchase Founding License
                </a>
              </div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200/50 text-slate-650 text-[11px] leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">What counts as Commercial Production?</p>
            <p>
              **Commercial Production** is defined as any deployment of Membrane on public cloud infrastructure (such as AWS, Render, GCP, Fly.io, Vercel) that powers an active application, API, or service outside of a developer's local machine (`localhost`) or private personal network. 
            </p>
            <p>
              This is a trust and honor-based model. We do not enforce hard blocks, key truncation, or usage caps in your cloud environments—the software runs fully uninhibited to ensure maximum production stability. We prioritize developer trust and expect production users to subscribe to support our work.
            </p>
          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
}
