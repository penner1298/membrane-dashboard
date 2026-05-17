import type { Metadata } from "next";

import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Tenant Pulse | Commercial Real Estate Lease Scanner",
  description: "Upload any commercial lease (NNN, Gross, Retail) and instantly expose hidden CAM traps, personal guarantees, and predatory clauses. Tenant Pulse uses advanced AI to rewrite bad clauses into fair, industry-standard terms. Zero-retention. 100% private.",
  keywords: "commercial lease scanner, AI lease reviewer, tenant representation, NNN lease, gross lease, commercial real estate AI, CAM reconciliation, personal guarantees",
  openGraph: {
    title: "Tenant Pulse | Commercial Real Estate Lease Scanner",
    description: "Instantly expose hidden traps in any commercial lease. Generate fair, plain-English pushback clauses in seconds.",
    url: "https://tenant-pulse.com",
    siteName: "Tenant Pulse",
    
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tenant Pulse | Commercial Real Estate Lease Scanner",
    description: "Upload any commercial lease and instantly expose hidden risks. Never sign a bad lease again.",
    
    creator: "@TenantPulse",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
        <GoogleAnalytics gaId="G-PM10JJF4EZ" />
      </html>
    </>
  );
}
