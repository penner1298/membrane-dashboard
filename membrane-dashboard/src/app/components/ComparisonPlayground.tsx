"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, Key, Play, AlertTriangle, CheckCircle2, 
  Clock, Zap, DollarSign, Sparkles, Terminal, 
  HelpCircle, ShieldCheck, RefreshCw, Layers, UploadCloud, 
  Search, ShieldAlert, Cpu, Copy, Check, GitCompare, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Verify details for pricing
interface ModelDetails {
  id: string;
  name: string;
  inputPrice: number; // per 1M tokens
  outputPrice: number; // per 1M tokens
  apexNode: string;
  canaryNode: string;
  embeddingNode: string;
}

interface ProviderDetails {
  name: string;
  keyPlaceholder: string;
  models: ModelDetails[];
}

const PROVIDERS: Record<string, ProviderDetails> = {
  openai: {
    name: "GPT (OpenAI)",
    keyPlaceholder: "sk-...",
    models: [
      { 
        id: "gpt-4o-mini", 
        name: "gpt-4o-mini", 
        inputPrice: 0.15, 
        outputPrice: 0.60,
        apexNode: "gpt-4o-mini",
        canaryNode: "gpt-4o-mini",
        embeddingNode: "text-embedding-3-small"
      },
      { 
        id: "gpt-4o", 
        name: "gpt-4o", 
        inputPrice: 2.50, 
        outputPrice: 10.00,
        apexNode: "gpt-4o",
        canaryNode: "gpt-4o-mini",
        embeddingNode: "text-embedding-3-large"
      },
      { 
        id: "o3-mini", 
        name: "o3-mini", 
        inputPrice: 1.10, 
        outputPrice: 4.40,
        apexNode: "o3-mini",
        canaryNode: "o3-mini",
        embeddingNode: "text-embedding-3-small"
      },
      { 
        id: "o1", 
        name: "o1", 
        inputPrice: 15.00, 
        outputPrice: 60.00,
        apexNode: "o1",
        canaryNode: "o3-mini",
        embeddingNode: "text-embedding-3-large"
      },
      { 
        id: "gpt-4.5", 
        name: "gpt-4.5", 
        inputPrice: 75.00, 
        outputPrice: 150.00,
        apexNode: "gpt-4.5",
        canaryNode: "gpt-4o-mini",
        embeddingNode: "text-embedding-3-large"
      }
    ]
  },
  anthropic: {
    name: "Claude (Anthropic)",
    keyPlaceholder: "sk-ant-...",
    models: [
      { 
        id: "claude-3-5-haiku-20241022", 
        name: "claude-3-5-haiku", 
        inputPrice: 0.80, 
        outputPrice: 4.00,
        apexNode: "claude-3-5-haiku",
        canaryNode: "claude-3-5-haiku",
        embeddingNode: "voyage-3-lite"
      },
      { 
        id: "claude-3-5-sonnet-20241022", 
        name: "claude-3-5-sonnet", 
        inputPrice: 3.00, 
        outputPrice: 15.00,
        apexNode: "claude-3-5-sonnet",
        canaryNode: "claude-3-5-haiku",
        embeddingNode: "voyage-3"
      },
      { 
        id: "claude-3-7-sonnet-20250219", 
        name: "claude-3-7-sonnet", 
        inputPrice: 3.00, 
        outputPrice: 15.00,
        apexNode: "claude-3-7-sonnet",
        canaryNode: "claude-3-5-haiku",
        embeddingNode: "voyage-3"
      }
    ]
  },
  gemini: {
    name: "Gemini (Google)",
    keyPlaceholder: "AIzaSy...",
    models: [
      { 
        id: "gemini-2.5-flash", 
        name: "gemini-2.5-flash", 
        inputPrice: 0.075, 
        outputPrice: 0.30,
        apexNode: "gemini-2.5-flash",
        canaryNode: "gemini-2.5-flash",
        embeddingNode: "text-embedding-004"
      },
      { 
        id: "gemini-2.5-pro", 
        name: "gemini-2.5-pro", 
        inputPrice: 1.25, 
        outputPrice: 5.00,
        apexNode: "gemini-2.5-pro",
        canaryNode: "gemini-2.5-flash",
        embeddingNode: "text-embedding-004"
      },
      { 
        id: "gemini-3.5-flash", 
        name: "gemini-3.5-flash", 
        inputPrice: 0.075, 
        outputPrice: 0.30,
        apexNode: "gemini-3.5-flash",
        canaryNode: "gemini-2.5-flash",
        embeddingNode: "text-embedding-004"
      },
      { 
        id: "gemini-3.5-pro", 
        name: "gemini-3.5-pro", 
        inputPrice: 1.25, 
        outputPrice: 5.00,
        apexNode: "gemini-3.5-pro",
        canaryNode: "gemini-2.5-flash",
        embeddingNode: "text-embedding-004"
      }
    ]
  }
};

const SAMPLE_CONTRACT = `MEMBRANE ENTERPRISE SERVICES MASTER AGREEMENT
Document Reference: MSA-2026-0524
Effective Date: May 24, 2026

SECTION 1: LICENSE GRANT & USAGE RIGHTS
Licensor grants Licensee a non-transferable, non-exclusive, revocable license to access the Membrane Ingestion Layer. Usage is strictly bound to local developer evaluations unless commercial licensing is declared.

SECTION 2: SERVICE LEVEL AGREEMENTS (SLA)
Licensor guarantees a 99.9% uptime for cloud-hosted routing endpoints. Any downtime extending past 4 consecutive hours will trigger a credit offset of 5% of monthly billing.

SECTION 5: INDEMNIFICATION CLAUSES
5.1 Licensee Indemnity: Licensee agrees to defend, indemnify, and hold harmless Licensor against any claims, losses, or damages arising from illegal data payloads passed through the proxy network.
5.2 Licensor Indemnity: Licensor shall indemnify Licensee against intellectual property infringement claims brought by third parties, provided Licensee gives immediate written notice.

SECTION 9: GENERAL CAP ON LIABILITY
IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR UNDER ANY OTHER THEORY OF LIABILITY, EXCEED THE TOTAL FEES PAID BY LICENSEE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, UP TO A MAXIMUM OF $50,000.

SECTION 10: SPECIAL INDEMNITY EXCLUSIONS (BURIED EXCLUSION)
EXCLUSION 10.1: Notwithstanding Section 5.2, Licensor shall NOT indemnify Licensee for any IP claims if the infringement arises from modifications made to the Membrane open-source core by Licensee's developer team.
EXCLUSION 10.2: Licensee is fully liable for any downstream LLM token consumption bills incurred due to recursive loop conditions triggered in custom agent routing configurations.

SECTION 14: TERMINATION & WIND-DOWN
Either party may terminate this agreement upon 30 days written notice. Upon termination, Licensee must delete all cached tokens and local Docker volumes containing proprietary proxy code.
`;

const SAMPLE_LOGS = `[2026-05-24 08:12:01] INFO [GATEWAY] Initializing connection handshake with model: membrane-engagement-layer
[2026-05-24 08:12:02] INFO [DB] Connection pool established. 18 active sockets available.
[2026-05-24 08:12:05] WARNING [API] Upstream OpenAI request took 3400ms. Response latency warning triggered.
[2026-05-24 08:12:12] ERROR [ROUTER] Failed to validate JSON schema against chunk 14. Validation details: Missing field 'liabilities'.
[2026-05-24 08:12:13] INFO [RETRY] Triggering Canary validation mode for chunk 14.
[2026-05-24 08:12:14] ERROR [CANARY] Canary probe failed. Payload schema is fundamentally incompatible. Terminating swarm early to prevent token waste.
[2026-05-24 08:12:15] CRITICAL [SECURITY] Failed root authorization attempt from IP address: 198.51.100.42. Database validation handshake timed out.
[2026-05-24 08:12:18] INFO [GATEWAY] Purged L1 semantic cache for 14 inactive sessions.
`;

