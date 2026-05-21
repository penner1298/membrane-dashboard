"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, RefreshCw, ShieldAlert, Mail, MessageSquare, 
  History, Activity, CheckCircle, ArrowLeft, Send, Check, Edit2, Trash2, Plus
} from "lucide-react";

interface TelemetryItem {
  task: string;
  source_email: string;
  sender: string;
  subject: string;
  date_detected: string;
  pod: string;
}

interface DraftData {
  date: string;
  day: string;
  accomplishments: {
    political: string[];
    professional: string[];
    personal: string[];
    automation_dev: string[];
  };
  todos: {
    medical_family: string[];
    professional_political: string[];
    other: string[];
  };
  raw_trace: {
    imessage_count: number;
    email_count: number;
    git_commits: number;
    calendar_events: number;
  };
}

export default function ChroniclePage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [rawTelemetry, setRawTelemetry] = useState<TelemetryItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [newTodoText, setNewTodoText] = useState("");

  const [activeTab, setActiveTab] = useState<"accomplishments" | "todos">("accomplishments");
  const [activePod, setActivePod] = useState<"political" | "professional" | "personal" | "automation_dev">("professional");
  const [activeTodoCat, setActiveTodoCat] = useState<"medical_family" | "professional_political" | "other">("professional_political");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chronicle");
      const data = await res.json();
      if (data.success) {
        setDraft(data.draft);
        setRawTelemetry(data.rawTelemetry);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await fetch("/api/chronicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" })
      });
      // Wait a moment and fetch updated
      setTimeout(fetchData, 8000);
    } catch (e) {
      console.error(e);
      setSyncing(false);
    }
  };

  const handleSaveDraft = async (updatedDraft: DraftData) => {
    try {
      await fetch("/api/chronicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", draft: updatedDraft })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommit = async () => {
    if (!draft) return;
    try {
      setCommitting(true);
      const res = await fetch("/api/chronicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", draft })
      });
      const data = await res.json();
      if (data.success) {
        alert("Journal committed successfully to your repository!");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommitting(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim() || !draft) return;
    const updated = { ...draft };
    updated.accomplishments[activePod] = [
      ...updated.accomplishments[activePod],
      newItemText.trim()
    ];
    setDraft(updated);
    setNewItemText("");
    handleSaveDraft(updated);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim() || !draft) return;
    const updated = { ...draft };
    updated.todos[activeTodoCat] = [
      ...updated.todos[activeTodoCat],
      newTodoText.trim()
    ];
    setDraft(updated);
    setNewTodoText("");
    handleSaveDraft(updated);
  };

  const handleDeleteItem = (category: keyof DraftData["accomplishments"], index: number) => {
    if (!draft) return;
    const updated = { ...draft };
    updated.accomplishments[category] = updated.accomplishments[category].filter((_, i) => i !== index);
    setDraft(updated);
    handleSaveDraft(updated);
  };

  const handleDeleteTodo = (category: keyof DraftData["todos"], index: number) => {
    if (!draft) return;
    const updated = { ...draft };
    updated.todos[category] = updated.todos[category].filter((_, i) => i !== index);
    setDraft(updated);
    handleSaveDraft(updated);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-gray-100 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Dynamic Skeuomorphic Radial Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* 3% SVG Fractal Noise Overlay to eliminate digital flatness */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15] pointer-events-none" />

      <header className="border-b border-gray-800 bg-[#0B0F19]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <h1 className="font-serif text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Chronicle Supervisor
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSync}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-700 hover:border-gray-600 transition-all text-gray-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Telemetry"}
            </button>
            
            <button 
              onClick={handleCommit}
              disabled={committing || loading || !draft}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border border-emerald-400/30 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {committing ? "Committing..." : "Commit Daily Log"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Raw Telemetry Feed (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-[#0B0F19]/80 rounded-xl border border-gray-800 p-6 backdrop-blur-xl relative shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h2 className="font-serif font-bold text-md text-white">Telemetry Stream</h2>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-900/50">
                Live Inbox
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                Ingesting device silos...
              </div>
            ) : rawTelemetry.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-sm bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                Zero unread logs. Stream is clear.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {rawTelemetry.map((item, i) => {
                  const isIMessage = item.source_email.includes("iMessage");
                  return (
                    <div 
                      key={i} 
                      className={`p-4 bg-gray-900/40 rounded-xl border transition-all ${
                        isIMessage 
                          ? "border-emerald-500/20 hover:border-emerald-500/40 shadow-[inset_0_1px_2px_rgba(16,185,129,0.05)]" 
                          : "border-purple-500/20 hover:border-purple-500/40 shadow-[inset_0_1px_2px_rgba(168,85,247,0.05)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full border ${
                          isIMessage 
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/50" 
                            : "bg-purple-950/80 text-purple-400 border-purple-900/50"
                        } flex items-center gap-1`}>
                          {isIMessage ? <MessageSquare className="w-2.5 h-2.5" /> : <Mail className="w-2.5 h-2.5" />}
                          {isIMessage ? "iMessage" : "Gmail"}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{item.date_detected}</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-300 font-serif mb-1">From: {item.sender}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono bg-[#060913]/50 p-2.5 rounded-lg border border-gray-800/40">
                        {item.task}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: AI consolidated Synthesis Panel (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-[#0B0F19]/80 rounded-xl border border-gray-800 p-6 backdrop-blur-xl shadow-2xl relative">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-3">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab("accomplishments")}
                  className={`font-serif text-lg font-bold pb-2 transition-all border-b-2 relative ${
                    activeTab === "accomplishments" 
                      ? "text-white border-indigo-500" 
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Strategic Accomplishments
                </button>
                <button 
                  onClick={() => setActiveTab("todos")}
                  className={`font-serif text-lg font-bold pb-2 transition-all border-b-2 relative ${
                    activeTab === "todos" 
                      ? "text-white border-indigo-500" 
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Action Items
                </button>
              </div>
              {draft && (
                <div className="text-right">
                  <span className="text-xs font-extrabold text-indigo-400 font-mono tracking-widest uppercase">{draft.day}</span>
                  <p className="text-[10px] text-gray-500 font-medium font-mono">{draft.date}</p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                Synthesizing accomplishments...
              </div>
            ) : !draft ? (
              <div className="py-20 text-center text-gray-500">
                Run sync to generate today's log draft.
              </div>
            ) : (
              <div>
                
                {/* accomplishments Tab Content */}
                {activeTab === "accomplishments" && (
                  <div className="space-y-6">
                    {/* Category Selector Pills */}
                    <div className="flex gap-2 p-1.5 bg-[#060913]/60 rounded-xl border border-gray-800">
                      {(["professional", "political", "personal", "automation_dev"] as const).map((pod) => (
                        <button
                          key={pod}
                          onClick={() => setActivePod(pod)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                            activePod === pod
                              ? "bg-gray-800 text-white shadow-md border border-gray-700/50"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {pod === "automation_dev" ? "Automation Dev" : pod}
                        </button>
                      ))}
                    </div>

                    {/* Active Ingested Checklist */}
                    <div className="space-y-2 min-h-[30vh]">
                      {draft.accomplishments[activePod].length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-10 font-serif italic">No accomplishments logged in this pod today.</p>
                      ) : (
                        draft.accomplishments[activePod].map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-start justify-between gap-3 p-3 bg-gray-900/30 rounded-xl border border-gray-800/80 group hover:border-gray-700 transition-colors"
                          >
                            <p className="text-xs text-gray-300 leading-relaxed font-sans mt-0.5">{item}</p>
                            <button 
                              onClick={() => handleDeleteItem(activePod, index)}
                              className="text-gray-600 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Accomplishment Inline Input */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                      <input 
                        type="text"
                        placeholder={`Add new ${activePod} accomplishment...`}
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                        className="flex-1 bg-[#060913] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button 
                        onClick={handleAddItem}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg border border-indigo-400/20 shadow-lg hover:shadow-indigo-500/20"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* To-Dos Tab Content */}
                {activeTab === "todos" && (
                  <div className="space-y-6">
                    {/* Category Selector Pills */}
                    <div className="flex gap-2 p-1.5 bg-[#060913]/60 rounded-xl border border-gray-800">
                      {(["professional_political", "medical_family", "other"] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveTodoCat(cat)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                            activeTodoCat === cat
                              ? "bg-gray-800 text-white shadow-md border border-gray-700/50"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {cat === "professional_political" ? "Business & political" : cat === "medical_family" ? "Medical / Family" : "General"}
                        </button>
                      ))}
                    </div>

                    {/* Active Ingested To-Do Checklist */}
                    <div className="space-y-2 min-h-[30vh]">
                      {draft.todos[activeTodoCat].length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-10 font-serif italic">No action items logged in this category today.</p>
                      ) : (
                        draft.todos[activeTodoCat].map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-start justify-between gap-3 p-3 bg-gray-900/30 rounded-xl border border-gray-800/80 group hover:border-gray-700 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <input 
                                type="checkbox" 
                                readOnly 
                                checked={false}
                                className="w-3.5 h-3.5 border-gray-800 bg-[#060913] rounded text-indigo-500 focus:ring-0 mt-0.5"
                              />
                              <p className="text-xs text-gray-300 leading-relaxed font-sans">{item}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteTodo(activeTodoCat, index)}
                              className="text-gray-600 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add To-Do Inline Input */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                      <input 
                        type="text"
                        placeholder="Add new action item..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                        className="flex-1 bg-[#060913] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button 
                        onClick={handleAddTodo}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg border border-indigo-400/20 shadow-lg hover:shadow-indigo-500/20"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
