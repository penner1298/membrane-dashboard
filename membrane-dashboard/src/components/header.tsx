"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn } = useAuth(); 

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2 w-[200px]">
        <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-green-600 rounded-md">
          M
        </div>
        <span className="text-xl font-bold">Membrane</span>
      </div>
      
      {/* CENTER: Navigation Links (Now perfectly centered!) */}
      <nav className="hidden gap-8 md:flex text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
      </nav>

      {/* RIGHT: Auth Buttons */}
      <div className="flex items-center justify-end gap-4 w-[200px]">
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard" asChild>
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard" asChild>
              <Button className="bg-green-600 text-white hover:bg-green-700">Get Started</Button>
            </SignUpButton>
          </>
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </>
        )}
      </div>
    </header>
  );
}