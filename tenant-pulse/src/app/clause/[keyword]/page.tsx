import fs from 'fs';
import path from 'path';
import ClauseClient from './ClauseClient';
import { Metadata } from 'next';

// 1. DYNAMIC SEO METADATA
export async function generateMetadata({ params }: { params: { keyword: string } }): Promise<Metadata> {
  const decodedKeyword = decodeURIComponent(params.keyword).replace(/-/g, ' ');
  const titleWord = decodedKeyword.charAt(0).toUpperCase() + decodedKeyword.slice(1);
  
  const filePath = path.join(process.cwd(), 'src', 'content', 'clauses', `${params.keyword.toLowerCase()}.json`);
  let description = `Instantly expose predatory ${titleWord} clauses. Tenant Pulse translates legal jargon into plain English and drafts pushback emails.`;
  let title = `What is a ${titleWord} Clause? (Hidden Risks) | Tenant Pulse`;
  let ogTitle = `Predatory ${titleWord} Clauses Exposed | Tenant Pulse`;

  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const seoData = JSON.parse(fileContents);
      if (seoData.gotcha_text) {
         description = seoData.gotcha_text;
      }
      if (seoData.title) {
         title = `${seoData.title} | Tenant Pulse`;
         ogTitle = seoData.title;
      }
    }
  } catch (e) {
    console.error("Error reading SEO JSON for metadata:", e);
  }

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
    }
  };
}

export default function ClauseAnalysisPage({ params }: { params: { keyword: string } }) {
  const decodedKeyword = decodeURIComponent(params.keyword).replace(/-/g, ' ');
  const titleWord = decodedKeyword.charAt(0).toUpperCase() + decodedKeyword.slice(1);
  
  const filePath = path.join(process.cwd(), 'src', 'content', 'clauses', `${params.keyword.toLowerCase()}.json`);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let seoData: any = {
    title: `Instantly expose predatory ${titleWord} clauses.`,
    gotcha_title: "Hidden Liability",
    gotcha_text: `Predatory clauses often use aggressive phrasing to bankrupt commercial tenants. This specific ${titleWord} clause reflects a higher risk profile than market averages.`,
    fix_title: "AI Negotiation",
    fix_text: `Tenant Pulse translates this clause into plain English and drafts a polite, firm pushback email that protects your assets instantly.`,
    deep_dive_html: `<p>Tenant Pulse has analyzed thousands of similar agreements. While "${titleWord}" is standard, the specific phrasing here often shifts 100% of the liability onto the signee without a reciprocal cap. You may be signing away your safety net.</p>`
  };

  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileContents);
      seoData = { ...seoData, ...parsedData };
    }
  } catch (e) {
    console.error("Error reading SEO JSON:", e);
  }

  return <ClauseClient titleWord={titleWord} seoData={seoData} />;
}

// SSG function to pre-render the pages at build time
export async function generateStaticParams() {
  try {
    const clausesDir = path.join(process.cwd(), 'src', 'content', 'clauses');
    if (!fs.existsSync(clausesDir)) return [];
    
    const files = fs.readdirSync(clausesDir);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        keyword: file.replace('.json', '')
      }));
  } catch {
    return [];
  }
}
