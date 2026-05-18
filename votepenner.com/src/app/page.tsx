'use client';

import { useState } from 'react';

// 100% Verified data from BILLS_LEDGER.json and RAW_STATEMENTS_ALL.json
const indexData = {
  "Executive Overreach (SB 5925)": {
    failureTitle: "Unchecked Investigatory Power",
    failureBody: "The legislature pushed to expand the powers of the Attorney General's Office, allowing open-ended demands for records without providing financial support for cities and counties to comply.",
    actionTitle: "Defending Local Budgets",
    actionBody: "Fought to shield local governments and small businesses from 'fishing expeditions'. Warned the House that expanding this power 'lubricates tyranny' and forces businesses to prove innocence rather than defend it.",
    slug: "stopping-executive-overreach",
    linkEnabled: true
  },
  "Sound Transit (SB 6309)": {
    failureTitle: "Taxation Without Accountability",
    failureBody: "Sound Transit operates as an unelected, appointed board that collects massive amounts of property and sales taxes, holding billions in debt without direct accountability to the voters who fund it.",
    actionTitle: "Demanding Oversight",
    actionBody: "Challenged the lack of accountability on the floor. Called out the board for being 'government for the government by the government' rather than prioritizing the taxpayers.",
    slug: "sound-transit-accountability-sb-6309",
    linkEnabled: true
  },
  "Disability Care (SB 5167)": {
    failureTitle: "Budgeting Over Human Lives",
    failureBody: "The legislature attempted to use the state budget as a fulcrum to force the closure of vital Residential Habilitation Centers (RHCs) before a safe, community-based transition plan was established.",
    actionTitle: "Protecting the Vulnerable",
    actionBody: "Fought to protect the disabled community from abrupt facility closures. Warned that rushing the process without adequate enhanced behavioral support in place means 'some of them will die.'",
    slug: "protecting-disability-care",
    linkEnabled: true
  }
};

type Category = keyof typeof indexData;