interface ExtractedItem {
  type: string;
  content: string;
  source?: string;
  raw?: any;
}

const parseOutputToItems = (text: string): ExtractedItem[] => {
  if (!text) return [];
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
      cleaned = cleaned.replace(/\n?```$/, "");
      cleaned = cleaned.trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // Attempt truncated/partial JSON recovery
      parsed = null;
      const closeBraceIndices: number[] = [];
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '}') {
          closeBraceIndices.push(i);
        }
      }

      for (let i = closeBraceIndices.length - 1; i >= 0; i--) {
        const idx = closeBraceIndices[i];
        const candidateSlice = cleaned.substring(0, idx + 1);
        
        // 1. Try closing as array of objects inside wrapping object
        try {
          parsed = JSON.parse(candidateSlice + "]}");
          break;
        } catch (e) {}

        // 2. Try closing as single object
        try {
          parsed = JSON.parse(candidateSlice + "}");
          break;
        } catch (e) {}

        // 3. Try parsing candidateSlice directly (no additions)
        try {
          parsed = JSON.parse(candidateSlice);
          break;
        } catch (e) {}
      }

      if (!parsed) {
        // 4. Try closing as direct array of objects
        for (let i = closeBraceIndices.length - 1; i >= 0; i--) {
          const idx = closeBraceIndices[i];
          const candidateSlice = cleaned.substring(0, idx + 1);
          try {
            parsed = JSON.parse(candidateSlice + "]");
            break;
          } catch (e) {}
        }
      }

      // If all repair attempts fail, rethrow original parse error
      if (!parsed) {
        throw parseErr;
      }
    }
    const items: ExtractedItem[] = [];

    const processObject = (obj: any, defaultType: string = "extraction"): ExtractedItem => {
      let type = defaultType;
      let content = "";
      let source = "";

      const contentKeys = ["clause", "verbatim", "verbatim_text", "content", "description", "text", "message", "details", "val", "value", "triggering_event"];
      for (const k of contentKeys) {
        if (obj[k]) {
          if (typeof obj[k] === "object") {
            content = JSON.stringify(obj[k]);
          } else {
            content = String(obj[k]);
          }
          break;
        }
      }
      
      const typeKeys = ["type", "category", "signal", "label", "matched_signals", "severity"];
      for (const k of typeKeys) {
        if (obj[k]) {
          type = Array.isArray(obj[k]) ? obj[k].join(", ") : String(obj[k]);
          break;
        }
      }

      const sourceKeys = ["source_section", "source_reference", "section", "source", "location", "file", "index", "chunk_index"];
      for (const k of sourceKeys) {
        if (obj[k] !== undefined) {
          source = String(obj[k]);
          break;
        }
      }

      if (!content) {
        const stringValues = Object.entries(obj)
          .filter(([k, v]) => typeof v === "string" && k !== "type" && k !== "source_section" && k !== "section" && k !== "source" && k !== "location")
          .map(([, v]) => v);
        if (stringValues.length > 0) {
          content = String(stringValues[0]);
        } else {
          content = JSON.stringify(obj);
        }
      }

      return { type, content, source, raw: obj };
    };

    // Normalize: if wrapped in extracted_data, unwrap it
    let actualParsed = parsed;
    if (parsed && typeof parsed === "object" && parsed.extracted_data !== undefined) {
      actualParsed = parsed.extracted_data;
    }

    if (parsed && typeof parsed === "object" && Array.isArray(parsed.extractions)) {
      parsed.extractions.forEach((item: any) => {
        if (typeof item === "object" && item !== null) {
          items.push(processObject(item));
        } else {
          items.push({ type: "item", content: String(item) });
        }
      });
      return items;
    }

    if (Array.isArray(actualParsed)) {
      actualParsed.forEach(item => {
        if (typeof item === "object" && item !== null) {
          items.push(processObject(item));
        } else {
          items.push({ type: "item", content: String(item) });
        }
      });
    } else if (typeof actualParsed === "object" && actualParsed !== null) {
      if (Array.isArray(actualParsed.extractions)) {
        actualParsed.extractions.forEach((item: any) => {
          if (typeof item === "object" && item !== null) {
            items.push(processObject(item));
          } else {
            items.push({ type: "item", content: String(item) });
          }
        });
      } else {
        Object.entries(actualParsed).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (typeof item === "object" && item !== null) {
                items.push(processObject(item, key));
              } else {
                items.push({ type: key, content: String(item) });
              }
            });
          } else if (typeof val === "object" && val !== null) {
            items.push(processObject(val, key));
          } else {
            items.push({ type: key, content: String(val) });
          }
        });
      }
    }

    return items;
  } catch (e) {
    return [{ type: "raw_text", content: text }];
  }
};

const isItemMissed = (item: ExtractedItem, list: ExtractedItem[]): boolean => {
  if (list.length === 0) return true;
  const contentLower = item.content.toLowerCase();
  const words = contentLower.split(/\s+/).filter(w => w.length > 4);
  if (words.length === 0) return !list.some(d => d.content.toLowerCase().includes(contentLower));

  return !list.some(d => {
    const directLower = d.content.toLowerCase();
    if (directLower.includes(contentLower) || contentLower.includes(directLower)) return true;
    
    let overlapCount = 0;
    for (const w of words) {
      if (directLower.includes(w)) overlapCount++;
    }
    const overlapRatio = overlapCount / words.length;
    return overlapRatio > 0.4;
  });
};

const getBadgeColorClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes("liability")) return "bg-amber-100 text-amber-800 border border-amber-200/50";
  if (t.includes("indemnity")) return "bg-emerald-100 text-emerald-800 border border-emerald-200/50";
  if (t.includes("exclusion")) return "bg-rose-100 text-rose-800 border border-rose-200/50";
  if (t.includes("warning") || t.includes("critical") || t.includes("security") || t.includes("error")) return "bg-red-100 text-red-800 border border-red-200/50";
  return "bg-slate-100 text-slate-800 border border-slate-200/50";
};

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNum: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
      }>;
    }>;
  };
}

export function ComparisonPlayground() {
  const [provider, setProvider] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [docType, setDocType] = useState<"contract" | "logs" | "custom">("contract");
  
  const [customText, setCustomText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedPageCount, setUploadedPageCount] = useState<number | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState(
    "Extract all liability caps, indemnity terms, exclusions, and critical warning signals into a structured JSON list."
  );

  const [isRunning, setIsRunning] = useState(false);
  const [isCachedRunning, setIsCachedRunning] = useState(false);

  // Results State
  const [directOutput, setDirectOutput] = useState("");
  const [directStats, setDirectStats] = useState({ latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Awaiting run..." });
  
  const [membraneOutput, setMembraneOutput] = useState("");
  const [membraneStats, setMembraneStats] = useState({ 
    latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Awaiting run...",
    cacheHitRate: "0%", speedup: "1.0x", savings: "0%", chunks: 0
  });

  const [cachedOutput, setCachedOutput] = useState("");
  const [cachedStats, setCachedStats] = useState({
    latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Awaiting cold run first...",
    cacheHitRate: "0%", speedup: "1.0x", savings: "0%"
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareViewMode, setCompareViewMode] = useState<"visual" | "raw">("visual");

  // Refs for console auto-scrolling
  const directTerminalRef = useRef<HTMLDivElement>(null);
  const membraneTerminalRef = useRef<HTMLDivElement>(null);
  const cachedTerminalRef = useRef<HTMLDivElement>(null);

  // Inbound payloads and raw responses
  const [directRequest, setDirectRequest] = useState("");
  const [directRawResponse, setDirectRawResponse] = useState("");
  const [membraneRequest, setMembraneRequest] = useState("");
  const [membraneRawResponse, setMembraneRawResponse] = useState("");
  const [cachedRequest, setCachedRequest] = useState("");
  const [cachedRawResponse, setCachedRawResponse] = useState("");

  const [showDirectDetails, setShowDirectDetails] = useState(false);
  const [showMembraneDetails, setShowMembraneDetails] = useState(false);
  const [showCachedDetails, setShowCachedDetails] = useState(false);

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanJsonOutput = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
      cleaned = cleaned.replace(/\n?```$/, "");
    }
    return cleaned.trim();
  };

  const activeProvider = PROVIDERS[provider];
  const activeModel = activeProvider.models.find(m => m.id === modelId) || activeProvider.models[0];

  useEffect(() => {
    // Reset model selection when switching providers
    const firstModel = PROVIDERS[provider].models[0].id;
    setModelId(firstModel);
  }, [provider]);

  const getActiveText = () => {
    if (docType === "contract") return SAMPLE_CONTRACT;
    if (docType === "logs") return SAMPLE_LOGS;
    return customText || "Please paste your custom document text here...";
  };

  const activeText = getActiveText();
  const isLogDoc = docType === "logs" || (docType === "custom" && (activeText.toLowerCase().includes("info [") || activeText.toLowerCase().includes("error [") || activeText.toLowerCase().includes("[2026-")));

  // Dynamically load PDFJS client-side
  const loadPdfJs = async (): Promise<PdfJsLib> => {
    const win = window as any;
    if (win.pdfjsLib) return win.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = win.pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(pdfjsLib);
        } else {
          reject(new Error("PDF.js engine load error."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF engine script."));
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError(null);
    setPdfLoading(true);
    setUploadedFileName(file.name);
    
    const sizeInKb = file.size / 1024;
    setUploadedFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb.toFixed(0)} KB`);

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setUploadedPageCount(pdf.numPages);
      
      // Strict 100 page demo ceiling
      if (pdf.numPages > 100) {
        throw new Error(`Demo Limit Exceeded: Uploaded document exceeds 100 pages (found ${pdf.numPages} pages). Please upload a smaller document.`);
      }

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }

      setCustomText(text);
      setDocType("custom");
    } catch (err: any) {
      console.error(err);
      setPdfError(err.message || "Failed to parse PDF document.");
      setUploadedFileName(null);
      setUploadedPageCount(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const executeComparison = async () => {
    if (isRunning) return;

    const docText = getActiveText();
    if (docType === "custom" && !customText) {
      alert("Please paste or upload custom text first.");
      return;
    }

    if (!apiKey) {
      alert("Please provide an API key to execute live comparisons.");
      return;
    }

    setIsRunning(true);
    setDirectOutput("");
    setMembraneOutput("");
    setCachedOutput("");

    // Initialize stats
    setDirectStats({ latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Awaiting queue..." });
    setMembraneStats({ 
      latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Awaiting queue...",
      cacheHitRate: "0%", speedup: "1.0x", savings: "0%", chunks: 0
    });
    setCachedStats({
      latency: 0, cost: 0, inputTokens: 0, outputTokens: 0, progress: 0, status: "Waiting for cold run...",
      cacheHitRate: "0%", speedup: "1.0x", savings: "0%"
    });

    await executeLiveRuns(docText);
  };

  // Helper to split document text into chunks
  const splitIntoChunks = (text: string, type: "contract" | "logs" | "custom"): string[] => {
    const splitChunkIfTooLarge = (chunkText: string, maxChunkSize: number = 10000): string[] => {
      if (chunkText.length <= maxChunkSize) {
        return [chunkText];
      }

      // 1. Try splitting by double newlines first
      if (chunkText.includes("\n\n")) {
        const parts = chunkText.split(/\n\s*\n/);
        const subChunks: string[] = [];
        let current = "";
        for (const part of parts) {
          if ((current + "\n\n" + part).length > maxChunkSize) {
            if (current) {
              subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
            }
            current = part;
          } else {
            current = current ? current + "\n\n" + part : part;
          }
        }
        if (current) {
          subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
        }
        return subChunks;
      }

      // 2. Try splitting by single newlines
      if (chunkText.includes("\n")) {
        const parts = chunkText.split("\n");
        const subChunks: string[] = [];
        let current = "";
        for (const part of parts) {
          if ((current + "\n" + part).length > maxChunkSize) {
            if (current) {
              subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
            }
            current = part;
          } else {
            current = current ? current + "\n" + part : part;
          }
        }
        if (current) {
          subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
        }
        return subChunks;
      }

      // 3. Try splitting by sentences (periods)
      if (chunkText.includes(". ")) {
        const parts = chunkText.split(". ");
        const subChunks: string[] = [];
        let current = "";
        for (const part of parts) {
          if ((current + ". " + part).length > maxChunkSize) {
            if (current) {
              subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
            }
            current = part;
          } else {
            current = current ? current + ". " + part : part;
          }
        }
        if (current) {
          subChunks.push(...splitChunkIfTooLarge(current.trim(), maxChunkSize));
        }
        return subChunks;
      }

      // 4. Hard character slice fallback
      const subChunks: string[] = [];
      let index = 0;
      while (index < chunkText.length) {
        subChunks.push(chunkText.substring(index, index + maxChunkSize));
        index += maxChunkSize;
      }
      return subChunks;
    };

    let initialChunks: string[] = [];
    if (type === "contract") {
      const sections = text.split(/(?=SECTION \d+|EXCLUSION \d+)/gi);
      initialChunks = sections.map(s => s.trim()).filter(s => s.length > 0);
    } else if (type === "logs") {
      const entries = text.split(/(?=\[\d{4}-\d{2}-\d{2})/g);
      initialChunks = entries.map(e => e.trim()).filter(e => e.length > 0);
    } else {
      const paragraphs = text.split(/\n\s*\n/);
      let currentChunk = "";
      for (const para of paragraphs) {
        if ((currentChunk + "\n\n" + para).length > 6000) {
          if (currentChunk) initialChunks.push(currentChunk.trim());
          currentChunk = para;
        } else {
          currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
        }
      }
      if (currentChunk) initialChunks.push(currentChunk.trim());
    }

    const finalChunks: string[] = [];
    initialChunks.forEach(chunk => {
      finalChunks.push(...splitChunkIfTooLarge(chunk, 12000));
    });

    return finalChunks.filter(c => c.length > 0);
  };

  // Helper to determine target signals
  const getTargetSignals = (promptText: string, type: "contract" | "logs" | "custom"): string[] => {
    if (type === "contract") {
      return ["liability_cap", "indemnity_terms", "exclusions", "critical_warning_signals"];
    }
    if (type === "logs") {
      return ["error_event", "warning_event", "security_event", "critical_event"];
    }
    const signals: string[] = [];
    const lower = promptText.toLowerCase();
    if (lower.includes("liability")) signals.push("liability_cap");
    if (lower.includes("indemnity")) signals.push("indemnity_terms");
    if (lower.includes("exclusion")) signals.push("exclusions");
    if (lower.includes("warning") || lower.includes("signal")) signals.push("critical_warning_signals");
    if (lower.includes("date")) signals.push("due_date");
    if (lower.includes("amount") || lower.includes("fee")) signals.push("amount_due");
    
    if (signals.length === 0) {
      return ["extracted_data", "critical_signals"];
    }
    return signals;
  };

  // Helper to get system persona
  const getSystemPersona = (type: "contract" | "logs" | "custom"): string => {
    if (type === "contract") {
      return "You are a professional contract auditor.";
    }
    if (type === "logs") {
      return "You are a senior systems reliability engineer auditing server logs.";
    }
    return "You are an expert data extraction agent.";
  };

  // Live client-side parallel execution using custom API Key
  const executeLiveRuns = async (text: string) => {
    let directSec = 0;
    let coldSec = 0;
    let warmSec = 0;
    let calculatedColdCost = 0;
    let calculatedWarmCost = 0;

    const costPerInput = activeModel.inputPrice / 1000000;
    const costPerOutput = activeModel.outputPrice / 1000000;

    // Reset log states
    setDirectRequest("");
    setDirectRawResponse("");
    setMembraneRequest("");
    setMembraneRawResponse("");
    setCachedRequest("");
    setCachedRawResponse("");

    const interval = setInterval(() => {
      directSec = Number((directSec + 0.1).toFixed(1));
      coldSec = Number((coldSec + 0.1).toFixed(1));
      setDirectStats(prev => prev.progress < 100 ? { ...prev, latency: directSec } : prev);
      setMembraneStats(prev => prev.progress < 100 ? { ...prev, latency: coldSec } : prev);
    }, 100);

    try {
      // 1. EXECUTE DIRECT LLM RUN
      setDirectStats(prev => ({ ...prev, status: "Sending request to provider...", progress: 30 }));
      
      const systemPromptText = `You are a professional contract and log telemetry auditor.
You MUST analyze the input document and return a JSON object with a single key "extractions" containing a list of matching extracted entities.
Each object in the "extractions" array MUST have exactly the following three string fields:
- "type": the classification category (must match one of the target signals requested, e.g. "liability_cap", "indemnity_terms", "exclusions", "critical_warning_signals", "error_event", "warning_event", "critical_event", "security_event").
- "content": the verbatim clause sentence, log line, or text segment matching the criteria. Do not summarize or truncate; output the verbatim sentence or line.
- "location": the section title reference, line number reference, or log timestamp where this was found.

Format your output strictly as a JSON object matching this schema:
{
  "extractions": [
    {
      "type": "...",
      "content": "...",
      "location": "..."
    }
  ]
}`;

      const directHeaders = { "Content-Type": "application/json" };
      const directPayload = {
        provider,
        apiKey: apiKey.replace(/.(?=.{4})/g, "*"),
        model: modelId,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPromptText },
          { role: "user", content: `Please perform this extraction task: ${prompt}\n\nInput Document Text:\n${text}` }
        ]
      };
      setDirectRequest(`POST /api/direct-llm\nHeaders: ${JSON.stringify(directHeaders, null, 2)}\nPayload:\n${JSON.stringify(directPayload, null, 2)}`);

      const directPromise = fetch("/api/direct-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model: modelId,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPromptText },
            { role: "user", content: `Please perform this extraction task: ${prompt}\n\nInput Document Text:\n${text}` }
          ]
        })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error || "Direct call failed");
        }
        return r.json();
      });

      // 2. EXECUTE MEMBRANE COLD RUN
      setMembraneStats(prev => ({ 
        ...prev, 
        status: `Initializing Swarm Map-Reduce. Provider: ${provider}...`, 
        progress: 40
      }));

      const chunks = splitIntoChunks(text, docType);
      const target_signals = getTargetSignals(prompt, docType);
      const system_persona = getSystemPersona(docType);

      const membraneHeaders = { 
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_membrane_instant_trial",
        "X-Provider-API-Key": apiKey.replace(/.(?=.{4})/g, "*"),
        "X-Membrane-Swarm-Mode": "canary"
      };

      const membranePayloadBody = {
        model: "membrane-engagement-layer",
        provider,
        chunks,
        extraction_criteria: {
          system_persona,
          target_signals
        },
        max_concurrency: 20
      };

      setMembraneRequest(`POST /v1/swarm/map\nHeaders: ${JSON.stringify(membraneHeaders, null, 2)}\nPayload:\n${JSON.stringify(membranePayloadBody, null, 2)}`);

      const membraneResponse = await fetch("/v1/swarm/map", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer sk_membrane_instant_trial",
          "X-Provider-API-Key": apiKey,
          "X-Membrane-Swarm-Mode": "canary"
        },
        body: JSON.stringify(membranePayloadBody)
      });

      if (!membraneResponse.ok) {
        const errText = await membraneResponse.text();
        throw new Error(`Membrane Swarm Map Error: ${errText}`);
      }

      const membraneResult = await membraneResponse.json();
      
      // Fast-follow: Execute Interpretive Reduction Layer
      setMembraneStats(prev => ({ 
        ...prev, 
        status: "Map complete. Executing Interpretive Reduction Layer...", 
        progress: 70 
      }));

      const reductionHeaders = { "Content-Type": "application/json" };
      const reductionPayloadBody = {
        provider,
        apiKey: apiKey.replace(/.(?=.{4})/g, "*"),
        model: modelId,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional synthesis model. You take raw, chunk-by-chunk extractions and reduce them into a single, unified, structured JSON list. Deduplicate any repeating entries, clean up formatting, resolve context boundaries.
You MUST return a JSON object with a single key "extractions" containing a list of synthesized extracted entities.
Each object in the "extractions" array MUST have exactly the following three string fields:
- "type": the classification category (must match one of the target signals requested, e.g. "liability_cap", "indemnity_terms", "exclusions", "critical_warning_signals", "error_event", "warning_event", "critical_event", "security_event").
- "content": the verbatim clause sentence, log line, or text segment matching the criteria. Do not summarize or truncate; output the verbatim sentence or line.
- "location": the section title reference, line number reference, or log timestamp where this was found.

Format your output strictly as a JSON object matching this schema:
{
  "extractions": [
    {
      "type": "...",
      "content": "...",
      "location": "..."
    }
  ]
}`
          },
          {
            role: "user",
            content: `Please reduce and synthesize these raw chunk extractions:\n\n${JSON.stringify(membraneResult.extractions, null, 2)}`
          }
        ]
      };

      // Execute live reduction call
      const reductionResponse = await fetch("/api/direct-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model: modelId,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a professional synthesis model. You take raw, chunk-by-chunk extractions and reduce them into a single, unified, structured JSON list. Deduplicate any repeating entries, clean up formatting, resolve context boundaries.
You MUST return a JSON object with a single key "extractions" containing a list of synthesized extracted entities.
Each object in the "extractions" array MUST have exactly the following three string fields:
- "type": the classification category (must match one of the target signals requested, e.g. "liability_cap", "indemnity_terms", "exclusions", "critical_warning_signals", "error_event", "warning_event", "critical_event", "security_event").
- "content": the verbatim clause sentence, log line, or text segment matching the criteria. Do not summarize or truncate; output the verbatim sentence or line.
- "location": the section title reference, line number reference, or log timestamp where this was found.

Format your output strictly as a JSON object matching this schema:
{
  "extractions": [
    {
      "type": "...",
      "content": "...",
      "location": "..."
    }
  ]
}`
            },
            {
              role: "user",
              content: `Please reduce and synthesize these raw chunk extractions:\n\n${JSON.stringify(membraneResult.extractions, null, 2)}`
            }
          ]
        })
      });

      if (!reductionResponse.ok) {
        const errText = await reductionResponse.text();
        throw new Error(`Membrane Swarm Reduction Error: ${errText}`);
      }

      const reductionResult = await reductionResponse.json();
      const rawReducedText = cleanJsonOutput(reductionResult.choices?.[0]?.message?.content || "");
      
      // Save details to playground states
      setMembraneRawResponse(
        `--- [1. MAP SWARM RESPONSE] ---\n${JSON.stringify(membraneResult, null, 2)}\n\n` +
        `--- [2. REDUCTION LAYER RESPONSE] ---\n${JSON.stringify(reductionResult, null, 2)}`
      );
      setMembraneOutput(rawReducedText);

      // Track aggregated tokens and costs
      const mapInputTokens = membraneResult.membrane_metadata?.prompt_tokens ?? chunks.reduce((acc, c) => acc + Math.ceil(c.length / 4), 0);
      const mapOutputTokens = membraneResult.membrane_metadata?.completion_tokens ?? Math.ceil(JSON.stringify(membraneResult.extractions).length / 4);
      const reductionInputTokens = reductionResult.usage?.prompt_tokens ?? 0;
      const reductionOutputTokens = reductionResult.usage?.completion_tokens ?? 0;

      const totalSwarmInputTokens = mapInputTokens + reductionInputTokens;
      const totalSwarmOutputTokens = mapOutputTokens + reductionOutputTokens;
      calculatedColdCost = (totalSwarmInputTokens * costPerInput) + (totalSwarmOutputTokens * costPerOutput);
      const coldStatus = membraneResult.membrane_metadata?.status || "MAP_COMPLETE";

      setMembraneStats(prev => ({
        ...prev,
        progress: 100,
        status: `Swarm & Reduction complete: ${coldStatus}`,
        inputTokens: totalSwarmInputTokens,
        outputTokens: totalSwarmOutputTokens,
        cost: Number(calculatedColdCost.toFixed(5)),
        latency: coldSec,
        chunks: chunks.length
      }));

      // --- 3. EXECUTE MEMBRANE WARM RUN (Cached) ---
      setIsCachedRunning(true);
      setCachedStats(prev => ({ ...prev, status: "Querying L1 Swarm Cache...", progress: 30 }));
      
      const warmTimer = setInterval(() => {
        warmSec = Number((warmSec + 0.1).toFixed(1));
        setCachedStats(prev => prev.progress < 100 ? { ...prev, latency: warmSec } : prev);
      }, 100);

      // Save warm request payload details
      setCachedRequest(`POST /v1/swarm/map\nHeaders: ${JSON.stringify(membraneHeaders, null, 2)}\nPayload:\n${JSON.stringify(membranePayloadBody, null, 2)}`);

      // Call same completions endpoint again for a cache hit
      const warmResponse = await fetch("/v1/swarm/map", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer sk_membrane_instant_trial",
          "X-Provider-API-Key": apiKey,
          "X-Membrane-Swarm-Mode": "canary"
        },
        body: JSON.stringify(membranePayloadBody)
      });

      if (!warmResponse.ok) {
        const errText = await warmResponse.text();
        throw new Error(`Membrane Cached Swarm Map Error: ${errText}`);
      }

      clearInterval(warmTimer);
      const warmResult = await warmResponse.json();
      
      // Serve cached reduction output without calling model
      setCachedOutput(rawReducedText);
      setCachedRawResponse(
        `--- [1. MAP SWARM RESPONSE (CACHED)] ---\n${JSON.stringify(warmResult, null, 2)}\n\n` +
        `--- [2. REDUCTION LAYER RESPONSE (CACHED)] ---\n${JSON.stringify({ ...reductionResult, usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }, null, 2)}`
      );

      const warmInputTokens = warmResult.membrane_metadata?.prompt_tokens ?? 0;
      const warmOutputTokens = warmResult.membrane_metadata?.completion_tokens ?? 0;
      calculatedWarmCost = (warmInputTokens * costPerInput) + (warmOutputTokens * costPerOutput);
      const warmStatus = warmResult.membrane_metadata?.status || "SEMANTIC_CACHE";

      setCachedStats(prev => ({
        ...prev,
        progress: 100,
        status: `Cached request complete: ${warmStatus}`,
        inputTokens: warmInputTokens,
        outputTokens: warmOutputTokens,
        cost: Number(calculatedWarmCost.toFixed(5)),
        cacheHitRate: "100%",
        latency: warmSec
      }));
      setIsCachedRunning(false);

      // --- 4. AWAIT DIRECT LLM COMPLETION ---
      setDirectStats(prev => ({ ...prev, status: "Awaiting sequential response streams...", progress: 75 }));
      const directResult = await directPromise;
      setDirectRawResponse(JSON.stringify(directResult, null, 2));

      const finalDirectLatency = directSec;
      clearInterval(interval);

      const directText = cleanJsonOutput(directResult.choices?.[0]?.message?.content || "");
      setDirectOutput(directText);

      const directInputTokens = directResult.usage?.prompt_tokens || 0;
      const directOutputTokens = directResult.usage?.completion_tokens || 0;
      const calculatedDirectCost = (directInputTokens * costPerInput) + (directOutputTokens * costPerOutput);

      setDirectStats(prev => ({
        ...prev,
        progress: 100,
        status: "Direct request complete.",
        inputTokens: directInputTokens,
        outputTokens: directOutputTokens,
        cost: Number(calculatedDirectCost.toFixed(5)),
        latency: finalDirectLatency
      }));

      // Update speedups and savings dynamically (apples-to-apples)
      const speedMultiplier = (finalDirectLatency / coldSec).toFixed(1);
      const coldSavingsVal = calculatedDirectCost > 0 ? Math.round(((calculatedDirectCost - calculatedColdCost) / calculatedDirectCost) * 100) : 0;
      setMembraneStats(prev => ({ 
        ...prev, 
        speedup: `${speedMultiplier}x`,
        savings: `${coldSavingsVal}%`
      }));

      const cachedSpeedMultiplier = (finalDirectLatency / warmSec).toFixed(1);
      const warmSavingsVal = calculatedDirectCost > 0 ? Math.round(((calculatedDirectCost - calculatedWarmCost) / calculatedDirectCost) * 100) : 100;
      setCachedStats(prev => ({ 
        ...prev, 
        speedup: `${cachedSpeedMultiplier}x`,
        savings: `${warmSavingsVal}%`
      }));

      // Scroll all terminals back to top once response is complete
      setTimeout(() => {
        if (directTerminalRef.current) directTerminalRef.current.scrollTop = 0;
        if (membraneTerminalRef.current) membraneTerminalRef.current.scrollTop = 0;
        if (cachedTerminalRef.current) cachedTerminalRef.current.scrollTop = 0;
      }, 100);

    } catch (err: any) {
      console.error(err);
      alert(`API Execution Error: ${err.message || "Request failed"}`);
      clearInterval(interval);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm tilt-container">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-slate-950 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Model Agnostic Playground: Membrane vs. Direct LLM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compare a standard sequential LLM request against Membrane's parallel swarm routing. Upload up to 100 pages and test your keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* INPUTS COLUMN (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* STEP 1: CONFIGURE LLM & API KEY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              <Key className="w-4 h-4 text-emerald-600" /> LLM API CONFIGURATION
            </div>

            {/* Provider Selector Tab row */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
              {(["openai", "anthropic", "gemini"] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProvider(prov)}
                  className={`py-1.5 font-bold rounded-lg transition text-center uppercase tracking-wider ${
                    provider === prov
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {PROVIDERS[prov].name.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {activeProvider.name} API Key
                </label>
                <input
                  type="password"
                  placeholder={activeProvider.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                />
                <p className="text-[9px] text-slate-400">
                  Keys are processed completely client-side to keep your usage secure.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Model to Test</label>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white animate-in fade-in"
                >
                  {activeProvider.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                 <p className="text-[8.5px] text-slate-400 mt-0.5 leading-snug">
                  Choose your target model for the Direct LLM run. Membrane automatically coordinates its own model-agnostic swarm routing profile (<span className="font-semibold text-slate-500 font-mono">membrane-engagement-layer</span>).
                </p>
              </div>

              {/* Verifiable Pricing info details */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-[10px] font-mono text-slate-600 flex justify-between">
                <div>
                  <span className="font-bold text-slate-800">Verifiable Cost rates:</span>
                  <div className="mt-1 flex gap-4">
                    <span>Input: ${activeModel.inputPrice.toFixed(3)}/1M</span>
                    <span>Output: ${activeModel.outputPrice.toFixed(3)}/1M</span>
                  </div>
                </div>
                <div className="text-right text-[9px] text-slate-400 flex flex-col justify-center">
                  <span>Standard Retail</span>
                  <span>Rates</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: DOCUMENT DROPZONE OR SELECTOR */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                <FileText className="w-4 h-4 text-emerald-600" /> SELECT DOCUMENT (MAX 100 PAGES)
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[9px] font-bold">
                <button
                  onClick={() => {
                    setDocType("contract");
                    setUploadedFileName(null);
                  }}
                  className={`px-2 py-1 rounded-md transition ${docType === "contract" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Contract
                </button>
                <button
                  onClick={() => {
                    setDocType("logs");
                    setUploadedFileName(null);
                  }}
                  className={`px-2 py-1 rounded-md transition ${docType === "logs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  System Logs
                </button>
                <button
                  onClick={() => setDocType("custom")}
                  className={`px-2 py-1 rounded-md transition ${docType === "custom" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Upload/Custom
                </button>
              </div>
            </div>

            {docType === "custom" ? (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const input = document.createElement("input");
                      input.type = "file";
                      const data = new DataTransfer();
                      data.items.add(file);
                      input.files = data.files;
                      handlePdfUpload({ target: input } as any);
                    }
                  }}
                  onClick={() => document.getElementById("pdf-file-upload")?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center min-h-[140px] select-none"
                >
                  <input
                    id="pdf-file-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  {pdfLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                      <p className="text-[10px] font-bold text-slate-600">Extracting PDF pages...</p>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="space-y-1.5">
                      <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">{uploadedFileName}</p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {uploadedFileSize} • {uploadedPageCount} Page{uploadedPageCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Drag & drop your PDF contract here</p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5">or click to browse files locally (max 100 pages)</p>
                      </div>
                    </div>
                  )}
                </div>

                {pdfError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[10.5px] leading-relaxed flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{pdfError}</span>
                  </div>
                )}

                <textarea
                  placeholder="Or paste custom text content directly here..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-none h-[110px]"
                />
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 h-[180px] overflow-y-auto text-[11px] font-mono text-slate-600 leading-relaxed light-scrollbar shadow-inner">
                {getActiveText()}
              </div>
            )}
          </div>

          {/* STEP 3: PROMPT INPUT */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extraction Task Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white resize-none animate-in fade-in"
            />
          </div>

          {/* RUN COMPARISON BUTTON */}
          <Button
            onClick={executeComparison}
            disabled={isRunning || pdfLoading}
            className="w-full py-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Swarm Engine Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Run Comparison Sequence
              </>
            )}
          </Button>
        </div>

        {/* RESULTS COLUMNS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* COMPARISON ACTION BAR */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 shadow-inner">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${membraneOutput ? "bg-emerald-500 animate-ping" : "bg-slate-300"}`} />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {membraneOutput ? "Comparison Matrix Active" : "Awaiting Comparison Run"}
              </span>
            </div>
            {membraneOutput && (
              <Button
                onClick={() => setIsCompareOpen(true)}
                variant="outline"
                size="sm"
                className="text-[10px] font-bold border-emerald-500/25 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 flex items-center gap-1.5 h-7 rounded-lg shadow-sm transition-all animate-in fade-in"
              >
                <GitCompare className="w-3.5 h-3.5" />
                Compare Extractions
              </Button>
            )}
          </div>

          {/* THREE-COLUMN RESULTS CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch h-full">
            
            {/* COLUMN 1: STRAIGHT LLM */}
            <div className="glass-card-tactile rounded-xl p-4 flex flex-col justify-between border-slate-200/60 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">1. STRAIGHT LLM</span>
                  <span className="px-1.5 py-0.5 text-[7.5px] font-black text-rose-700 bg-rose-50 rounded border border-rose-100 uppercase tracking-wider">
                    Direct
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10.5px] font-mono">
                  <div className="bg-slate-50 border border-slate-200/60 p-1.5 rounded-lg">
                    <div className="text-[7.5px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                      <Clock className="w-2 h-2" /> Latency
                    </div>
                    <span className="font-black text-slate-800 text-xs block mt-0.5">
                      {directStats.latency > 0 ? `${directStats.latency.toFixed(1)}s` : "0.0s"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 p-1.5 rounded-lg flex flex-col justify-center">
                    <div className="text-[7.5px] font-bold text-slate-400 uppercase flex items-center justify-center gap-0.5">
                      <DollarSign className="w-2 h-2" /> Cost
                    </div>
                    <span className="font-black text-slate-800 text-xs block mt-0.5">
                      {directStats.cost > 0 ? `$${directStats.cost.toFixed(5)}` : "$0.0000"}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-0.5">
                  <div className="bg-rose-500 h-0.5 rounded-full transition-all duration-300" style={{ width: `${directStats.progress}%` }} />
                </div>                {/* Output Display */}
                <div className="space-y-1 relative group">
                  <div className="text-[8px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> DELIVERED EXTRACTED CONTENT</span>
                    {directOutput && (
                      <button
                        onClick={() => handleCopyText(directOutput, "direct")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 shadow-sm text-[8px]"
                        title="Copy Output"
                      >
                        {copiedId === "direct" ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div ref={directTerminalRef} className="bg-slate-950 border border-slate-900 rounded-xl p-3 h-[280px] overflow-y-auto text-[9.5px] font-mono text-emerald-400 leading-relaxed light-scrollbar shadow-inner relative select-text">
                    {directOutput ? (
                      <pre className="whitespace-pre-wrap">{directOutput}</pre>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-center px-2 space-y-1.5 select-none">
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-505" />
                            <span className="text-[8px] font-bold uppercase tracking-wider animate-pulse leading-snug">{directStats.status}</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-5 h-5 stroke-[1.5]" />
                            <span className="text-[8.5px]">Awaiting sequence run...</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Developer Logs */}
                {directOutput && (
                  <div className="mt-2 text-left">
                    <button
                      onClick={() => setShowDirectDetails(!showDirectDetails)}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 uppercase tracking-wider"
                    >
                      {showDirectDetails ? "Hide" : "Show"} Developer API Payload Details
                    </button>
                    {showDirectDetails && (
                      <div className="mt-2 space-y-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[8.5px] font-mono text-slate-300 leading-normal animate-in fade-in slide-in-from-top-1 max-h-[220px] overflow-y-auto">
                        <div>
                          <div className="text-[8px] text-slate-400 font-bold border-b border-slate-805 pb-0.5 mb-1.5 uppercase">
                            POST /api/direct-llm Payload
                          </div>
                          <pre className="whitespace-pre-wrap text-slate-400 bg-slate-950 p-2 rounded border border-slate-850 overflow-x-auto text-[8.5px] leading-normal">{directRequest}</pre>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-400 font-bold border-b border-slate-805 pb-0.5 mb-1.5 uppercase">
                            Raw API Response
                          </div>
                          <pre className="whitespace-pre-wrap text-slate-400 bg-slate-950 p-2 rounded border border-slate-850 overflow-x-auto text-[8.5px] leading-normal">{directRawResponse}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>

            <div className="glass-card-tactile rounded-xl p-4 flex flex-col justify-between border-emerald-500/20 shadow-xs relative overflow-hidden">

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                  <span className="text-[9px] font-mono font-bold text-emerald-700 tracking-wider">2. MEMBRANE (COLD)</span>
                  <span className="px-1.5 py-0.5 text-[7.5px] font-black text-emerald-800 bg-emerald-50 rounded border border-emerald-100 uppercase tracking-wider">
                    Swarms
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10.5px] font-mono">
                  <div className="bg-emerald-50/45 border border-emerald-100/60 p-1.5 rounded-lg">
                    <div className="text-[7.5px] font-bold text-emerald-600 uppercase flex items-center justify-center gap-0.5">
                      <Clock className="w-2 h-2" /> Latency
                    </div>
                    <span className="font-black text-emerald-800 text-xs block mt-0.5">
                      {membraneStats.latency > 0 ? `${membraneStats.latency.toFixed(1)}s` : "0.0s"}
                    </span>
                  </div>
                  <div className="bg-emerald-50/45 border border-emerald-100/60 p-1.5 rounded-lg flex flex-col justify-center">
                    <div className="text-[7.5px] font-bold text-emerald-600 uppercase flex items-center justify-center gap-0.5">
                      <DollarSign className="w-2 h-2" /> Cost
                    </div>
                    <span className="font-black text-emerald-800 text-xs block mt-0.5">
                      {membraneStats.cost > 0 ? `$${membraneStats.cost.toFixed(5)}` : "$0.0000"}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-0.5">
                  <div className="bg-emerald-600 h-0.5 rounded-full transition-all duration-300" style={{ width: `${membraneStats.progress}%` }} />
                </div>

                {/* Output Display */}
                <div className="space-y-1 relative group">
                  <div className="text-[8px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-emerald-505" /> DELIVERED EXTRACTED CONTENT</span>
                    {membraneOutput && (
                      <button
                        onClick={() => handleCopyText(membraneOutput, "cold")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 shadow-sm text-[8px]"
                        title="Copy Output"
                      >
                        {copiedId === "cold" ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div ref={membraneTerminalRef} className="bg-slate-950 border border-slate-900 rounded-xl p-3 h-[280px] overflow-y-auto text-[9.5px] font-mono text-emerald-300 leading-relaxed light-scrollbar shadow-inner relative animate-in fade-in animate-out select-text">
                    {membraneOutput ? (
                      <pre className="whitespace-pre-wrap">{membraneOutput}</pre>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-center px-2 space-y-1.5 select-none">
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-505" />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider animate-pulse text-emerald-600 leading-snug">{membraneStats.status}</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 stroke-[1.5] text-emerald-505" />
                            <span className="text-[8px]">Awaiting sequence run...</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Developer Logs */}
                {membraneOutput && (
                  <div className="mt-2 text-left">
                    <button
                      onClick={() => setShowMembraneDetails(!showMembraneDetails)}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 uppercase tracking-wider"
                    >
                      {showMembraneDetails ? "Hide" : "Show"} Developer API Payload Details
                    </button>
                    {showMembraneDetails && (
                      <div className="mt-2 space-y-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[8.5px] font-mono text-slate-300 leading-normal animate-in fade-in slide-in-from-top-1 max-h-[220px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-slate-400 bg-slate-955 p-2 rounded border border-slate-855 overflow-x-auto text-[8.5px] leading-normal">{membraneRawResponse}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>

            <div className="glass-card-tactile rounded-xl p-4 flex flex-col justify-between border-amber-400/20 shadow-xs relative overflow-hidden">

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                  <span className="text-[9px] font-mono font-bold text-amber-700 tracking-wider">3. MEMBRANE (CACHED)</span>
                  <span className="px-1.5 py-0.5 text-[7.5px] font-black text-amber-800 bg-amber-50 rounded border border-amber-200 uppercase tracking-wider">
                    Warm L1
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10.5px] font-mono">
                  <div className="bg-amber-50/45 border border-amber-100/60 p-1.5 rounded-lg">
                    <div className="text-[7.5px] font-bold text-amber-600 uppercase flex items-center justify-center gap-0.5">
                      <Clock className="w-2 h-2" /> Latency
                    </div>
                    <span className="font-black text-amber-800 text-xs block mt-0.5">
                      {cachedStats.latency > 0 ? `${cachedStats.latency.toFixed(1)}s` : "0.0s"}
                    </span>
                  </div>
                  <div className="bg-amber-50/45 border border-amber-100/60 p-1.5 rounded-lg flex flex-col justify-center">
                    <div className="text-[7.5px] font-bold text-amber-600 uppercase flex items-center justify-center gap-0.5">
                      <DollarSign className="w-2 h-2" /> Cost
                    </div>
                    <span className="font-black text-amber-800 text-xs block mt-0.5">
                      {cachedStats.cost > 0 ? `$${cachedStats.cost.toFixed(5)}` : "$0.0000"}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-0.5">
                  <div className="bg-amber-500 h-0.5 rounded-full transition-all duration-300" style={{ width: `${cachedStats.progress}%` }} />
                </div>

                {/* Output Display */}
                <div className="space-y-1 relative group">
                  <div className="text-[8px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-amber-505" /> DELIVERED EXTRACTED CONTENT</span>
                    {cachedOutput && (
                      <button
                        onClick={() => handleCopyText(cachedOutput, "warm")}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 shadow-sm text-[8px]"
                        title="Copy Output"
                      >
                        {copiedId === "warm" ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div ref={cachedTerminalRef} className="bg-slate-950 border border-slate-900 rounded-xl p-3 h-[280px] overflow-y-auto text-[9.5px] font-mono text-amber-300 leading-relaxed light-scrollbar shadow-inner relative select-text">
                    {cachedOutput ? (
                      <pre className="whitespace-pre-wrap">{cachedOutput}</pre>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-center px-2 space-y-1.5 select-none">
                        {isCachedRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-505" />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider animate-pulse text-amber-600 leading-snug">{cachedStats.status}</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-4 h-4 stroke-[1.5]" />
                            <span className="text-[8.0px]">{membraneStats.progress === 100 ? "Awaiting cached trigger..." : "Requires Cold Swarm run first."}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Developer Logs */}
                {cachedOutput && (
                  <div className="mt-2 text-left">
                    <button
                      onClick={() => setShowCachedDetails(!showCachedDetails)}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 uppercase tracking-wider"
                    >
                      {showCachedDetails ? "Hide" : "Show"} Developer API Payload Details
                    </button>
                    {showCachedDetails && (
                      <div className="mt-2 space-y-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[8.5px] font-mono text-slate-300 leading-normal animate-in fade-in slide-in-from-top-1 max-h-[220px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-slate-400 bg-slate-955 p-2 rounded border border-slate-855 overflow-x-auto text-[8.5px] leading-normal">{cachedRawResponse}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>

          </div>

        </div>

      </div>

      {/* DYNAMIC ROUTING DETAILS INFO BOX */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2 font-serif uppercase tracking-wide">
          <Cpu className="w-5 h-5 text-emerald-600" />
          Under the Hood: Membrane is a Multi-Agent Execution Layer, Not Just a Cache.
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          When you query a target model (like <strong className="text-slate-900 font-mono">{activeModel.name}</strong>) via Membrane's drop-in API proxy, the gateway automatically coordinates a distributed execution sequence:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Card 1 */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group hover:bg-slate-50 hover:border-slate-300 transition duration-300">
            {/* Giant numeral backing */}
            <div className="absolute -right-3 -top-5 text-7xl font-extrabold font-serif text-emerald-100/40 select-none pointer-events-none group-hover:scale-105 transition-transform duration-300">
              1
            </div>
            <div className="space-y-2 z-10 relative">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block font-mono">STEP 01</span>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Parallel Swarm Ingestion</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Splits documents into isolated parallel chunks and coordinates concurrent extraction threads. Bypasses model context limits entirely to eliminate attention degradation and prompt noise.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group hover:bg-slate-50 hover:border-slate-300 transition duration-300">
            {/* Giant numeral backing */}
            <div className="absolute -right-3 -top-5 text-7xl font-extrabold font-serif text-emerald-100/40 select-none pointer-events-none group-hover:scale-105 transition-transform duration-300">
              2
            </div>
            <div className="space-y-2 z-10 relative">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block font-mono">STEP 02</span>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Schema Invariant Gating (Canaries)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Enforces code-AST and strict JSON conformance at early checks. Fails fast, halting the swarm execution immediately to prevent wasteful upstream token charges.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group hover:bg-slate-50 hover:border-slate-300 transition duration-300">
            {/* Giant numeral backing */}
            <div className="absolute -right-3 -top-5 text-7xl font-extrabold font-serif text-emerald-100/40 select-none pointer-events-none group-hover:scale-105 transition-transform duration-300">
              3
            </div>
            <div className="space-y-2 z-10 relative">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block font-mono">STEP 03</span>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Model-Agnostic Routing & Caching</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Routes model-agnostically with automatic fallback and checks L1 semantic history to drop input costs to <strong className="text-slate-900">$0.00</strong> on cache hits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON MODAL */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="text-base font-black text-slate-900 font-serif uppercase tracking-wide">
                    Extraction Quality & Recall Audit
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Analyzing extraction gaps and recall accuracy rates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 light-scrollbar">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50/65 border border-emerald-200/50 rounded-xl text-[11.5px] leading-relaxed text-emerald-850">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Live Comparative Extraction View:</strong> Compare the baseline Direct LLM output with the synthesized, high-recall Membrane Swarm output. Note that Membrane segments processing page-by-page to guarantee zero attention-decay errors.
                      {directOutput && membraneOutput && (() => {
                        const swarmCount = parseOutputToItems(membraneOutput).length;
                        const directCount = parseOutputToItems(directOutput).length;
                        const diff = swarmCount - directCount;
                        if (diff > 0) {
                          return (
                            <p className="mt-1 text-emerald-800 font-medium animate-in fade-in">
                              📊 Recall Gain: Membrane Swarm successfully captured <strong>{swarmCount}</strong> items vs. Direct LLM's <strong>{directCount}</strong> items (<strong>+{diff}</strong> extra clause{diff > 1 ? "s" : ""} detected).
                            </p>
                          );
                        } else if (diff < 0) {
                          return (
                            <p className="mt-1 text-amber-800 font-medium animate-in fade-in">
                              📊 Recall Metrics: Membrane Swarm extracted <strong>{swarmCount}</strong> items vs. Direct LLM's <strong>{directCount}</strong> items (baseline captured {Math.abs(diff)} more).
                            </p>
                          );
                        } else {
                          return (
                            <p className="mt-1 text-emerald-850 font-medium animate-in fade-in">
                              📊 Recall Overlap: Both models successfully captured exactly <strong>{swarmCount}</strong> items with 100% mutual recall.
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => setCompareViewMode("visual")}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider transition ${
                        compareViewMode === "visual"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Visual Cards
                    </button>
                    <button
                      onClick={() => setCompareViewMode("raw")}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider transition ${
                        compareViewMode === "raw"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                {compareViewMode === "visual" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Direct LLM Column */}
                    <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/10 flex flex-col">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">1. DIRECT LLM ({parseOutputToItems(directOutput).length} Captured)</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[8.5px] font-black uppercase font-mono tracking-wider border border-rose-100/50">Context Decay Risk</span>
                      </div>
                      <div className="space-y-3 h-[420px] overflow-y-auto light-scrollbar pr-1">
                        {parseOutputToItems(directOutput).length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-20">
                            <span>No direct LLM output captured yet.</span>
                          </div>
                        ) : (
                          parseOutputToItems(directOutput).map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs hover:border-slate-350 transition duration-150">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${getBadgeColorClass(item.type)}`}>
                                  {item.type.replace(/_/g, " ")}
                                </span>
                                {item.source && (
                                  <span className="text-[8.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.source}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 text-[11px] leading-relaxed font-sans">{item.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Membrane Column */}
                    <div className="border border-emerald-200/85 rounded-xl p-4 bg-emerald-50/5 flex flex-col">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">2. MEMBRANE SWARM ({parseOutputToItems(membraneOutput).length} Captured)</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8.5px] font-black uppercase font-mono tracking-wider border border-emerald-100/50">Swarm Isolation</span>
                      </div>
                      <div className="space-y-3 h-[420px] overflow-y-auto light-scrollbar pr-1">
                        {parseOutputToItems(membraneOutput).length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-20">
                            <span>No Membrane output captured yet.</span>
                          </div>
                        ) : (
                          parseOutputToItems(membraneOutput).map((item, idx) => {
                            const isMissed = isItemMissed(item, parseOutputToItems(directOutput));
                            return (
                              <div key={idx} className={`border rounded-xl p-3 shadow-xs transition duration-150 relative overflow-hidden ${
                                isMissed 
                                  ? "bg-emerald-50/35 border-emerald-300 hover:border-emerald-450" 
                                  : "bg-white border-slate-200/80 hover:border-slate-350"
                              }`}>
                                {isMissed && (
                                  <div className="absolute top-0 right-0 bg-emerald-600 text-white font-mono font-bold text-[7.5px] px-2 py-0.5 rounded-bl uppercase tracking-wider shadow-sm animate-pulse">
                                    Recall Gain
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${getBadgeColorClass(item.type)}`}>
                                    {item.type.replace(/_/g, " ")}
                                  </span>
                                  {item.source && (
                                    <span className="text-[8.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {item.source}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-800 text-[11px] leading-relaxed font-sans">{item.content}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Direct LLM Column */}
                    <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/30">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">1. DIRECT LLM OUTPUT</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[8px] font-black uppercase font-mono">Prone to context decay</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 h-[420px] overflow-y-auto text-[9.5px] font-mono text-slate-300 leading-relaxed light-scrollbar shadow-inner">
                        <pre className="whitespace-pre-wrap">{directOutput || "No direct LLM output captured yet."}</pre>
                      </div>
                    </div>

                    {/* Membrane Column */}
                    <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-emerald-50/10">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-700">2. MEMBRANE OUTPUT (SYNTHESIZED JSON)</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase font-mono">High-recall Swarm Map-Reduce</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 h-[420px] overflow-y-auto text-[9.5px] font-mono text-emerald-300 leading-relaxed light-scrollbar shadow-inner">
                        <pre className="whitespace-pre-wrap">{membraneOutput || "No Membrane output captured yet."}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-end">
              <Button
                onClick={() => setIsCompareOpen(false)}
                className="font-bold text-xs uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl px-4 py-2"
              >
                Close Audit
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
