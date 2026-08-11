"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ChevronRight, Volume2, VolumeX, Minus, Plus, Bot, AlertCircle, Sparkles } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { easeOutExpo } from "@/lib/motion";

type Step = "greeting" | "role" | "type" | "level" | "count" | "confirm" | "generating";

type InterviewType = "technical" | "behavioral" | "mixed";
type InterviewLevel = "beginner" | "intermediate" | "senior";

const STEP_ORDER: Step[] = ["role", "type", "level", "count", "confirm"];

// Motion for step swap
const stepVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutExpo } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

export default function InterviewSetupWizard() {
  const router = useRouter();
  const { speak } = useSpeech();
  const [step, setStep] = useState<Step>("greeting");
  const [role, setRole] = useState("");
  const [type, setType] = useState<InterviewType>("mixed");
  const [level, setLevel] = useState<InterviewLevel>("intermediate");
  const [count, setCount] = useState(5);
  const [agentText, setAgentText] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const say = (text: string) => {
    setAgentText(text);
    if (voiceMode) speak(text);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    say("Hi! I'm your PrepHub interview agent. Let's set up your mock interview.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goRole = () => {
    say("Great! What role are you interviewing for? For example: Software Engineer, Data Scientist, or Product Manager.");
    setStep("role");
  };
  const goType = (r?: string) => {
    const usedRole = r ?? role;
    say(`Got it — ${usedRole}. What type of interview do you want?`);
    setStep("type");
  };
  const goLevel = (t?: InterviewType) => {
    const usedType = t ?? type;
    say(`${usedType.charAt(0).toUpperCase() + usedType.slice(1)} interview. What's your experience level?`);
    setStep("level");
  };
  const goCount = (l?: InterviewLevel) => {
    const usedLevel = l ?? level;
    say(`${usedLevel.charAt(0).toUpperCase() + usedLevel.slice(1)} level. How many questions?`);
    setStep("count");
  };
  const goConfirm = () => {
    say(`Perfect! ${role} · ${type} · ${level} · ${count} questions. Ready to generate?`);
    setStep("confirm");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStep("generating");
    say("Generating your personalized interview with Gemini AI. This will take a few seconds.");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, type, level, questionCount: count }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }
      const { interview } = await res.json();
      router.push(`/interview/${interview._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
      setStep("confirm");
    }
  };

  const typeOptions: { value: InterviewType; label: string; desc: string }[] = [
    { value: "technical", label: "Technical", desc: "Coding, system design, domain knowledge" },
    { value: "behavioral", label: "Behavioral", desc: "STAR method, soft skills, past experience" },
    { value: "mixed", label: "Mixed", desc: "A combination of both" },
  ];
  const levelOptions: { value: InterviewLevel; label: string; desc: string }[] = [
    { value: "beginner", label: "Beginner", desc: "0–2 years experience" },
    { value: "intermediate", label: "Intermediate", desc: "2–5 years experience" },
    { value: "senior", label: "Senior", desc: "5+ years experience" },
  ];

  const activeStepIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress stepper */}
      {activeStepIdx >= 0 && (
        <div className="flex items-center gap-1.5 mb-6">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full bg-bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= activeStepIdx ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Agent bubble */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-muted mb-1 font-medium flex items-center gap-1.5">
              PrepHub AI <span className="w-1 h-1 rounded-full bg-accent-green" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={agentText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-sm text-text leading-relaxed min-h-[40px]"
              >
                {agentText || "Initializing…"}
              </motion.p>
            </AnimatePresence>
          </div>
          <button
            onClick={() => setVoiceMode((v) => !v)}
            aria-label="Toggle voice readout"
            className={`self-start w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
              voiceMode ? "bg-primary/10 border-primary/30 text-primary" : "border-bg-border text-text-muted hover:text-text"
            }`}
          >
            {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div key={step} variants={stepVariants} initial="enter" animate="center" exit="exit">
          {step === "greeting" && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-text mb-1.5">Ready to set up your mock interview?</h3>
              <p className="text-sm text-text-muted mb-5">Five quick questions — takes about 30 seconds.</p>
              <button onClick={goRole} className="btn-primary inline-flex gap-2">
                Let&apos;s start <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "role" && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <label className="block text-sm font-medium text-text">What role are you interviewing for?</label>
              <input
                className="w-full bg-bg-surface border border-bg-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. Software Engineer, Data Scientist, PM…"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && role.trim() && goType()}
                autoFocus
              />
              <button onClick={() => goType()} disabled={!role.trim()} className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                Continue
              </button>
            </div>
          )}

          {step === "type" && (
            <OptionList
              label="Interview type"
              options={typeOptions}
              selected={type}
              onSelect={(v) => { setType(v as InterviewType); goLevel(v as InterviewType); }}
            />
          )}

          {step === "level" && (
            <OptionList
              label="Your experience level"
              options={levelOptions}
              selected={level}
              onSelect={(v) => { setLevel(v as InterviewLevel); goCount(v as InterviewLevel); }}
            />
          )}

          {step === "count" && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <label className="block text-sm font-medium text-text">How many questions?</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setCount((c) => Math.max(3, c - 1))}
                  className="w-11 h-11 rounded-xl border border-bg-border bg-bg-surface hover:bg-bg-card flex items-center justify-center text-text transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="tnum text-5xl font-bold text-text w-16 text-center">{count}</span>
                <button onClick={() => setCount((c) => Math.min(15, c + 1))}
                  className="w-11 h-11 rounded-xl border border-bg-border bg-bg-surface hover:bg-bg-card flex items-center justify-center text-text transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <input type="range" min={3} max={15} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-[rgb(var(--accent))]" />
              <div className="flex justify-between text-xs text-text-muted"><span>3 min</span><span>15 max</span></div>
              <button onClick={goConfirm} className="btn-primary w-full justify-center">Continue</button>
            </div>
          )}

          {step === "confirm" && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-text">Review your interview</h3>
              <dl className="rounded-xl border border-bg-border divide-y divide-bg-border overflow-hidden">
                {[
                  { label: "Role", value: role },
                  { label: "Type", value: type.charAt(0).toUpperCase() + type.slice(1) },
                  { label: "Level", value: level.charAt(0).toUpperCase() + level.slice(1) },
                  { label: "Questions", value: `${count}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 bg-bg-surface/40">
                    <dt className="text-sm text-text-muted">{label}</dt>
                    <dd className="text-sm text-text font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {error && (
                <p className="flex items-center gap-2 text-xs text-accent-pink bg-accent-pink/10 border border-accent-pink/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep("role"); say("Let's adjust. What role are you interviewing for?"); }}
                  className="btn-ghost flex-1 justify-center">Edit</button>
                <button onClick={handleGenerate} disabled={generating}
                  className="btn-primary flex-1 justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate</>}
                </button>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="glass-card rounded-2xl p-10 text-center relative overflow-hidden">
              <div className="grid-backdrop absolute inset-0 opacity-60" />
              <div className="relative">
                <div className="relative w-14 h-14 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
                  <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-text mb-1">Crafting your interview…</h3>
                <p className="text-sm text-text-muted">Gemini is writing {count} tailored questions for a {role} role.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OptionList({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { value: string; label: string; desc: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-2.5">
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(opt.value)}
            className={`group w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
              active ? "border-primary/50 bg-primary/5 ring-4 ring-primary/10" : "border-bg-border hover:border-text-dim/30 hover:bg-bg-surface"
            }`}
          >
            <span>
              <span className="block text-sm font-medium text-text">{opt.label}</span>
              <span className="block text-xs text-text-muted mt-0.5">{opt.desc}</span>
            </span>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${active ? "text-primary" : "text-text-dim opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"}`} />
          </motion.button>
        );
      })}
    </div>
  );
}
