"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";

type Step = "greeting" | "role" | "type" | "level" | "count" | "confirm" | "generating";

type InterviewType = "technical" | "behavioral" | "mixed";
type InterviewLevel = "beginner" | "intermediate" | "senior";

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

  // Fire-and-forget: sets the text bubble and speaks in background, never blocks UI
  const say = (text: string) => {
    setAgentText(text);
    if (voiceMode) speak(text); // intentionally not awaited
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
    { value: "mixed", label: "Mixed", desc: "Combination of both" },
  ];

  const levelOptions: { value: InterviewLevel; label: string; desc: string }[] = [
    { value: "beginner", label: "Beginner", desc: "0–2 years experience" },
    { value: "intermediate", label: "Intermediate", desc: "2–5 years experience" },
    { value: "senior", label: "Senior", desc: "5+ years experience" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Agent bubble */}
      <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary text-lg">🤖</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1 font-medium">PrepHub AI</div>
            <p className="text-sm text-text leading-relaxed min-h-[40px]">
              {agentText || "Initializing…"}
            </p>
          </div>
        </div>

        {/* Voice toggle */}
        <div className="mt-4 pt-4 border-t border-bg-border flex items-center justify-between">
          <span className="text-xs text-text-muted">Voice readout (TTS)</span>
          <button
            onClick={() => setVoiceMode((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              voiceMode
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-bg-border/50 border-bg-border text-text-muted hover:text-text"
            }`}
          >
            {voiceMode ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Step: greeting */}
      {step === "greeting" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 text-center">
          <p className="text-sm text-text-muted mb-4">Ready to set up your mock interview?</p>
          <button
            onClick={goRole}
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium"
          >
            Let's start <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step: role */}
      {step === "role" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <label className="block text-sm font-medium text-text">What role are you interviewing for?</label>
          <input
            className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            placeholder="e.g. Software Engineer, Data Scientist, PM…"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && role.trim() && goType()}
            autoFocus
          />
          <button
            onClick={() => goType()}
            disabled={!role.trim()}
            className="btn-primary w-full py-2.5 rounded-xl font-medium disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step: type */}
      {step === "type" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <label className="block text-sm font-medium text-text mb-1">Interview type</label>
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setType(opt.value); goLevel(opt.value); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                type === opt.value
                  ? "border-primary/50 bg-primary/10"
                  : "border-bg-border hover:border-primary/30 hover:bg-bg-surface"
              }`}
            >
              <div className="text-sm font-medium text-text">{opt.label}</div>
              <div className="text-xs text-text-muted">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step: level */}
      {step === "level" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-3">
          <label className="block text-sm font-medium text-text mb-1">Your experience level</label>
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setLevel(opt.value); goCount(opt.value); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                level === opt.value
                  ? "border-primary/50 bg-primary/10"
                  : "border-bg-border hover:border-primary/30 hover:bg-bg-surface"
              }`}
            >
              <div className="text-sm font-medium text-text">{opt.label}</div>
              <div className="text-xs text-text-muted">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step: count */}
      {step === "count" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <label className="block text-sm font-medium text-text">Number of questions</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount((c) => Math.max(3, c - 1))}
              className="w-10 h-10 rounded-xl bg-bg-border hover:bg-bg-border/80 flex items-center justify-center text-text font-bold text-lg"
            >−</button>
            <span className="text-3xl font-bold text-primary w-12 text-center">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(15, c + 1))}
              className="w-10 h-10 rounded-xl bg-bg-border hover:bg-bg-border/80 flex items-center justify-center text-text font-bold text-lg"
            >+</button>
          </div>
          <input
            type="range"
            min={3}
            max={15}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>3 min</span><span>15 max</span>
          </div>
          <button
            onClick={goConfirm}
            className="btn-primary w-full py-2.5 rounded-xl font-medium"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step: confirm */}
      {step === "confirm" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text">Interview Summary</h3>
          <div className="space-y-2">
            {[
              { label: "Role", value: role },
              { label: "Type", value: type.charAt(0).toUpperCase() + type.slice(1) },
              { label: "Level", value: level.charAt(0).toUpperCase() + level.slice(1) },
              { label: "Questions", value: `${count}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-text-muted">{label}</span>
                <span className="text-text font-medium">{value}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setStep("role"); say("Let's adjust. What role are you interviewing for?"); }}
              className="flex-1 py-2.5 rounded-xl border border-bg-border text-sm text-text-muted hover:text-text transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 btn-primary py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Generate Interview"}
            </button>
          </div>
        </div>
      )}

      {/* Step: generating */}
      {step === "generating" && (
        <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text mb-1">Generating your interview…</h3>
          <p className="text-sm text-text-muted">Gemini AI is crafting {count} personalized questions for a {role} role.</p>
        </div>
      )}
    </div>
  );
}
