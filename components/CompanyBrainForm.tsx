"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Brain, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  Reddit: "Reddit",
  GitHub: "GitHub",
  AmbitionBox: "AmbitionBox",
  GeeksForGeeks: "GeeksForGeeks",
  LeetCode: "LeetCode Discuss",
  InterviewBit: "InterviewBit",
  Glassdoor: "Glassdoor",
  "Levels.fyi": "Levels.fyi",
  "Job Postings": "Job Postings",
};

const ALL_SOURCES = Object.keys(SOURCE_LABELS);

type SourceStatus = "pending" | "running" | "done" | "failed";
type Phase = "form" | "scraping" | "generating" | "saving";

interface SourceState {
  status: SourceStatus;
  chunks?: number;
}

export default function CompanyBrainForm() {
  const router = useRouter();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [jd, setJd] = useState("");

  // Progress state
  const [phase, setPhase] = useState<Phase>("form");
  const [percent, setPercent] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [sources, setSources] = useState<Record<string, SourceState>>(
    Object.fromEntries(ALL_SOURCES.map((s) => [s, { status: "pending" }]))
  );

  const resetSources = () =>
    setSources(Object.fromEntries(ALL_SOURCES.map((s) => [s, { status: "pending" }])));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !role.trim()) return;

    setError("");
    setPercent(0);
    setStatusMsg(`Starting research on ${companyName}…`);
    setPhase("scraping");
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

  const completedCount = Object.values(sources).filter((s) => s.status === "done" || s.status === "failed").length;

  // ── Form view ─────────────────────────────────────────────────────────────
  if (phase === "form") {
    return (
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-pink" />
            Company Details
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-muted">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              placeholder="e.g. Skylo Tech, Google, Stripe…"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-muted">
              Role / Position <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              placeholder="e.g. Software Engineer, Cybersecurity Analyst, SWE Intern…"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Placement Announcement / Context</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">Optional</span>
          </div>
          <p className="text-xs text-text-muted">Paste the campus placement post, drive details, or any context.</p>
          <textarea
            className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
            rows={5}
            placeholder={`e.g.\nSUMMER INTERNSHIP DRIVE 2027\nCompany: Skylo Tech\nType: DREAM, FTE + Internship\nPackage: 40k PM stipend\nRoles: SWE, Cybersecurity\nCGPA: 6+, no active backlogs`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Job Description (JD)</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">Optional</span>
          </div>
          <textarea
            className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
            rows={5}
            placeholder="Paste full JD here…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!companyName.trim() || !role.trim()}
          className="w-full btn-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 text-sm"
        >
          <Brain className="w-4 h-4" />
          Generate 50 Interview Questions
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    );
  }

  // ── Progress view ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Overall progress bar */}
      <div className="glass-card rounded-2xl border border-bg-border p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-pink" />
            <span className="text-sm font-semibold text-text">{companyName}</span>
            <span className="text-xs text-text-muted">· {role}</span>
          </div>
          <span className="text-sm font-bold text-accent-pink">{percent}%</span>
        </div>

        <div className="h-2 rounded-full bg-bg-border overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-pink to-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-text-muted flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
          {statusMsg}
        </p>
      </div>

      {/* Source list */}
      <div className="glass-card rounded-2xl border border-bg-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            Scraping Sources
          </h3>
          <span className="text-xs text-text-muted">{completedCount} / {ALL_SOURCES.length} done</span>
        </div>

        <div className="space-y-2">
          {ALL_SOURCES.map((name) => {
            const s = sources[name];
            return (
              <div key={name} className="flex items-center gap-3 py-1.5">
                {/* Status icon */}
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {s.status === "pending" && <Clock className="w-3.5 h-3.5 text-text-muted opacity-40" />}
                  {s.status === "running" && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                  {s.status === "done" && <CheckCircle className="w-3.5 h-3.5 text-accent-green" />}
                  {s.status === "failed" && <XCircle className="w-3.5 h-3.5 text-text-muted opacity-50" />}
                </div>

                {/* Name */}
                <span className={`text-sm flex-1 ${
                  s.status === "pending" ? "text-text-muted opacity-50" :
                  s.status === "running" ? "text-text" :
                  s.status === "done" ? "text-text" :
                  "text-text-muted"
                }`}>
                  {SOURCE_LABELS[name]}
                </span>

                {/* Result */}
                <span className="text-xs shrink-0">
                  {s.status === "pending" && <span className="text-text-muted opacity-40">waiting</span>}
                  {s.status === "running" && <span className="text-primary animate-pulse">scraping…</span>}
                  {s.status === "done" && (
                    <span className="text-accent-green font-medium">
                      {s.chunks ? `${s.chunks} snippet${s.chunks > 1 ? "s" : ""}` : "found"}
                    </span>
                  )}
                  {s.status === "failed" && <span className="text-text-muted">not found</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gemini phase indicator */}
      {(phase === "generating" || phase === "saving") && (
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg">🤖</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text mb-0.5">
              {phase === "saving" ? "Saving to your library…" : "Gemini AI is generating questions…"}
            </div>
            <div className="text-xs text-text-muted">
              {phase === "generating"
                ? "Analysing scraped data and crafting 50 targeted questions"
                : "Almost done — writing to database"}
            </div>
          </div>
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
        </div>
      )}
    </div>
  );
}