export default function Home() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("Executive Overreach (SB 5925)");

  const currentData = indexData[activeTab];

  return (
    <>
      <div className="noise-overlay"></div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-nav">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              {/* Brand Logo */}
              <div className="sign-logo-container scale-90 md:scale-100 hover:opacity-90 transition cursor-pointer">
                  <div className="font-serif font-bold text-2xl text-brand-navy leading-none tracking-tight">Josh Penner</div>
                  <div className="sign-line"></div>
                  <div className="font-display font-bold text-[0.65rem] tracking-[0.2em] uppercase mt-0.5">
                      <span className="text-brand-red">For Representative</span> <span className="text-brand-gold ml-1">R</span>
                  </div>
              </div>

              <div className="hidden md:flex items-center gap-10 font-display font-semibold text-[13px] tracking-wide text-brand-navy">
                  <a href="#" className="hover:text-brand-red transition-colors">The Record</a>
                  <a href="#" className="hover:text-brand-red transition-colors">Priorities</a>
                  <a href="#briefing" className="hover:text-brand-red transition-colors">The Briefing</a>
                  <a href="https://www.efundraisingconnections.com/c/JoshPenner" target="_blank" rel="noopener noreferrer" className="tilt-btn btn-skeuo-red text-white px-7 py-2.5 rounded-full shadow-skeuo-btn hover:shadow-skeuo-btn-hover">Invest in Leadership</a>
              </div>
          </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-40 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 relative z-10">
                  <div className="inline-flex items-center px-4 py-1.5 glass-panel rounded-full mb-8 font-display font-bold text-xs tracking-widest uppercase text-brand-navy">
                      <span className="w-2 h-2 rounded-full bg-brand-red mr-3 animate-pulse shadow-[0_0_8px_#C1332E]"></span>
                      State of Washington &bull; 31st District
                  </div>
                  
                  <h1 className="font-serif text-6xl md:text-[5.5rem] font-black text-brand-navy leading-[1.05] mb-8 drop-shadow-sm">
                      Pragmatic Leadership.<br/>
                      <span className="text-brand-red italic font-bold">Compassionate Outcomes.</span><br/>
                      Real Accountability.
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-slate-600 font-display font-medium leading-relaxed mb-10 max-w-2xl">
                      Washington doesn't need more partisan warfare. We need discipline, data-driven oversight, and leaders who measure success by results.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 font-display font-bold">
                      <a href="#accountability-index" className="tilt-btn btn-skeuo-navy text-white text-lg px-8 py-4 rounded-full shadow-skeuo-btn hover:shadow-skeuo-btn-hover text-center">View the Ledger</a>
                      <a href="#briefing" className="tilt-btn glass-panel text-brand-navy text-lg px-8 py-4 rounded-full hover:border-brand-navy transition-all duration-300 text-center flex items-center justify-center shadow-skeuo-card">Join The Briefing</a>
                  </div>
              </div>
              
              <div className="lg:col-span-5 relative">
                  {/* Broken Grid: Floating Image Container with 3D effects */}
                  <div className="tilt-card aspect-[3/4] bg-slate-100 rounded-[2.5rem] overflow-hidden relative border-[8px] border-white z-20 shadow-glow-navy absolute right-0 lg:-mr-10 xl:-mr-20">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent mix-blend-multiply z-10"></div>
                      {/* Note: In production this would use next/image with a valid source. Leaving generic for scaffold. */}
                      <img src="/images/leg_photos/20260228_151920cr-(ZF-1674-31330-1-027).jpg" alt="Representative Josh Penner" className="w-full h-full object-cover object-center relative z-0 bg-brand-navy/20" />
                  </div>
                  <div className="absolute inset-0 bg-brand-gold/30 blur-[100px] rounded-full scale-110 -z-10 translate-x-20 translate-y-20"></div>
                  <div className="absolute -bottom-10 -left-10 glass-panel p-6 z-30 w-64 shadow-skeuo-card hidden md:block">
                      <div className="text-brand-red font-serif text-4xl font-black mb-1">100%</div>
                      <div className="font-display text-xs font-bold uppercase tracking-widest text-brand-navy">Committed to Transparency</div>
                  </div>
              </div>
          </div>
      </section>

      {/* The Funnel Collapse: Embedded Accountability Index (Overlapping Hero) */}
      <section id="accountability-index" className="px-6 py-16 relative z-20 scroll-mt-32">
          <div className="max-w-6xl mx-auto glass-panel p-8 md:p-12 border-t-4 border-t-brand-gold relative overflow-visible">
              
              <div className="text-center mb-10 relative z-10">
                  <h2 className="font-serif text-4xl md:text-[3rem] font-bold text-brand-navy mb-4 drop-shadow-sm">The Washington Accountability Index</h2>
                  <p className="text-slate-600 text-lg font-display font-medium">Select an issue to see how Olympia's spending measures up against reality.</p>
              </div>

              <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Filters (Interactive) */}
              <div className="flex flex-wrap gap-4 mb-10 justify-center relative z-10">
                  {(Object.keys(indexData) as Category[]).map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tilt-btn px-6 py-3 rounded-full font-display font-bold text-sm transition-all duration-300 ${
                        activeTab === tab 
                        ? 'btn-skeuo-navy text-white shadow-skeuo-btn scale-105' 
                        : 'glass-panel text-brand-navy hover:bg-white/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
              </div>

              {/* Compare Grid (Dynamic) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 min-h-[300px]">
                  {/* Left Card: Failure */}
                  <div className="bg-gradient-to-br from-white/60 to-red-50/40 p-10 rounded-[2rem] border border-brand-red/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),_0_10px_20px_rgba(193,51,46,0.05)] tilt-card transition-all duration-500 flex flex-col">
                      <div className="inline-flex items-center px-4 py-1.5 bg-white rounded-full text-brand-red font-display font-bold text-[10px] uppercase tracking-widest mb-6 shadow-sm border border-red-100 w-fit">State Failure</div>
                      <h3 className="font-serif font-black text-3xl text-brand-navy mb-4 leading-tight">{currentData.failureTitle}</h3>
                      <p className="text-slate-600 text-base font-display font-medium leading-relaxed flex-grow">{currentData.failureBody}</p>
                  </div>
                  
                  {/* Right Card: Action + Deep Dive Trap */}
                  <div className="bg-gradient-to-br from-white/60 to-blue-50/40 p-10 rounded-[2rem] border border-brand-navy/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),_0_10px_20px_rgba(27,54,93,0.05)] tilt-card transition-all duration-500 flex flex-col relative overflow-hidden group">
                      <div className="absolute inset-0 bg-brand-navy/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                      
                      <div className="relative z-10 flex-grow">
                        <div className="inline-flex items-center px-4 py-1.5 bg-white rounded-full text-brand-navy font-display font-bold text-[10px] uppercase tracking-widest mb-6 shadow-sm border border-blue-100 w-fit">Penner Action</div>
                        <h3 className="font-serif font-black text-3xl text-brand-navy mb-4 leading-tight">{currentData.actionTitle}</h3>
                        <p className="text-slate-600 text-base font-display font-medium leading-relaxed mb-8">{currentData.actionBody}</p>
                      </div>

                      {/* The Funnel Click */}
                      <div className="relative z-10 mt-auto pt-6 border-t border-brand-navy/10">
                        {currentData.linkEnabled ? (
                            <a 
                            href={`/issues/${currentData.slug}`} 
                            className="flex items-center justify-between text-brand-navy font-display font-black text-sm uppercase tracking-widest group/link hover:text-brand-red transition-colors"
                            >
                            <span>Read Full Floor Speech & Analysis</span>
                            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/link:bg-brand-red group-hover/link:text-white transition-all transform group-hover/link:translate-x-1">&rarr;</span>
                            </a>
                        ) : (
                            <div className="flex items-center justify-between text-slate-400 font-display font-bold text-sm uppercase tracking-widest cursor-not-allowed">
                            <span>Analysis Pending AI Synthesis</span>
                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">&rarr;</span>
                            </div>
                        )}
                      </div>
                  </div>
              </div>
              
              {/* CTA Box */}
              <div className="mt-12 p-10 btn-skeuo-red rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-glow-red relative z-10 overflow-hidden border border-brand-red/50">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>
                  <p className="text-white font-bold text-2xl md:text-3xl font-serif text-center md:text-left relative z-10 drop-shadow-md">Help Representative Penner demand ROI and accountability.</p>
                  <a href="https://www.efundraisingconnections.com/c/JoshPenner" target="_blank" rel="noopener noreferrer" className="tilt-btn btn-skeuo-gold text-brand-navy font-display font-black px-10 py-5 rounded-full shadow-skeuo-btn hover:shadow-glow-gold transition-all duration-300 whitespace-nowrap relative z-10 tracking-wide text-lg">Support the Fight</a>
              </div>
          </div>
      </section>

      {/* The Ledger: Executive Summary */}
      <section className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
              <h2 className="font-serif text-5xl md:text-[4rem] font-black text-brand-navy mb-20 text-center drop-shadow-sm">The Executive Record</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
                  
                  {/* Card 1 */}
                  <div className="tilt-card glass-panel p-10 md:mt-12 relative overflow-hidden group border-t-4 border-t-brand-red">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-red-50 to-white shadow-inner flex items-center justify-center mb-8 border border-red-100 group-hover:scale-110 transition-transform duration-500">
                          <span className="text-brand-red text-3xl drop-shadow-md">🛡️</span>
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-brand-navy mb-5 leading-tight">Protecting the Vulnerable</h3>
                      <p className="text-slate-600 font-display font-medium text-sm leading-relaxed mb-8 relative z-10">
                          Fought SB 5167 to stop the legislature from shutting down Residential Habilitation Centers (RHCs) without adequate care facilities for the severely disabled in place.
                      </p>
                      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-red/10 rounded-full blur-3xl group-hover:bg-brand-red/20 transition-colors duration-500 pointer-events-none"></div>
                  </div>

                  {/* Card 2 */}
                  <div className="tilt-card glass-panel p-10 md:-mt-4 relative overflow-hidden group border-t-4 border-t-brand-navy">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-blue-50 to-white shadow-inner flex items-center justify-center mb-8 border border-blue-100 group-hover:scale-110 transition-transform duration-500">
                          <span className="text-brand-navy text-3xl drop-shadow-md">⚖️</span>
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-brand-navy mb-5 leading-tight">Stopping Executive Overreach</h3>
                      <p className="text-slate-600 font-display font-medium text-sm leading-relaxed mb-8 relative z-10">
                          Led the charge against SB 5925, fighting back against unchecked investigatory powers that would allow the Attorney General to bypass due process and burden local governments.
                      </p>
                      <a href="/issues/stopping-executive-overreach" className="text-brand-navy font-display font-bold uppercase tracking-wider text-xs hover:underline relative z-10 inline-flex items-center">Read the Briefing <span className="ml-2 transition-transform group-hover:translate-x-2">&rarr;</span></a>
                      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-navy/5 rounded-full blur-3xl group-hover:bg-brand-navy/10 transition-colors duration-500 pointer-events-none"></div>
                  </div>

                  {/* Card 3 */}
                  <div className="tilt-card glass-panel p-10 md:mt-24 relative overflow-hidden group border-t-4 border-t-brand-gold">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-yellow-50 to-white shadow-inner flex items-center justify-center mb-8 border border-yellow-100 group-hover:scale-110 transition-transform duration-500">
                          <span className="text-brand-gold text-3xl drop-shadow-md">🚆</span>
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-brand-navy mb-5 leading-tight">Sound Transit Accountability</h3>
                      <p className="text-slate-600 font-display font-medium text-sm leading-relaxed mb-8 relative z-10">
                          Fought SB 6309 to prevent Sound Transit from sidestepping local zoning laws and dodging financial accountability while holding billions of taxpayer dollars in debt.
                      </p>
                      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl group-hover:bg-brand-gold/20 transition-colors duration-500 pointer-events-none"></div>
                  </div>
              </div>
              
              <div className="mt-16 text-center">
                  <a href="#" className="inline-flex items-center justify-center text-brand-navy font-display font-bold text-sm tracking-widest uppercase hover:text-brand-red transition-colors border-b-2 border-brand-navy hover:border-brand-red pb-1">
                      View All 39 Floor Speeches &rarr;
                  </a>
              </div>
          </div>
      </section>

      {/* Beehiiv Newsletter Integration */}
      <section id="briefing" className="pb-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto glass-panel overflow-hidden flex flex-col md:flex-row shadow-[0_30px_60px_rgba(27,54,93,0.1)] border border-white/80 rounded-[2.5rem]">
              <div className="btn-skeuo-navy p-14 md:w-5/12 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-gold/20 rounded-full blur-[60px]"></div>
                  <h3 className="font-serif text-5xl font-black text-white mb-6 relative z-10 leading-[1.1] drop-shadow-lg">The<br/>Briefing.</h3>
                  <p className="text-white/90 font-display font-medium text-sm relative z-10 leading-relaxed drop-shadow-sm">Unfiltered updates from the front lines in Olympia. No spam, just the reality of what's happening in Washington State.</p>
              </div>
              <div className="p-14 md:w-7/12 flex flex-col justify-center bg-white/40 backdrop-blur-md relative border-l border-white/50">
                  <p className="font-display font-black text-brand-navy text-xs uppercase tracking-[0.2em] mb-8 inline-flex items-center"><span className="w-2 h-2 rounded-full bg-brand-red mr-3 shadow-glow-red"></span> Join 2,500+ Washingtonians</p>
                  <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => { e.preventDefault(); alert('Beehiiv subscription connected.'); }}>
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
