"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ textToCopy, className }: { textToCopy: string, className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center justify-center transition-colors ${className}`}
      title="Copy to clipboard"
      type="button"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      <span className="ml-2">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}