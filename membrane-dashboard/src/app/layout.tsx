import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
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
  title: "Membrane | The Intelligent AI Routing Layer",
  description: "Membrane is a drop-in API proxy that uses cognitive telemetry to instantly route your prompts to the cheapest model capable of solving them. Reduce LLM costs by 90% without sacrificing reasoning quality.",
  keywords: "LLM routing, AI proxy, OpenAI alternative, Gemini proxy, reduce API costs, LLM load balancer, cognitive telemetry",
  openGraph: {
    title: "Membrane | The Intelligent AI Routing Layer",
    description: "Membrane is a drop-in API proxy that uses cognitive telemetry to instantly route your prompts to the cheapest model capable of solving them.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Membrane | The Intelligent AI Routing Layer",
    description: "Membrane is a drop-in API proxy that uses cognitive telemetry to instantly route your prompts to the cheapest model capable of solving them.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}