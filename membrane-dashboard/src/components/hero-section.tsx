"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";

export function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />
      </div>
      
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
          Get $50 credit to start
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
          Scale Your AI Agents Without the Insane API Bills.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-gray-500 md:text-xl">
          Membrane is the intelligent routing and caching layer that guarantees 100% reliability for your chatbots while cutting OpenAI/Anthropic costs by up to 90%.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          
          {/* SMART BUTTON LOGIC */}
          {!isSignedIn ? (
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard" asChild>
              <Button size="lg" className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto h-12 px-8">
                <span className="flex items-center justify-center">
                  Claim Your $50 Credit <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </SignUpButton>
          ) : (
            <Button size="lg" className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto h-12 px-8" asChild>
              <Link href="/dashboard">
                <span className="flex items-center justify-center">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
          )}
          
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8" asChild>
            <Link href="/docs">View Documentation</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          $50 credit included • 5-minute setup
        </p>
      </div>
    </section>
  );
}