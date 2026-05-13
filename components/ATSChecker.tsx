"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, CheckCircle, Loader2, FileText, Zap,
  Copy, ExternalLink, Check, ChevronRight, AlertTriangle, RefreshCw,
  ClipboardList, Sparkles, Send,
} from "lucide-react";
import type { ATSReport, SimilarResume } from "@/lib/ats";

type Step = "input" | "analyzing" | "report" | "building" | "built";

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
        strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={size * 0.2} fontWeight="900">{score}</text>
      <text x={cx} y={cy + size * 0.14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={size * 0.09} fontWeight="600">{label}</text>
    </svg>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-bg-border overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </div>
  );
}

const sectionColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : s >= 40 ? "#f97316" : "#ef4444";

export default function ATSChecker() {
  const fileRef = useRef<HTMLInputElement>(null);
  const overleafRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState<Step>("input");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [similarResumes, setSimilarResumes] = useState<SimilarResume[]>([]);
  const [fetchingSimilar, setFetchingSimilar] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [latex, setLatex] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // ── Upload & extract ──────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setResumeFile(file);
    setExtracting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/career-guide/parse-resume", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.text) setResumeText(data.text);
      else setError("Could not read PDF. Try a text-based PDF.");
    } catch {
      setError("Failed to read resume.");
    } finally {
      setExtracting(false);
    }
  }

  // ── ATS Analysis ──────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!resumeText) { setError("Please upload your resume first."); return; }
    setError("");
    setStep("analyzing");
    try {
      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText, jobDescription: jd }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setStep("report");
        // Kick off similar resume fetch in background
        fetchSimilarResumes();
      } else { setError(data.error ?? "Analysis failed."); setStep("input"); }
    } catch {
      setError("Analysis failed. Please try again.");
      setStep("input");
    }
  }

  // ── Fetch similar top resumes ─────────────────────────────────────────────
  async function fetchSimilarResumes() {
    setFetchingSimilar(true);
    setSimilarResumes([]);
    try {
      const res = await fetch("/api/ats/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (data.similar) setSimilarResumes(data.similar);
    } catch {
      // Silent fail — vector search is enhancement, not critical
    } finally {
      setFetchingSimilar(false);
    }
  }

  // ── Build resume ──────────────────────────────────────────────────────────
  async function handleBuild(instruction?: string) {
    setStep("building");
    setLatex("");
    setError("");
    try {
      const res = await fetch("/api/ats/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText, jobDescription: jd, editInstruction: instruction, similarResumes: similarResumes.length ? similarResumes : undefined }),
      });
      const data = await res.json();
      if (data.latex) { setLatex(data.latex); setStep("built"); setEditPrompt(""); }
      else { setError(data.error ?? "Build failed."); setStep("report"); }
    } catch {
      setError("Build failed. Please try again.");
      setStep("report");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="pt-20 pb-24 px-4 sm:px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">ATS Resume Checker</h1>
              <p className="text-sm text-text-muted">Score your resume · fix gaps · build an ATS-optimized version</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── INPUT ── */}
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Resume upload */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">Resume PDF <span className="text-red-400">*</span></h2>
                </div>
                <div className="p-5">
                  <div onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      resumeFile ? "border-accent-green/40 bg-accent-green/5" : "border-bg-border hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                    {extracting ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-text-muted">Reading resume…</p>
                      </div>
                    ) : resumeFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-accent-green" />
                        <p className="text-sm font-semibold text-text">{resumeFile.name}</p>
                        <p className="text-xs text-text-muted">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-text-muted" />
                        <p className="text-sm font-semibold text-text">Click to upload PDF</p>
                        <p className="text-xs text-text-muted">Text-based PDF works best</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* JD input */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <Zap className="w-4 h-4 text-accent-cyan" />
                  <div>
                    <h2 className="text-sm font-bold text-text">Job Description / Role <span className="text-text-muted font-normal">(optional)</span></h2>
                    <p className="text-xs text-text-muted">Add for company-specific ATS scoring</p>
                  </div>
                </div>
                <div className="p-5">
                  <textarea value={jd} onChange={e => setJd(e.target.value)}
                    placeholder={`Paste job description, or just type:\n"SDE Intern at Google"\n"Backend Engineer at a fintech startup"\n"ML Engineer — must know PyTorch, distributed training"`}
                    className="w-full h-48 bg-transparent text-sm text-text placeholder:text-text-muted/50 outline-none resize-none leading-relaxed" />
                </div>
              </div>

              <div className="lg:col-span-2">
                {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
                <button onClick={handleAnalyze} disabled={!resumeText || extracting}
                  className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-10 py-3.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  <Sparkles className="w-5 h-5" /> Analyse Resume
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ANALYZING ── */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mb-5">
                <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Scanning your resume…</h2>
              <p className="text-sm text-text-muted max-w-sm">Checking keywords, formatting, section completeness and ATS compatibility</p>
            </motion.div>
          )}

          {/* ── REPORT ── */}
          {step === "report" && report && (
            <motion.div key="report" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Top bar */}
              <div className="flex items-center justify-between">
                <button onClick={() => setStep("input")}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> New scan
                </button>
                {jd && <span className="text-xs px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-medium">Company-specific score</span>}
              </div>

              {/* Hero score */}
              <div className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)" }}>
                <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
                <div className="relative p-8 flex flex-col sm:flex-row items-center gap-8">
                  <ScoreRing score={report.overallScore} size={140} />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">ATS Compatibility Score</p>
                    <p className="text-white text-lg font-semibold leading-relaxed max-w-lg">{report.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {[
                        { label: "Keywords found", val: report.keywordsFound.length, color: "#10b981" },
                        { label: "Missing keywords", val: report.keywordsMissing.length, color: "#f59e0b" },
                        { label: "Checks passed", val: report.formattingChecks.filter(c => c.passed).length, color: "#6366f1" },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <span style={{ color }} className="font-black text-lg">{val}</span>
                          <span className="text-white/40 text-xs ml-1.5">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Section scores */}
                <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-bg-border">
                    <h3 className="text-sm font-bold text-text">Section Scores</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {report.sections.map(sec => (
                      <div key={sec.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-text">{sec.name}</span>
                          <span className="text-sm font-black" style={{ color: sectionColor(sec.score) }}>{sec.score}</span>
                        </div>
                        <ScoreBar score={sec.score} color={sectionColor(sec.score)} />
                        <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{sec.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-green" />
                      <h3 className="text-sm font-bold text-text">Keywords Found <span className="text-accent-green font-black ml-1">{report.keywordsFound.length}</span></h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {report.keywordsFound.map(k => (
                        <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green">{k}</span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-orange" />
                      <h3 className="text-sm font-bold text-text">Missing Keywords <span className="text-accent-orange font-black ml-1">{report.keywordsMissing.length}</span></h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {report.keywordsMissing.map(k => (
                        <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-accent-orange/10 border border-accent-orange/20 text-accent-orange">{k}</span>
                      ))}
                      {report.keywordsMissing.length === 0 && <p className="text-xs text-text-muted">No missing keywords detected 🎉</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formatting checks */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border">
                  <h3 className="text-sm font-bold text-text">Formatting & ATS Compatibility</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.formattingChecks.map(fc => (
                    <div key={fc.check} className={`flex items-start gap-3 p-3 rounded-xl border ${fc.passed ? "bg-accent-green/5 border-accent-green/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${fc.passed ? "bg-accent-green/20" : "bg-red-500/20"}`}>
                        {fc.passed
                          ? <Check className="w-3 h-3 text-accent-green" />
                          : <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${fc.passed ? "text-accent-green" : "text-red-400"}`}>{fc.check}</p>
                        <p className="text-xs text-text-muted mt-0.5">{fc.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick wins */}
              <div className="glass-card rounded-2xl border border-amber-500/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-500/20 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-text">Quick Wins</h3>
                  <span className="text-xs text-text-muted">— fix these to boost your score fast</span>
                </div>
                <div className="p-5 space-y-2.5">
                  {report.quickWins.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-text">{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar Resumes RAG Section */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-text">Top matching resumes from knowledge base</h3>
                    <p className="text-xs text-text-muted">Similar high-scoring (90+) resumes found — used as patterns when building yours</p>
                  </div>
                  {fetchingSimilar && (
                    <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Fetching…
                    </div>
                  )}
                </div>

                {fetchingSimilar && (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-bg-card animate-pulse" />
                    ))}
                  </div>
                )}

                {!fetchingSimilar && similarResumes.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-text-muted">No similar resumes in the knowledge base yet.</p>
                    <p className="text-xs text-text-muted mt-1">The database grows as users submit high-scoring resumes. Build will still generate a great resume.</p>
                  </div>
                )}

                {!fetchingSimilar && similarResumes.length > 0 && (
                  <div className="p-4 space-y-3">
                    {similarResumes.map((r, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-bg-card border border-bg-border">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-primary">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-text">{r.roleType}</span>
                            <span className="text-xs font-bold text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded-full">{r.score} ATS</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {r.skills.slice(0, 6).map(s => (
                              <span key={s} className="text-xs text-text-muted bg-bg-border px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                          <p className="text-xs text-text-muted line-clamp-2">{r.contentPreview}</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-text-muted px-1">These patterns will be fed to Gemini when building your resume.</p>
                  </div>
                )}
              </div>

              {/* Build CTA */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent-cyan/10 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-text mb-1">Build an ATS-optimized resume</h3>
                    <p className="text-sm text-text-muted">
                      {similarResumes.length > 0
                        ? `Gemini will use ${similarResumes.length} high-scoring resume patterns + your data to generate an optimized single-page resume`
                        : `Gemini will rewrite your resume${jd ? " tailored for this role" : ""} using a professional LaTeX template`
                      }
                    </p>
                  </div>
                  <button onClick={() => handleBuild()} disabled={fetchingSimilar}
                    className="btn-primary shrink-0 flex items-center gap-2 px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                    <Sparkles className="w-4 h-4" />
                    {fetchingSimilar ? "Fetching patterns…" : "Build Resume"}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </motion.div>
          )}

          {/* ── BUILDING ── */}
          {step === "building" && (
            <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Building your resume…</h2>
              <p className="text-sm text-text-muted max-w-sm">Gemini is optimizing content, injecting keywords, and generating professional LaTeX code</p>
            </motion.div>
          )}

          {/* ── BUILT ── */}
          {step === "built" && latex && (
            <motion.div key="built" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Actions bar */}
              <div className="glass-card rounded-2xl border border-bg-border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-text mb-0.5">Resume ready</h2>
                  <p className="text-sm text-text-muted">Copy the LaTeX code or open directly in Overleaf to compile and download as PDF</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold glass border border-bg-border rounded-xl hover:border-primary/40 transition-all text-text">
                    {copied ? <><Check className="w-4 h-4 text-accent-green" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy LaTeX</>}
                  </button>

                  {/* Overleaf form POST — no API needed */}
                  <form ref={overleafRef} action="https://www.overleaf.com/docs" method="POST" target="_blank">
                    <input type="hidden" name="snip" value={latex} />
                    <button type="submit"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl transition-colors">
                      <ExternalLink className="w-4 h-4" /> Open in Overleaf
                    </button>
                  </form>
                </div>
              </div>

              {/* Overleaf instructions */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent-green/5 border border-accent-green/20">
                <ChevronRight className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">
                  Click <strong className="text-text">Open in Overleaf</strong> → a new Overleaf project opens with your resume pre-loaded → click the green <strong className="text-text">Compile</strong> button → download PDF from the viewer panel.
                </p>
              </div>

              {/* LaTeX code preview */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-3.5 border-b border-bg-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-text-muted font-mono ml-2">resume.tex</span>
                  </div>
                  <button onClick={handleCopy} className="text-xs text-text-muted hover:text-text transition-colors flex items-center gap-1">
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <div className="overflow-auto max-h-96 p-5">
                  <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">{latex}</pre>
                </div>
              </div>

              {/* Edit prompt */}
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-text">Request changes</h3>
                  <span className="text-xs text-text-muted">— generates a new version, replaces current</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && editPrompt.trim()) handleBuild(editPrompt); }}
                      placeholder='e.g. "Remove the summary section" · "Change email to x@y.com" · "Emphasize ML skills more"'
                      className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted/50 outline-none px-4 py-3 glass border border-bg-border rounded-xl focus:border-primary/50 transition-colors"
                    />
                    <button onClick={() => editPrompt.trim() && handleBuild(editPrompt)}
                      disabled={!editPrompt.trim()}
                      className="btn-primary px-5 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold shrink-0">
                      <Send className="w-4 h-4" /> Apply
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Remove summary", "Add more keywords", "Make it 1 page", "Stronger action verbs"].map(s => (
                      <button key={s} onClick={() => handleBuild(s)}
                        className="text-xs px-3 py-1.5 rounded-lg glass border border-bg-border hover:border-primary/40 text-text-muted hover:text-text transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("report")}
                  className="flex-1 py-3 text-sm font-semibold glass border border-bg-border rounded-2xl hover:border-primary/40 text-text-muted hover:text-primary transition-all">
                  ← Back to report
                </button>
                <button onClick={() => { setStep("input"); setReport(null); setLatex(""); setResumeFile(null); setResumeText(""); setJd(""); }}
                  className="flex-1 py-3 text-sm font-semibold glass border border-bg-border rounded-2xl hover:border-primary/40 text-text-muted hover:text-primary transition-all">
                  Start over
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
