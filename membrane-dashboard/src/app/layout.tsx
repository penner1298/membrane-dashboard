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
  title: "Membrane | Proxy & Swarm Ingestion Engine",
  description: "Membrane is an open-core proxy and swarm parallel ingestion engine offering semantic caching and structured schema extraction.",
  keywords: "LLM proxy, swarm ingestion, semantic caching, agent sandbox, structured extraction",
  openGraph: {
    title: "Membrane | Proxy & Swarm Ingestion Engine",
    description: "Membrane is an open-core proxy and swarm parallel ingestion engine offering semantic caching and structured schema extraction.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Membrane | Proxy & Swarm Ingestion Engine",
    description: "Membrane is an open-core proxy and swarm parallel ingestion engine offering semantic caching and structured schema extraction.",
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