"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32 bg-slate-950 text-white">
      {/* Dynamic glow backgrounds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" />
      </div>
      
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Dynamic Glowing Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-sm text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          The Cloudflare for AI Swarms
        </div>

        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl leading-none">
          Secure, Lossless Protocol for <br/>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Agent-to-Agent Swarms
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-pretty text-lg text-slate-400 md:text-xl leading-relaxed">
          Membrane Guard is a localized sandbox proxy and inter-agent communication ledger. 
          Bypass OpenAI/Gemini latency using sub-2ms local exact-match caches, enforce cryptographic 
          state compile checks, and secure multi-agent chains with a cognitive threat firewall.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white sm:w-auto h-12 px-8 font-medium shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5" asChild>
            <Link href="/dashboard" className="flex items-center justify-center">
              Launch Console <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white hover:text-white transition-all" asChild>
            <a href="https://github.com/penner1298/membrane-dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Deploy Local Container
            </a>
          </Button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Sponsorware via Polar.sh • 100% Login-Free Sandbox Console
        </p>
      </div>
    </section>
  );
}