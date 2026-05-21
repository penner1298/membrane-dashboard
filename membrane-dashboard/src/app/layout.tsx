import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Membrane | The Lossless Inter-Agent Protocol",
  description: "Membrane is a drop-in inter-agent routing layer and guard sandbox that uses semantic caching and structural validation to securely scale autonomous swarms.",
  keywords: "LLM routing, inter-agent protocol, A2A proxy, semantic caching, agent sandbox, agent-to-agent communication",
  openGraph: {
    title: "Membrane | The Lossless Inter-Agent Protocol",
    description: "Membrane is a drop-in inter-agent routing layer and guard sandbox that uses semantic caching and structural validation to securely scale autonomous swarms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Membrane | The Lossless Inter-Agent Protocol",
    description: "Membrane is a drop-in inter-agent routing layer and guard sandbox that uses semantic caching and structural validation to securely scale autonomous swarms.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}