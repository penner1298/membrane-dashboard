"use client";

import React, { useState } from 'react';

const indexData = {
  "Public Safety (HB 2040)": {
    failureTitle: "The Unacceptable Tragedy of State Neglect",
    failureBody: "The state spent millions housing violent offenders in hotel rooms without proper supervision, leading directly to the murder of a community member.",
    actionTitle: "Exposing the Failures",
    actionBody: "Led the charge on the House floor to expose the reckless policies that allowed a violent offender to be released without adequate monitoring.",
    slug: "the-unacceptable-tragedy-of-state-neglect",
    linkEnabled: true
  },
  "Education Funding (SB 5998)": {
    failureTitle: "Balancing the Budget on the Backs of Students",
    failureBody: "The state mandated massive new costs on local school districts while simultaneously cutting their funding, forcing catastrophic program reductions.",
    actionTitle: "Fighting for Our Schools",
    actionBody: "Authored and introduced an amendment to fully fund the state's obligations to local school districts, refusing to let them bear the burden of Olympia's poor planning.",
    slug: "protecting-our-communities", // Not right but placeholder
    linkEnabled: false
  },
  "State Overreach (SB 6006)": {
    failureTitle: "Targeting Local Businesses",
    failureBody: "New legislation granted state agencies unchecked authority to inspect, fine, and disrupt local businesses without clear probable cause or oversight.",
    actionTitle: "Defending Local Economies",
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

export default function AccountabilityMatrix() {
  const [activeTab, setActiveTab] = useState<Category>("Public Safety (HB 2040)");

  return (
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

              {/* Data Visualization Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 min-h-[300px]">
                  
                  {/* Card 1: The Failure */}
                  <div className="tilt-card bg-white p-10 rounded-[2.5rem] shadow-skeuo-card border border-slate-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                      <div className="flex items-center gap-3 mb-6">
                          <span className="w-3 h-3 rounded-full bg-brand-red animate-pulse"></span>
                          <span className="font-display font-bold text-brand-red text-xs uppercase tracking-widest">The Baseline Failure</span>
                      </div>
                      <h3 className="font-serif text-3xl font-black text-brand-navy mb-4 leading-tight">{indexData[activeTab].failureTitle}</h3>
                      <p className="text-slate-600 font-display font-medium text-lg leading-relaxed">
                        {indexData[activeTab].failureBody}
                      </p>
                  </div>

                  {/* Card 2: The Pushback */}
                  <div className="tilt-card btn-skeuo-navy p-10 rounded-[2.5rem] shadow-glow-navy relative group overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                      <div className="flex items-center gap-3 mb-6">
                          <span className="w-3 h-3 rounded-full bg-brand-gold"></span>
                          <span className="font-display font-bold text-brand-gold text-xs uppercase tracking-widest">Our Direct Action</span>
                      </div>
                      <h3 className="font-serif text-3xl font-black text-white mb-4 leading-tight">{indexData[activeTab].actionTitle}</h3>
                      <p className="text-white/80 font-display font-medium text-lg leading-relaxed mb-8">
                        {indexData[activeTab].actionBody}
                      </p>
                      
                      {indexData[activeTab].linkEnabled && (
                        <a href={`/issues/${indexData[activeTab].slug}`} className="inline-flex items-center gap-2 text-brand-gold font-display font-bold text-sm tracking-widest uppercase hover:text-white transition-colors group/link mt-auto">
                            Read the Full Report
                            <span className="transform group-hover/link:translate-x-1 transition-transform">&rarr;</span>
                        </a>
                      )}
                  </div>

              </div>
          </div>
      </section>
  );
}
