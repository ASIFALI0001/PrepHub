"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Brain, ChevronRight, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Database, Globe, Code2, Eye, EyeOff,
} from "lucide-react";


// ─── Source definitions ────────────────────────────────────────────────────

const SOURCES = [
  // TinyFish engine
  { key: "TinyFish Search",   label: "Smart Web Search",    engine: "tinyfish", desc: "Searches live web for company interview pages" },
  { key: "TinyFish Direct",   label: "Direct Site Fetch",   engine: "tinyfish", desc: "Fetches GFG, AmbitionBox, InterviewBit, igotanoffer directly" },
  { key: "TinyFish LeetCode", label: "LeetCode Discuss",    engine: "tinyfish", desc: "Finds company interview experiences on LeetCode" },
  // Jina engine
  { key: "Reddit",            label: "Reddit",              engine: "jina",     desc: "r/cscareerquestions, r/leetcode, r/developersIndia" },
  { key: "GitHub",            label: "GitHub Repos",        engine: "jina",     desc: "Interview prep repos and experience compilations" },
  { key: "Jina Search",       label: "Jina AI Search",      engine: "jina",     desc: "Web search via Jina AI reader for additional sources" },
  { key: "Jina Direct",       label: "Jina Direct Fetch",   engine: "jina",     desc: "LeetCode, InterviewBit, GeeksForGeeks fallback reader" },
  // APIs
  { key: "Job Postings",      label: "Job Postings API",    engine: "api",      desc: "Greenhouse & Lever job description APIs" },
] as const;

const ENGINE_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tinyfish: { label: "TinyFish Browser",  color: "text-accent-cyan",   bg: "bg-accent-cyan/10",   icon: "🐟" },
  jina:     { label: "Jina AI Reader",    color: "text-accent-orange", bg: "bg-accent-orange/10", icon: "🤖" },
  api:      { label: "Direct APIs",       color: "text-accent-green",  bg: "bg-accent-green/10",  icon: "🔗" },
};

type SourceStatus = "pending" | "running" | "done" | "failed";
type Phase = "form" | "scraping" | "generating" | "saving";

interface SourceState { status: SourceStatus; chunks?: number }

const initSources = (): Record<string, SourceState> =>
  Object.fromEntries(SOURCES.map((s) => [s.key, { status: "pending" as SourceStatus }]));

// ─── Component ────────────────────────────────────────────────────────────

