import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeBearerToken(token: string): string {
  if (!token) return "";
  let clean = String(token).trim();
  // Strip duplicate 'Bearer ' prefixes (case-insensitive)
  clean = clean.replace(/^(bearer\s+)+/i, "");
  // Strip outer quotes
  clean = clean.replace(/^['"“‘]+|['"”’]+$/g, "");
  return clean.trim();
}

