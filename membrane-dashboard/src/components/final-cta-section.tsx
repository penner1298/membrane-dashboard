"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-24 border-t border-slate-800 bg-slate-900 text-white">
      <div className="max-w-4xl px-6 mx-auto text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Scale Your Autonomous Swarms Today
        </h2>
        <p className="mb-10 text-lg text-slate-400">
          Deploy the Membrane local container or orchestrate your staging environment in under 5 minutes.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white sm:w-auto h-12 px-8" asChild>
            <Link href="/dashboard" className="flex items-center justify-center">
              Launch Sandbox Console <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" asChild>
            <a href="https://polar.sh/penner1298" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              Sponsor on Polar <span className="text-emerald-400">★</span>
            </a>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mt-12 sm:flex-row text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Zero-dependency local setup</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Cryptographic handoff enforcer</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Developer-first sponsorware model</span>
          </div>
        </div>
      </div>
    </section>
  );
}