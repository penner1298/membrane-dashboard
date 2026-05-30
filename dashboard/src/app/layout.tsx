import type { Metadata } from "next";
import "./globals.css";
import { ApiKeyProvider } from "@/context/ApiKeyContext";

export const metadata: Metadata = {
  title: "Membrane | Reliable Structured LLM Extraction at Scale",
  description: "Split large documents, logs, and contracts into isolated chunks, run extraction in parallel with early validation and cost forecasting, and reduce results through a drop-in OpenAI-compatible endpoint.",
  keywords: "LLM extraction, swarm map-reduce, semantic caching, developer proxy, OpenAI compatible, document chunking, cost forecasting, canary llm, early gate llm, swarm plan forecasting, self host openai proxy, chunk isolation llm, llm cost reduction long documents",
  openGraph: {
    title: "Membrane | Reliable Structured LLM Extraction at Scale",
    description: "Split large documents, logs, and contracts into isolated chunks, run extraction in parallel with early validation and cost forecasting, and reduce results through a drop-in OpenAI-compatible endpoint.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Membrane | Reliable Structured LLM Extraction at Scale",
    description: "Split large documents, logs, and contracts into isolated chunks, run extraction in parallel with early validation and cost forecasting, and reduce results through a drop-in OpenAI-compatible endpoint.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ApiKeyProvider>
          {children}
        </ApiKeyProvider>
      </body>
    </html>
  );
}
