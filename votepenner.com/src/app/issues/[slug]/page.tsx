import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AccountabilityMatrix from './AccountabilityMatrix';

export async function generateStaticParams() {
  const issuesPath = path.join(process.cwd(), 'src', 'data', 'issues.json');
  try {
    const issuesData = fs.readFileSync(issuesPath, 'utf8');
    const issues = JSON.parse(issuesData);
    return issues.map((issue: any) => ({
      slug: issue.slug,
    }));
  } catch (e) {
    return [];
  }
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  let issues = [];
  try {
    const issuesPath = path.join(process.cwd(), 'src', 'data', 'issues.json');
    const issuesData = fs.readFileSync(issuesPath, 'utf8');
    issues = JSON.parse(issuesData);
  } catch (e) {
    console.error("Failed to load issues.json", e);
    return notFound();
  }
  
  const issue = issues.find((i: any) => i.slug === resolvedParams.slug);
  if (!issue) return notFound();

  let relatedIssues = issues.filter((i: any) => i.slug !== issue.slug).slice(0, 2);

  return (
    <>
      <div className="noise-overlay"></div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-nav border-b border-brand-navy/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              {/* Brand Logo - Links to root */}
              <a href="/" className="sign-logo-container scale-90 md:scale-100 hover:opacity-90 transition cursor-pointer">
                  <div className="font-serif font-bold text-2xl text-brand-navy leading-none tracking-tight">Josh Penner</div>
                  <div className="sign-line"></div>
                  <div className="font-display font-bold text-[0.65rem] tracking-[0.2em] uppercase mt-0.5">
                      <span className="text-brand-red">For Representative</span> <span className="text-brand-gold ml-1">R</span>
                  </div>
              </a>

              <div className="hidden md:flex items-center gap-10 font-display font-semibold text-[13px] tracking-wide text-brand-navy">
                  <a href="/" className="hover:text-brand-red transition-colors">&larr; Return to Ledger</a>
              </div>
          </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-48 pb-20 relative z-10">
          
          {/* Micro-Targeting Tags */}
          <div className="flex flex-wrap gap-3 mb-8">
              <span className="inline-flex items-center px-4 py-1.5 glass-panel rounded-full font-display font-bold text-[10px] uppercase tracking-widest shadow-sm text-brand-navy">
                <span className="w-2 h-2 rounded-full bg-brand-gold mr-2"></span>
                Pillar: Accountability
              </span>
              <span className="inline-flex items-center px-4 py-1.5 bg-white rounded-full text-brand-red font-display font-bold text-[10px] uppercase tracking-widest shadow-sm border border-red-100">
                Target: State Overreach
              </span>
          </div>

          {/* Interceptor Headline */}
          <h1 className="font-serif text-5xl md:text-6xl font-black text-brand-navy leading-[1.05] mb-6 drop-shadow-sm">
              {issue.title}
          </h1>

          {/* The Ironclad Receipt (Photo/Quote Block) */}
          <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-glow-navy border border-white/20 mb-16 relative group tilt-card flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent mix-blend-multiply z-10 pointer-events-none"></div>
              <div className="absolute inset-0 z-0">
                  <img src={issue.heroImage || "/images/leg_photos/20260228_151920cr-(ZF-1674-31330-1-027).jpg"} alt="Representative Joshua Penner" className="w-full h-full object-cover object-[center_15%] opacity-60 mix-blend-luminosity grayscale contrast-125" />
              </div>
              
              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-20 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse shadow-[0_0_8px_#C1332E]"></span>
                  <span className="text-white font-display font-bold text-[10px] uppercase tracking-widest">Verified Quote</span>
              </div>
              
              {/* Overlay Quote */}
              <div className="relative z-20 p-8 md:p-12 w-full md:w-4/5">
                <div className="text-brand-gold text-5xl font-serif leading-none mb-[-1rem]">&ldquo;</div>
                <p className="text-2xl md:text-3xl text-white font-serif font-bold italic leading-snug drop-shadow-lg relative z-20">
                  {issue.anchorQuote}
                </p>
              </div>
          </div>

          {/* Link to actual video source */}
          {issue.youtubeUrl && (
            <div className="mb-16 -mt-8 flex justify-end">
                <a href={issue.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-navy font-display font-bold text-sm uppercase tracking-widest hover:text-brand-red transition-colors group">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                    Watch the Full Floor Speech
                    <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </a>
            </div>
          )}

          {/* The "Fallout" Narrative */}
          <div className="prose prose-lg md:prose-xl prose-slate max-w-none font-display mb-20 leading-relaxed text-slate-700">
              <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                      h2: ({node, ...props}) => <h2 className="font-serif text-3xl md:text-4xl font-black text-brand-navy mt-16 mb-6 tracking-tight leading-tight flex items-center gap-4" {...props} />,
                      h3: ({node, ...props}) => <h3 className="font-serif text-3xl md:text-4xl font-black text-brand-navy mt-16 mb-6 tracking-tight leading-tight flex items-center gap-4"><span className="w-8 h-1 bg-brand-gold rounded-full flex-shrink-0"></span>{props.children}</h3>,
                      p: ({node, ...props}) => <p className="mb-6" {...props} />,
                      a: ({node, ...props}) => <a className="text-brand-red font-bold hover:underline break-words" target="_blank" rel="noopener noreferrer" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                      blockquote: ({node, ...props}) => (
                          <blockquote className="my-8 border-l-4 border-brand-gold pl-6 py-2 bg-slate-50 italic text-brand-navy rounded-r-lg font-serif">
                              {props.children}
                          </blockquote>
                      ),
                  }}
              >
                  {issue.content}
              </ReactMarkdown>

              {/* Inline image if available */}
              {issue.inline_image_url && (
                  <div className="my-16 w-full rounded-[2rem] overflow-hidden shadow-skeuo-card border-[6px] border-white relative tilt-card">
                      <div className="absolute inset-0 bg-brand-navy/10 mix-blend-multiply z-10 pointer-events-none"></div>
                      <img src={issue.inline_image_url} alt="Legislative Work" className="w-full h-auto max-h-[500px] object-cover object-center relative z-0" />
                  </div>
              )}
          </div>

          {/* The Micro-Targeted Hard Catch (Donation) */}
          <div className="p-12 btn-skeuo-navy rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-glow-navy relative overflow-hidden border border-brand-navy/50 mb-10 tilt-card">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
              <div className="relative z-10 text-center md:text-left">
                  <h3 className="text-white font-serif font-black text-3xl mb-3 drop-shadow-md">Join The Fight For Accountability</h3>
                  <p className="text-white/80 font-display text-base font-medium">Help us hold the line against bad policy and runaway spending.</p>
              </div>
              <a href="https://www.efundraisingconnections.com/c/JoshPenner" target="_blank" rel="noopener noreferrer" className="tilt-btn btn-skeuo-red text-white font-display font-black px-10 py-5 rounded-full shadow-skeuo-btn hover:shadow-glow-red transition-all duration-300 whitespace-nowrap relative z-10 tracking-wide text-lg">
                Support the Fight
              </a>
          </div>
      </main>

      {/* NEW: Related Issues / Semantic Cluster Footer */}
      {relatedIssues.length > 0 && (
        <section className="px-6 pb-20 relative z-10">
            <div className="max-w-4xl mx-auto border-t border-brand-navy/10 pt-16">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-serif italic text-lg shadow-md">P</div>
                    <h3 className="font-serif font-bold text-2xl text-brand-navy">Explore More from the Ledger</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedIssues.map((relIssue: any, idx: number) => (
                        <a 
                            key={idx} 
                            href={`/issues/${relIssue.slug}`} 
                            className="glass-panel p-8 rounded-[2rem] border border-white/80 shadow-sm hover:shadow-skeuo-card transition-all duration-300 group flex flex-col justify-between"
                        >
                            <div>
                                <h4 className="font-serif font-bold text-xl text-brand-navy leading-tight mb-2 group-hover:text-brand-red transition-colors">
                                    {relIssue.title}
                                </h4>
                                <p className="text-slate-500 font-display text-sm leading-relaxed mb-6 line-clamp-3">
                                    {relIssue.summary || relIssue.anchorQuote}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-brand-red font-display font-bold text-xs uppercase tracking-widest">
                                Read Full Analysis
                                <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Accountability Matrix Injection */}
      <AccountabilityMatrix />

      {/* Embedded Newsletter Opt-In (From Index) */}
      <section className="px-6 py-24 relative z-10 bg-brand-navy/5 border-t border-brand-navy/10">
          <div className="max-w-4xl mx-auto">
              <div className="glass-panel p-12 rounded-[3rem] shadow-glow-navy border border-white relative overflow-hidden text-center md:text-left">
                  <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="inline-flex items-center px-4 py-1.5 bg-white/50 rounded-full text-brand-navy font-display font-bold text-[10px] uppercase tracking-widest mb-6 border border-white">Stay Informed</div>
                  
                  <h2 className="font-serif text-4xl md:text-5xl font-black text-brand-navy mb-4 leading-tight drop-shadow-sm">Join The Executive Briefing</h2>
                  <p className="text-slate-600 text-lg md:text-xl font-display font-medium leading-relaxed mb-10 max-w-2xl">
                      Get direct, unfiltered updates on what's actually happening in Olympia. No campaign spin—just the raw data and our fight for accountability.
                  </p>
                  
                  <form className="flex flex-col md:flex-row gap-4 max-w-2xl">
                      <input type="email" placeholder="Enter your email address..." className="flex-1 px-8 py-5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-full focus:outline-none focus:border-brand-navy focus:bg-white focus:ring-4 focus:ring-brand-navy/10 font-display font-medium transition-all shadow-inner" required />
                      <button type="submit" className="tilt-btn btn-skeuo-red text-white font-display font-black px-10 py-5 rounded-full shadow-skeuo-btn hover:shadow-glow-red transition-all duration-300 whitespace-nowrap">Subscribe</button>
                  </form>
                  <p className="text-xs text-slate-500 mt-6 font-display font-medium">Your information is securely processed via Beehiiv and never shared.</p>
              </div>
          </div>
      </section>

      {/* Footer / Required Disclosures */}
      <footer className="bg-brand-navy text-white pt-24 pb-12 px-6 relative z-10 border-t-[6px] border-brand-gold shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDE1Ii8+CjxwYXRoIGQ9Ik0wIDBMODggOFpNMCA4TDggMFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-16 relative z-10">
              <div className="text-center md:text-left">
                  <div className="sign-logo-container mb-10 mx-auto md:mx-0">
                      <div className="font-serif font-black text-3xl text-white leading-none tracking-tight">Josh Penner</div>
                      <div className="sign-line bg-gradient-to-r from-brand-gold to-[#e8c97e] w-full h-[3px] my-3"></div>
                      <div className="font-display font-bold text-xs tracking-[0.25em] uppercase">
                          <span className="text-brand-red brightness-125">For Representative</span> <span className="text-brand-gold ml-1">R</span>
                      </div>
                  </div>
                  
                  <div className="p-6 rounded-[1.5rem] border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-bold text-white/90 font-display tracking-[0.1em] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] inline-block">
                      PAID FOR BY VOTE PENNER (R)<br/>
                      PO BOX 664, ORTING, WA 98360
                  </div>
              </div>
              
              <div className="text-center md:text-right flex flex-col items-center md:items-end">
                  <p className="text-white/70 text-sm mb-10 max-w-sm font-display font-medium leading-loose">
                      Dedicated to pragmatic leadership, compassionate outcomes, and rigorous accountability for the people of Washington State.
                  </p>
                  <div className="flex gap-8 font-display text-xs font-black uppercase tracking-[0.2em]">
                      <a href="#" className="text-white hover:text-brand-gold transition-colors">Facebook</a>
                      <a href="#" className="text-white hover:text-brand-gold transition-colors">Twitter</a>
                      <a href="#briefing" className="text-white hover:text-brand-gold transition-colors">The Briefing</a>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center text-[10px] text-white/30 font-display tracking-[0.2em] uppercase font-bold relative z-10">
              &copy; 2026 Vote Penner. All rights reserved.
          </div>
      </footer>
    </>
  );
}