export default function CompanyBrainForm() {
  const router = useRouter();

  const [companyName,   setCompanyName]   = useState("");
  const [role,          setRole]           = useState("");
  const [description,   setDescription]   = useState("");
  const [jd,            setJd]             = useState("");

  const [phase,         setPhase]          = useState<Phase>("form");
  const [percent,       setPercent]        = useState(0);
  const [statusMsg,     setStatusMsg]      = useState("");
  const [error,         setError]          = useState("");
  const [sources,       setSources]        = useState<Record<string, SourceState>>(initSources());

  // Scraped data for inspection
  const [scrapedChunks, setScrapedChunks] = useState<string[]>([]);
  const [scrapedUrls,   setScrapedUrls]   = useState<string[]>([]);
  const [showData,      setShowData]       = useState(false);
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);

  const resetSources = () => setSources(initSources());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !role.trim()) return;

    setError("");
    setPercent(0);
    setStatusMsg(`Starting research on ${companyName}…`);
    setPhase("scraping");
    setScrapedChunks([]);
    setScrapedUrls([]);
    setShowData(false);
    resetSources();

    try {
      const res = await fetch("/api/company-brain/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyName, role, description, jd }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>;

            if (event.type === "source_start") {
              const name = event.name as string;
              setSources((prev) => ({ ...prev, [name]: { status: "running" } }));
            } else if (event.type === "source_done") {
              const name = event.name as string;
              setSources((prev) => ({
                ...prev,
                [name]: { status: event.ok ? "done" : "failed", chunks: event.chunks as number },
              }));
              setPercent(event.percent as number);
              setStatusMsg(`Scraped ${event.completed}/${event.total} sources`);
            } else if (event.type === "scraped_data") {
              setScrapedChunks(event.chunks as string[]);
              setScrapedUrls(event.sources as string[]);
            } else if (event.type === "gemini_start") {
              setPhase("generating");
              setPercent(event.percent as number);
              setStatusMsg(event.message as string);
            } else if (event.type === "saving") {
              setPhase("saving");
              setPercent(event.percent as number);
              setStatusMsg(event.message as string);
            } else if (event.type === "complete") {
              setPercent(100);
              setStatusMsg(event.message as string);
              router.push(`/company-brain/${event.cardId as string}`);
            } else if (event.type === "error") {
              throw new Error(event.message as string);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("form");
    }
  };

  const completedCount = Object.values(sources).filter(
    (s) => s.status === "done" || s.status === "failed"
  ).length;

  const totalFound = Object.values(sources).reduce(
    (sum, s) => sum + (s.status === "done" ? (s.chunks ?? 0) : 0), 0
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  if (phase === "form") {
    return (
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-pink" /> Company Details
          </h2>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-muted">Company Name <span className="text-accent-pink">*</span></label>
            <input className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              placeholder="e.g. Google, Stripe, Lume…" value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-muted">Role / Position <span className="text-accent-pink">*</span></label>
            <input className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              placeholder="e.g. Software Engineer, SWE Intern, ML Engineer…" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Placement Announcement / Context</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">Optional</span>
          </div>
          <textarea className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
            rows={4} placeholder={`e.g.\nSUMMER INTERNSHIP DRIVE 2027\nCompany: Skylo Tech\nRoles: SWE, Cybersecurity\nCGPA: 6+`}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Job Description (JD)</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">Optional</span>
          </div>
          <textarea className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
            rows={4} placeholder="Paste full JD here…" value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>

        {error && <div className="text-xs text-accent-pink bg-accent-pink/10 rounded-xl px-4 py-3 border border-accent-pink/20">{error}</div>}

        <button type="submit" disabled={!companyName.trim() || !role.trim()}
          className="w-full btn-primary py-3 gap-2 disabled:opacity-40">
          <Brain className="w-4 h-4" /> Generate 50 interview questions <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    );
  }

  // ── Progress view ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Overall progress */}
      <div className="glass-card rounded-2xl border border-bg-border p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-pink" />
            <span className="text-sm font-semibold text-text">{companyName}</span>
            <span className="text-xs text-text-muted">· {role}</span>
          </div>
          <span className="tnum text-sm font-bold text-accent-pink">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-bg-surface overflow-hidden mb-3">
          <motion.div className="h-full rounded-full bg-accent-pink"
            initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.5 }} />
        </div>
        <p className="text-xs text-text-muted flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
          {statusMsg}
        </p>
      </div>

      {/* Sources grouped by engine */}
      <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Scraping Sources</h3>
          <div className="flex items-center gap-3">
            {totalFound > 0 && (
              <span className="text-xs text-accent-green font-semibold">{totalFound} snippets collected</span>
            )}
            <span className="text-xs text-text-muted">{completedCount} / {SOURCES.length} done</span>
          </div>
        </div>

        <div className="divide-y divide-bg-border/50">
          {(["tinyfish", "jina", "api"] as const).map((engine) => {
            const engineSources = SOURCES.filter((s) => s.engine === engine);
            const engineConfig = ENGINE_LABELS[engine];
            const doneCount = engineSources.filter((s) => sources[s.key]?.status === "done").length;

            return (
              <div key={engine} className="p-4">
                {/* Engine header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{engineConfig.icon}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${engineConfig.color}`}>
                    {engineConfig.label}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {doneCount}/{engineSources.length}
                  </span>
                </div>

                {/* Sources in this engine */}
                <div className="space-y-2 pl-1">
                  {engineSources.map((src) => {
                    const s = sources[src.key];
                    const isRunning = s.status === "running";
                    const isDone = s.status === "done";
                    const isFailed = s.status === "failed";
                    const isPending = s.status === "pending";

                    return (
                      <div key={src.key} className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {isPending  && <Clock        className="w-3.5 h-3.5 text-text-muted opacity-30" />}
                          {isRunning  && <Loader2      className="w-3.5 h-3.5 text-primary animate-spin" />}
                          {isDone     && <CheckCircle  className="w-3.5 h-3.5 text-accent-green" />}
                          {isFailed   && <XCircle      className="w-3.5 h-3.5 text-text-muted opacity-40" />}
                        </div>

                        {/* Label + desc */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${isPending ? "text-text-muted opacity-40" : isRunning ? "text-text" : isDone ? "text-text" : "text-text-muted opacity-60"}`}>
                            {src.label}
                          </span>
                          {isRunning && (
                            <span className="text-xs text-text-muted ml-2">{src.desc}</span>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0 text-right">
                          {isPending  && <span className="text-xs text-text-muted opacity-30">waiting</span>}
                          {isRunning  && (
                            <span className={`text-xs font-semibold ${engineConfig.color} animate-pulse`}>
                              fetching…
                            </span>
                          )}
                          {isDone     && (
                            <span className="text-xs font-semibold text-accent-green">
                              {s.chunks ? `${s.chunks} snippet${s.chunks > 1 ? "s" : ""}` : "found"}
                            </span>
                          )}
                          {isFailed   && <span className="text-xs text-text-muted opacity-40">not found</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gemini phase */}
      <AnimatePresence>
        {(phase === "generating" || phase === "saving") && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">🤖</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text mb-0.5">
                {phase === "saving" ? "Saving to your library…" : "Gemini AI generating questions…"}
              </div>
              <div className="text-xs text-text-muted">
                {phase === "generating"
                  ? `Analysing ${scrapedChunks.length} snippets from ${scrapedUrls.length} sources and crafting 50 targeted questions`
                  : "Almost done — writing to database"}
              </div>
            </div>
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scraped data inspector */}
      <AnimatePresence>
        {scrapedChunks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-bg-border overflow-hidden">

            {/* Header / toggle */}
            <button onClick={() => setShowData(!showData)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-card/50 transition-colors">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-accent-cyan" />
                <div className="text-left">
                  <p className="text-sm font-bold text-text">Scraped Data fed to Gemini</p>
                  <p className="text-xs text-text-muted">{scrapedChunks.length} snippets · {scrapedUrls.length} sources</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showData
                  ? <><EyeOff className="w-4 h-4 text-text-muted" /><ChevronUp className="w-4 h-4 text-text-muted" /></>
                  : <><Eye className="w-4 h-4 text-text-muted" /><ChevronDown className="w-4 h-4 text-text-muted" /></>
                }
              </div>
            </button>

            {/* Content */}
            <AnimatePresence>
              {showData && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-bg-border">

                  {/* Sources list */}
                  <div className="px-5 py-3 bg-bg-card/30 border-b border-bg-border">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Sources scraped
                    </p>
                    <div className="space-y-1">
                      {scrapedUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="block text-xs text-accent-cyan hover:underline truncate">
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Chunks */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" /> Scraped snippets ({scrapedChunks.length})
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {scrapedChunks.map((chunk, i) => {
                        const isExpanded = expandedChunk === i;
                        const preview = chunk.slice(0, 200);
                        const hasMore = chunk.length > 200;

                        return (
                          <div key={i} className="rounded-xl border border-bg-border overflow-hidden">
                            <button onClick={() => setExpandedChunk(isExpanded ? null : i)}
                              className="w-full flex items-start gap-3 p-3 text-left hover:bg-bg-card/50 transition-colors">
                              <span className="text-xs font-black text-text-muted/50 shrink-0 mt-0.5 w-5">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted leading-relaxed font-mono">
                                  {isExpanded ? chunk : preview}
                                  {!isExpanded && hasMore && <span className="text-accent-cyan">… (click to expand)</span>}
                                </p>
                              </div>
                              {hasMore && (
                                isExpanded
                                  ? <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
