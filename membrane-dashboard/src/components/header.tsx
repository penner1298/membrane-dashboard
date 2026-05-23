"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2 w-[220px]">
        <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-emerald-600 rounded-md">
          M
        </div>
        <span className="text-xl font-bold">Membrane Guard</span>
      </div>
      
      {/* CENTER: Navigation Links */}
      <nav className="hidden gap-8 md:flex text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <Link href="/console" className="hover:text-foreground transition-colors">Console</Link>
      </nav>

      {/* RIGHT: GitHub, Polar & Dashboard Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <a href="https://github.com/thejoshuapenner/membrane-dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Star
          </a>
        </Button>

        <Button variant="outline" asChild className="border-emerald-600/30 hover:border-emerald-600/60 text-emerald-600 hover:bg-emerald-950/20">
          <a href="https://buy.polar.sh/polar_cl_xD35VJkFTyba3qNO9q8D5WZ8pemoyiMxVsEyp3xAnbu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <span className="text-emerald-500">★</span> Sponsor
          </a>
        </Button>
        
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700" asChild>
          <Link href="/console">Console</Link>
        </Button>
      </div>
    </header>
  );
}