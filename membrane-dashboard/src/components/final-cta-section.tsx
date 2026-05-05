"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";

export function FinalCTASection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="py-24 border-t border-gray-200 bg-gray-50/50">
      <div className="max-w-4xl px-6 mx-auto text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Ready to scale your AI?
        </h2>
        <p className="mb-10 text-lg text-gray-500">
          Join hundreds of developers building faster, cheaper, and more reliable AI agents.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          
          {!isSignedIn ? (
            <SignUpButton forceRedirectUrl="/dashboard" asChild>
              <Button size="lg" className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto h-12 px-8">
                {/* 👇 The protective span saves the app from crashing! */}
                <span className="flex items-center justify-center">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              </Button>
            </SignUpButton>
          ) : (
            <Button size="lg" className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto h-12 px-8" asChild>
              <Link href="/dashboard" className="flex items-center justify-center">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
          
          <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8" asChild>
            <Link href="/docs">View Documentation</Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mt-10 sm:flex-row text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>$50 credit included</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>5-minute setup</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}