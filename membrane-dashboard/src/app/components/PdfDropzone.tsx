"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfJsLib {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (params: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNum: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
}

// Helper to chunk text paragraphs/lines to fit token constraints
export const chunkStringContent = (text: string, maxChunkSize: number = 2000): string[] => {
  if (!text) return [];
  const paragraphs = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n" : "") + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      if (trimmedPara.length > maxChunkSize) {
        // Chunk paragraph by character if it's too long
        let tempPara = trimmedPara;
        while (tempPara.length > 0) {
          chunks.push(tempPara.slice(0, maxChunkSize));
          tempPara = tempPara.slice(maxChunkSize);
        }
        currentChunk = "";
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
};

interface PdfDropzoneProps {
  onTextExtracted: (chunks: string[], fileName: string) => void;
  isProcessing: boolean;
  setIsProcessing: (p: boolean) => void;
}

export function PdfDropzone({ onTextExtracted, isProcessing, setIsProcessing }: PdfDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF.js dynamically from CDN to keep initial client bundles small and fast
  const loadPdfJs = async (): Promise<PdfJsLib> => {
    const win = window as unknown as { pdfjsLib?: PdfJsLib };
    if (win.pdfjsLib) {
      return win.pdfjsLib;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = win.pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(pdfjsLib);
        } else {
          reject(new Error("PDF.js loaded but pdfjsLib is not defined on window."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF processing engine. Check connection."));
      document.head.appendChild(script);
    });
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please drop a valid PDF document.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setFileName(file.name);
    
    // Format file size
    const sizeInKb = file.size / 1024;
    setFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb.toFixed(0)} KB`);
    
    setProgressMsg("Loading PDF engine...");

    try {
      const pdfjsLib = await loadPdfJs();
      setProgressMsg("Reading PDF binary...");
      const arrayBuffer = await file.arrayBuffer();
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgressMsg(`Extracting page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: { str: string }) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      setProgressMsg("Slicing text content into discrete chunks...");
      const chunks = chunkStringContent(fullText, 2000);
      
      setProgressMsg("Extraction complete!");
      onTextExtracted(chunks, file.name);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to parse PDF document.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] bg-slate-50/50 hover:bg-slate-50/80 hover:border-emerald-500/50 hover:shadow-sm select-none",
          isDragActive ? "border-emerald-500 bg-emerald-50/20 scale-[1.01]" : "border-slate-200"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-3 animate-pulse">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-700">{progressMsg}</div>
            {fileName && (
              <div className="text-[10px] text-slate-400 max-w-xs truncate mx-auto font-mono">
                {fileName} ({fileSize})
              </div>
            )}
          </div>
        ) : fileName && !error ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
              {fileName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-2">
              <span>{fileSize}</span>
              <span className="w-1.5 h-1.5 bg-slate-350 rounded-full" />
              <span>{pageCount} Page{pageCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="text-[10.5px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded inline-block">
              Click or drag another to replace
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200/60 rounded-full flex items-center justify-center mx-auto text-slate-500">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Drag & drop your contract PDF here</p>
              <p className="text-[10.5px] text-slate-400 mt-1">or click to browse files locally</p>
            </div>
            <p className="text-[9.5px] text-slate-500 font-serif italic max-w-xs mx-auto">
              Processes text completely in the browser memory for high privacy compliance.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Extraction Error</p>
            <p className="text-[10.5px] mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
