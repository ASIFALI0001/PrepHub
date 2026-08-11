"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Github, ChevronRight, Loader2, CheckCircle,
  FileText, ArrowRight, Compass, BarChart3, ShieldCheck,
} from "lucide-react";
import type { ICareerPath } from "@/models/CareerGuide";

const QUESTIONS = [
  {
    id: "priority",
    text: "What matters most to you right now?",
    options: ["High salary ASAP", "Deep technical expertise", "Leadership & business impact", "Research & innovation"],
  },
  {
    id: "fiveYears",
    text: "Where do you see yourself in 5 years?",
    options: ["Senior SWE at a product company", "Engineering Manager / Tech Lead", "Data Scientist / ML Engineer", "Researcher or in academia"],
  },
  {
    id: "moreStudy",
    text: "How do you feel about studying 2+ more years before working full-time?",
    options: ["Totally fine if ROI is clear", "Only if stipend or scholarship covered", "Prefer to work first, study later", "Want to start working ASAP"],
  },
  {
    id: "techInterest",
    text: "Which area excites you most technically?",
    options: ["Large-scale systems & backend", "Machine Learning & AI", "Data analysis & insights", "Security / low-level systems"],
  },
  {
    id: "abroad",
    text: "How important is working or studying abroad?",
    options: ["Top priority — want to go abroad", "Open to it but not a must", "Prefer to stay in India", "No strong preference"],
  },
  {
    id: "academics",
    text: "How would you describe your academic performance?",
    options: ["Top performer (8.5+ CGPA)", "Above average (7.5–8.5 CGPA)", "Average (6.5–7.5 CGPA)", "Below average (below 6.5 CGPA)"],
  },
  {
    id: "problemType",
    text: "What kind of problems do you enjoy solving?",
    options: ["Algorithmic / competitive programming", "Real-world product problems", "Research & open-ended problems", "Business & strategy problems"],
  },
  {
    id: "finance",
    text: "What is your financial situation regarding further education?",
    options: ["Can self-fund or family support", "Need scholarship or stipend", "Prefer to earn first then study", "Not willing to spend more on education"],
  },
];

type Step = "upload" | "questions" | "analyzing" | "options";

const scoreColor = (s: number) =>
  s >= 70 ? "text-accent-green" : s >= 50 ? "text-accent-orange" : "text-text-muted";

