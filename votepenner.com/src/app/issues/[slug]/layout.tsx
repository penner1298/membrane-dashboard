import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  
  // Try to load local issues.json for dynamic metadata
  try {
    const issuesPath = path.join(process.cwd(), 'src', 'data', 'issues.json');
    const issuesData = fs.readFileSync(issuesPath, 'utf8');
    const issues = JSON.parse(issuesData);
    const issue = issues.find((i: any) => i.slug === resolvedParams.slug);

    if (issue) {
      const liveUrl = `https://www.votepenner.com${issue.heroImage}`;
      
      return {
        title: `${issue.title} | Rep. Josh Penner`,
        description: issue.summary || issue.anchorQuote,
        openGraph: {
          title: `${issue.title} | Rep. Josh Penner`,
          description: issue.summary || issue.anchorQuote,
          images: [
            {
              url: liveUrl,
              width: 1200,
              height: 630,
              alt: issue.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${issue.title} | Rep. Josh Penner`,
          description: issue.summary || issue.anchorQuote,
          images: [liveUrl],
        },
      };
    }
  } catch (e) {
    console.error("Error generating metadata", e);
  }

  return {
    title: 'Issue | Rep. Josh Penner',
  };
}

export default function IssueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
