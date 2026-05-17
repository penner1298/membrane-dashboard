"use client";

import React, { useEffect, useState } from 'react';

type Transaction = {
  timestamp: string;
  requesting_agent: string;
  target_agent: string;
  task: string;
  policy: string;
  status: string;
  proof_of_work: string;
};

export default function SwarmAuditDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch('/api/swarm');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Assuming data is { transactions: [...] } or just [...]
        if (Array.isArray(data)) {
          setTransactions(data);
        } else if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          // fallback
          setTransactions([]);
        }
        setError(null);
      } catch (e: unknown) {
        console.error("Failed to fetch swarm ledger:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(String(e));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
    const interval = setInterval(fetchLedger, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-emerald-400 font-mono p-8 flex flex-col">
      <header className="mb-8 border-b border-emerald-900 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest flex items-center gap-3">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_theme('colors.emerald.500')]"></span>
          Swarm Ledger Audit
        </h1>
        <p className="text-emerald-700 mt-2 text-sm tracking-wide">REAL-TIME AUTONOMOUS AGENT TRANSACTION MONITORING</p>
      </header>

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-500 p-4 mb-6 rounded">
          Error fetching ledger: {error}
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-emerald-600 animate-pulse tracking-widest">ESTABLISHING SECURE LINK TO MEMBRANE...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-emerald-900 text-emerald-600 text-xs uppercase tracking-widest bg-neutral-900/50">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Requester</th>
                <th className="p-4 font-semibold">Target</th>
                <th className="p-4 font-semibold">Task</th>
                <th className="p-4 font-semibold">Policy</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Proof of Work</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.length === 0 && !error ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-emerald-800 tracking-widest uppercase">
                    No transactions recorded in the ledger yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, i) => (
                  <tr key={i} className="border-b border-emerald-950/50 hover:bg-emerald-900/20 transition-colors">
                    <td className="p-4 whitespace-nowrap text-emerald-500/70">{tx.timestamp}</td>
                    <td className="p-4 font-semibold text-cyan-400">{tx.requesting_agent}</td>
                    <td className="p-4 font-semibold text-purple-400">{tx.target_agent}</td>
                    <td className="p-4 max-w-xs truncate" title={tx.task}>{tx.task}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-900/30 rounded text-xs border border-emerald-800/50 text-emerald-300">
                        {tx.policy}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border tracking-wider uppercase font-bold ${
                        tx.status?.toLowerCase() === 'success' || tx.status?.toLowerCase() === 'completed' ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400' : 
                        tx.status?.toLowerCase() === 'failed' || tx.status?.toLowerCase() === 'error' ? 'bg-red-900/40 border-red-700 text-red-400' :
                        'bg-amber-900/40 border-amber-700 text-amber-400'
                      }`}>
                        {tx.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm truncate text-emerald-600" title={tx.proof_of_work}>
                      {tx.proof_of_work}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