export default function CareerGuideWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [resumeText, setResumeText] = useState("");

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

  const [usePlatformData, setUsePlatformData] = useState(true);
  const [guideId, setGuideId] = useState<string>("");
  const [careerOptions, setCareerOptions] = useState<ICareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: Upload resume ────────────────────────────────────────────────

  async function handleResumeChange(file: File) {
    setResumeFile(file);
    setExtracting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/career-guide/parse-resume", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.text) setResumeText(data.text);
      else setError("Could not read resume. Try a text-based PDF.");
    } catch {
      setError("Failed to parse resume.");
    } finally {
      setExtracting(false);
    }
  }

  function handleProceedToQuestions() {
    if (!resumeText) { setError("Please upload your resume first."); return; }
    setError("");
    setStep("questions");
  }

  // ── Step 2: MCQ questions ────────────────────────────────────────────────

  function handleAnswer(answer: string) {
    const q = QUESTIONS[qIndex];
    const newAnswers = [...answers, { question: q.text, answer }];
    setAnswers(newAnswers);

    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1);
    } else {
      runAnalysis(newAnswers);
    }
  }

  // ── Step 3: Analyze ──────────────────────────────────────────────────────

  async function runAnalysis(mcqAnswers: { question: string; answer: string }[]) {
    setStep("analyzing");
    setError("");
    try {
      const res = await fetch("/api/career-guide/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText, githubUrl, mcqAnswers, usePlatformData }),
      });
      const data = await res.json();
      if (data.careerOptions) {
        setGuideId(data.guideId);
        setCareerOptions(data.careerOptions);
        setStep("options");
      } else {
        setError(data.error ?? "Analysis failed.");
        setStep("upload");
      }
    } catch {
      setError("Analysis failed. Please try again.");
      setStep("upload");
    }
  }

  // ── Step 4: Generate roadmap ─────────────────────────────────────────────

  async function handleGenerateRoadmap() {
    if (!selectedPath) return;
    setGeneratingRoadmap(true);
    setError("");
    try {
      const res = await fetch("/api/career-guide/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chosenPath: selectedPath, guideId }),
      });
      const data = await res.json();
      if (data.roadmap) {
        router.push(`/career-guide/roadmap?id=${guideId}`);
      } else {
        setError(data.error ?? "Roadmap generation failed.");
        setGeneratingRoadmap(false);
      }
    } catch {
      setError("Roadmap generation failed.");
      setGeneratingRoadmap(false);
    }
  }

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "questions", "analyzing", "options"] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all duration-500 ${
              step === s ? "bg-primary" :
              (["upload", "questions", "analyzing", "options"].indexOf(step) > i) ? "bg-primary/40" : "bg-bg-border"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Upload step ── */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-accent-cyan" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-text">Career Guide</h1>
                  <p className="text-sm text-text-muted">Step 1 of 3 — Upload your profile</p>
                </div>
              </div>

              {/* Resume upload */}
              <div className="glass-card rounded-2xl border border-bg-border p-6 mb-4">
                <label className="block text-sm font-semibold text-text mb-3">Resume (PDF) *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    resumeFile ? "border-accent-green/40 bg-accent-green/5" : "border-bg-border hover:border-primary/40"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleResumeChange(e.target.files[0]); }}
                  />
                  {extracting ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                      <p className="text-sm text-text-muted">Reading resume…</p>
                    </div>
                  ) : resumeFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-7 h-7 text-accent-green" />
                      <p className="text-sm font-medium text-text">{resumeFile.name}</p>
                      <p className="text-xs text-text-muted">Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-7 h-7 text-text-muted" />
                      <p className="text-sm font-medium text-text">Click to upload PDF</p>
                      <p className="text-xs text-text-muted">Max 10MB · Text-based PDF works best</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub URL */}
              <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
                <label className="block text-sm font-semibold text-text mb-1">GitHub Profile URL <span className="text-text-muted font-normal">(optional)</span></label>
                <p className="text-xs text-text-muted mb-3">We&apos;ll fetch your repos and languages via GitHub API — no login needed</p>
                <div className="flex items-center gap-3 glass border border-bg-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                  <Github className="w-4 h-4 text-text-muted shrink-0" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
                  />
                </div>
              </div>

              {/* Platform data toggle */}
              <div className="glass-card rounded-2xl border border-bg-border p-5 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${usePlatformData ? "bg-accent-green/10 border-accent-green/20 text-accent-green" : "bg-bg-surface border-bg-border text-text-muted"}`}>
                      {usePlatformData ? <ShieldCheck className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">Include PrepHub profile data</p>
                      <p className="text-xs text-text-muted">Quiz scores, interview history, companies researched</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUsePlatformData(!usePlatformData)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${usePlatformData ? "bg-accent-green" : "bg-bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${usePlatformData ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-accent-pink mb-4">{error}</p>}

              <button
                onClick={handleProceedToQuestions}
                disabled={!resumeText || extracting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to assessment <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Questions step ── */}
          {step === "questions" && (
            <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Question {qIndex + 1} of {QUESTIONS.length}</p>
                  <p className="text-xs text-text-muted">{Math.round(((qIndex) / QUESTIONS.length) * 100)}% done</p>
                </div>
                <div className="w-full h-1.5 bg-bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(qIndex / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
                <h2 className="text-lg font-bold text-text mb-6">{QUESTIONS[qIndex].text}</h2>
                <div className="space-y-3">
                  {QUESTIONS[qIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="w-full text-left px-5 py-4 rounded-xl border border-bg-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-text font-medium group flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0 ml-3" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Analyzing step ── */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Analyzing your profile…</h2>
              <p className="text-sm text-text-muted max-w-sm">
                Gemini is reviewing your resume, GitHub activity, platform performance, and preferences to find the best paths for you.
              </p>
              <div className="mt-8 space-y-2 text-left w-full max-w-xs">
                {["Reading resume & GitHub data", "Checking platform performance", "Matching to career paths", "Scoring & ranking options"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Options step ── */}
          {step === "options" && (
            <motion.div key="options" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Your career options</h2>
                  <p className="text-sm text-text-muted">Select one to generate your personalized roadmap</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {careerOptions.map((opt) => (
                  <button
                    key={opt.path}
                    onClick={() => setSelectedPath(opt.path)}
                    className={`w-full text-left rounded-2xl border p-5 transition-all ${
                      selectedPath === opt.path
                        ? "border-primary/60 bg-primary/5 shadow-glow"
                        : "border-bg-border glass-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-base font-bold text-text">{opt.path}</span>
                          {selectedPath === opt.path && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Selected</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">Specialization: {opt.specialization}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-2xl font-black ${scoreColor(opt.score)}`}>{opt.score}%</div>
                        <div className="text-xs text-text-muted">match</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="w-full h-1.5 bg-bg-border rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${opt.score >= 70 ? "bg-accent-green" : opt.score >= 50 ? "bg-accent-orange" : "bg-text-muted/30"}`}
                        style={{ width: `${opt.score}%` }}
                      />
                    </div>

                    <p className="text-sm text-text-muted mb-3">{opt.reasoning}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-accent-green mb-1.5">Pros</p>
                        <ul className="space-y-1">
                          {opt.pros.map((p) => <li key={p} className="text-xs text-text-muted flex gap-1.5"><span className="text-accent-green mt-px">+</span>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-accent-orange mb-1.5">Cons</p>
                        <ul className="space-y-1">
                          {opt.cons.map((c) => <li key={c} className="text-xs text-text-muted flex gap-1.5"><span className="text-accent-orange mt-px">−</span>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-accent-pink mb-4">{error}</p>}

              <button
                onClick={handleGenerateRoadmap}
                disabled={!selectedPath || generatingRoadmap}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingRoadmap ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating roadmap…</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Generate roadmap for {selectedPath || "selected path"}</>
                )}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
