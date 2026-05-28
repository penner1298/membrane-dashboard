import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ApiKeyProvider } from "@/context/ApiKeyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Membrane | Reliable Structured LLM Extraction at Scale",
  description: "Split large documents, logs, and contracts into isolated chunks, run extraction in parallel with early validation and cost forecasting, and reduce results through a drop-in OpenAI-compatible endpoint.",
  keywords: "LLM extraction, swarm map-reduce, semantic caching, developer proxy, OpenAI compatible, document chunking, cost forecasting",
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}>
        <ApiKeyProvider>
          {children}
        </ApiKeyProvider>
      </body>
    </html>
  );
}