"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, CheckCircle, Loader2, FileText, Zap,
  Copy, ExternalLink, Check, ChevronRight, AlertTriangle, RefreshCw,
  ClipboardList, Sparkles, Send,
} from "lucide-react";
import type { ATSReport, SimilarResume } from "@/lib/ats";
import PageHeader from "@/components/ui/PageHeader";
import { scoreTheme } from "@/lib/score";
import { easeOutExpo } from "@/lib/motion";

type Step = "input" | "analyzing" | "report" | "building" | "built";

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const t = scoreTheme(score);
  const r = size * 0.4, c = size / 2, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={size * 0.07} className="text-bg-border" />
        <motion.circle
          cx={c} cy={c} r={r} fill="none" strokeWidth={size * 0.07} strokeLinecap="round" className={t.ring}
          initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`tnum font-bold ${t.text}`} style={{ fontSize: size * 0.24 }}>{score}</span>
        <span className="text-xs text-text-muted font-medium mt-0.5">{t.label}</span>
      </div>
    </div>
  );
}

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
        fetchSimilarResumes();
      } else { setError(data.error ?? "Analysis failed."); setStep("input"); }
    } catch {
      setError("Analysis failed. Please try again.");
      setStep("input");
    }
  }

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
      /* Silent — vector search is enhancement, not critical */
    } finally {
      setFetchingSimilar(false);
    }
  }

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
    <main className="pt-24 pb-24 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Resume optimization"
          icon={<ClipboardList />}
          title="ATS Resume Checker"
          description="Score your resume, fix the gaps, and build an ATS-optimized version."
        />

        <AnimatePresence mode="wait">
          {/* ── INPUT ── */}
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">Resume PDF <span className="text-accent-pink">*</span></h2>
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
                        <div className="w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center text-text-muted">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-text">Click to upload PDF</p>
                        <p className="text-xs text-text-muted">Text-based PDF works best</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <Zap className="w-4 h-4 text-accent-cyan" />
                  <div>
                    <h2 className="text-sm font-bold text-text">Job description / role <span className="text-text-muted font-normal">(optional)</span></h2>
                    <p className="text-xs text-text-muted">Add for company-specific ATS scoring</p>
                  </div>
                </div>
                <div className="p-5">
                  <textarea value={jd} onChange={e => setJd(e.target.value)}
                    placeholder={`Paste a job description, or just type:\n"SDE Intern at Google"\n"Backend Engineer at a fintech startup"\n"ML Engineer — must know PyTorch, distributed training"`}
                    className="w-full h-48 bg-transparent text-sm text-text placeholder:text-text-dim outline-none resize-none leading-relaxed" />
                </div>
              </div>

              <div className="lg:col-span-2">
                {error && <p className="text-sm text-accent-pink mb-3">{error}</p>}
                <button onClick={handleAnalyze} disabled={!resumeText || extracting}
                  className="w-full sm:w-auto btn-primary text-base px-8 py-3.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Sparkles className="w-5 h-5" /> Analyse resume
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ANALYZING ── */}
          {step === "analyzing" && (
            <LoadingState key="analyzing" accent="text-accent-green" ringBg="bg-accent-green/10 border-accent-green/20"
              title="Scanning your resume…" sub="Checking keywords, formatting, section completeness and ATS compatibility." />
          )}

          {/* ── REPORT ── */}
          {step === "report" && report && (
            <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep("input")} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> New scan
                </button>
                {jd && <span className="chip !text-accent-cyan !border-accent-cyan/20 !bg-accent-cyan/10">Company-specific score</span>}
              </div>

              {/* Hero score */}
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="grid-backdrop absolute inset-0 opacity-70" />
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
                  <ScoreRing score={report.overallScore} size={140} />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="eyebrow mb-2">ATS compatibility score</p>
                    <p className="text-text text-base sm:text-lg font-medium leading-relaxed max-w-lg">{report.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {[
                        { label: "Keywords found", val: report.keywordsFound.length, cls: "text-accent-green" },
                        { label: "Missing keywords", val: report.keywordsMissing.length, cls: "text-accent-orange" },
                        { label: "Checks passed", val: report.formattingChecks.filter(c => c.passed).length, cls: "text-primary" },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="px-3.5 py-2 rounded-xl bg-bg-surface border border-bg-border">
                          <span className={`tnum font-bold text-lg ${cls}`}>{val}</span>
                          <span className="text-text-muted text-xs ml-1.5">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Section scores */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-bg-border"><h3 className="text-sm font-bold text-text">Section scores</h3></div>
                  <div className="p-5 space-y-4">
                    {report.sections.map(sec => {
                      const t = scoreTheme(sec.score);
                      return (
                        <div key={sec.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-text">{sec.name}</span>
                            <span className={`tnum text-sm font-bold ${t.text}`}>{sec.score}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-bg-surface overflow-hidden">
                            <motion.div className={`h-full rounded-full ${t.bar}`}
                              initial={{ width: 0 }} animate={{ width: `${sec.score}%` }} transition={{ duration: 0.8, ease: easeOutExpo }} />
                          </div>
                          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{sec.feedback}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-green" />
                      <h3 className="text-sm font-bold text-text">Keywords found <span className="tnum text-accent-green font-bold ml-1">{report.keywordsFound.length}</span></h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {report.keywordsFound.map(k => (
                        <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-md bg-accent-green/10 border border-accent-green/20 text-accent-green">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-orange" />
                      <h3 className="text-sm font-bold text-text">Missing keywords <span className="tnum text-accent-orange font-bold ml-1">{report.keywordsMissing.length}</span></h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {report.keywordsMissing.map(k => (
                        <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-md bg-accent-orange/10 border border-accent-orange/20 text-accent-orange">{k}</span>
                      ))}
                      {report.keywordsMissing.length === 0 && <p className="text-xs text-text-muted">No missing keywords detected.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formatting checks */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border"><h3 className="text-sm font-bold text-text">Formatting & ATS compatibility</h3></div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.formattingChecks.map(fc => (
                    <div key={fc.check} className={`flex items-start gap-3 p-3 rounded-xl border ${fc.passed ? "bg-accent-green/5 border-accent-green/20" : "bg-accent-pink/5 border-accent-pink/20"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${fc.passed ? "bg-accent-green/20" : "bg-accent-pink/20"}`}>
                        {fc.passed ? <Check className="w-3 h-3 text-accent-green" /> : <AlertTriangle className="w-3 h-3 text-accent-pink" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${fc.passed ? "text-accent-green" : "text-accent-pink"}`}>{fc.check}</p>
                        <p className="text-xs text-text-muted mt-0.5">{fc.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick wins */}
              <div className="glass-card rounded-2xl overflow-hidden border-accent-orange/20">
                <div className="px-6 py-4 border-b border-accent-orange/20 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent-orange" />
                  <h3 className="text-sm font-bold text-text">Quick wins</h3>
                  <span className="text-xs text-text-muted">— fix these to boost your score fast</span>
                </div>
                <div className="p-5 space-y-2.5">
                  {report.quickWins.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="tnum w-5 h-5 rounded-md bg-accent-orange/15 border border-accent-orange/25 text-accent-orange text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-text">{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Similar resumes (RAG) */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Sparkles className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-text">Top matching resumes from knowledge base</h3>
                    <p className="text-xs text-text-muted">Similar high-scoring (90+) resumes — used as patterns when building yours</p>
                  </div>
                  {fetchingSimilar && (
                    <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Fetching…
                    </div>
                  )}
                </div>

                {fetchingSimilar && (
                  <div className="p-5 space-y-3">
                    {[0, 1, 2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
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
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-bg-surface border border-bg-border">
                        <div className="tnum w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">#{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-text">{r.roleType}</span>
                            <span className="tnum text-xs font-bold text-accent-green bg-accent-green/10 border border-accent-green/20 px-2 py-0.5 rounded-md">{r.score} ATS</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {r.skills.slice(0, 6).map(s => <span key={s} className="text-xs text-text-muted bg-bg-card border border-bg-border px-2 py-0.5 rounded">{s}</span>)}
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
              <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.04] p-6">
                <div className="grid-backdrop absolute inset-0 opacity-60" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-text mb-1">Build an ATS-optimized resume</h3>
                    <p className="text-sm text-text-muted max-w-lg">
                      {similarResumes.length > 0
                        ? `Gemini will use ${similarResumes.length} high-scoring resume patterns + your data to generate an optimized single-page resume.`
                        : `Gemini will rewrite your resume${jd ? " tailored for this role" : ""} using a professional LaTeX template.`}
                    </p>
                  </div>
                  <button onClick={() => handleBuild()} disabled={fetchingSimilar} className="btn-primary shrink-0 gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    <Sparkles className="w-4 h-4" /> {fetchingSimilar ? "Fetching patterns…" : "Build resume"}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-accent-pink">{error}</p>}
            </motion.div>
          )}

          {/* ── BUILDING ── */}
          {step === "building" && (
            <LoadingState key="building" accent="text-primary" ringBg="bg-primary/10 border-primary/20"
              title="Building your resume…" sub="Gemini is optimizing content, injecting keywords, and generating professional LaTeX." />
          )}

          {/* ── BUILT ── */}
          {step === "built" && latex && (
            <motion.div key="built" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-text mb-0.5">Resume ready</h2>
                  <p className="text-sm text-text-muted">Copy the LaTeX or open directly in Overleaf to compile and download as PDF.</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button onClick={handleCopy} className="btn-ghost gap-2">
                    {copied ? <><Check className="w-4 h-4 text-accent-green" /> Copied</> : <><Copy className="w-4 h-4" /> Copy LaTeX</>}
                  </button>
                  <form ref={overleafRef} action="https://www.overleaf.com/docs" method="POST" target="_blank">
                    <input type="hidden" name="snip" value={latex} />
                    <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#12805c] hover:bg-[#0d6b4d] text-white rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" /> Open in Overleaf
                    </button>
                  </form>
                </div>
              </div>

              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent-green/5 border border-accent-green/20">
                <ChevronRight className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">
                  Click <strong className="text-text">Open in Overleaf</strong> → a new project opens with your resume pre-loaded → click the green <strong className="text-text">Compile</strong> button → download the PDF from the viewer.
                </p>
              </div>

              {/* LaTeX preview */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-3 border-b border-bg-border flex items-center justify-between bg-bg-surface/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-accent-orange/60" />
                      <span className="w-3 h-3 rounded-full bg-accent-green/50" />
                      <span className="w-3 h-3 rounded-full bg-bg-border" />
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
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-text">Request changes</h3>
                  <span className="text-xs text-text-muted">— generates a new version, replaces current</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && editPrompt.trim()) handleBuild(editPrompt); }}
                      placeholder='e.g. "Remove the summary" · "Change email to x@y.com" · "Emphasize ML skills"'
                      className="flex-1 bg-bg-surface text-sm text-text placeholder:text-text-dim outline-none px-4 py-2.5 border border-bg-border rounded-lg focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all" />
                    <button onClick={() => editPrompt.trim() && handleBuild(editPrompt)} disabled={!editPrompt.trim()}
                      className="btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                      <Send className="w-4 h-4" /> Apply
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Remove summary", "Add more keywords", "Make it 1 page", "Stronger action verbs"].map(s => (
                      <button key={s} onClick={() => handleBuild(s)} className="chip hover:border-text-dim/40 hover:text-text transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("report")} className="btn-ghost flex-1 justify-center">← Back to report</button>
                <button onClick={() => { setStep("input"); setReport(null); setLatex(""); setResumeFile(null); setResumeText(""); setJd(""); }}
                  className="btn-ghost flex-1 justify-center">Start over</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function LoadingState({ accent, ringBg, title, sub }: { accent: string; ringBg: string; title: string; sub: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="relative w-16 h-16 mb-5">
        <div className={`absolute inset-0 rounded-2xl ${ringBg.split(" ")[0]} animate-ping`} />
        <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center ${ringBg} ${accent}`}>
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-text mb-2">{title}</h2>
      <p className="text-sm text-text-muted max-w-sm">{sub}</p>
    </motion.div>
  );
}
