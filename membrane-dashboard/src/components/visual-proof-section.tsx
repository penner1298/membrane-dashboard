"use client"

import { ArrowDown, ArrowRight, Zap } from "lucide-react"

export function VisualProofSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold text-gray-900 md:text-4xl">
            See the difference instantly
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">
            Real savings from real developers using Membrane in production.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Cost Comparison Visual */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">Cost Comparison</h3>
            
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Without Membrane</span>
                  <span className="font-mono text-gray-900">$1,247.00</span>
                </div>
                <div className="h-4 rounded-full bg-red-100">
                  <div className="h-4 w-full rounded-full bg-red-500" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">With Membrane</span>
                  <span className="font-mono text-green-600 font-bold">$127.32</span>
                </div>
                <div className="h-4 rounded-full bg-green-100">
                  <div className="h-4 w-[10%] rounded-full bg-green-500" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-4">
                <ArrowDown className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">89.8% savings</span>
              </div>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">How It Works</h3>
            
            <div className="flex flex-col items-center gap-4">
              {/* Your App */}
              <div className="flex w-full max-w-xs items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
                <span className="font-medium text-gray-900">Your App</span>
              </div>
              
              <ArrowRight className="h-6 w-6 rotate-90 text-gray-400" />
              
              {/* Membrane */}
              <div className="relative flex w-full max-w-xs items-center justify-center rounded-lg border-2 border-green-500 bg-green-50 px-6 py-4">
                <Zap className="mr-2 h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">Membrane</span>
                <div className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                  Smart Routing
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 rotate-90 text-gray-400" />
              
              {/* Models */}
              <div className="grid w-full max-w-xs grid-cols-3 gap-2">
                <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-500">GPT-4</span>
                </div>
                <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-500">Claude</span>
                </div>
                <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <span className="text-xs font-medium text-gray-500">Gemini</span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Membrane intelligently routes requests to the optimal model based on complexity and cost.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}