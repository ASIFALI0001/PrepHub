"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import Image from "next/image";
import { useVapi, type RawTranscriptEntry } from "@/hooks/useVapi";
import type { IInterview } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
  userName: string;
}

function buildVariableValues(interview: IInterview & { _id: string }, userName: string) {
  const typeLabel = { technical: "technical", behavioral: "behavioral", mixed: "technical and behavioral" }[interview.type] ?? interview.type;
  const levelLabel = { beginner: "entry-level (0–2 yrs)", intermediate: "mid-level (2–5 yrs)", senior: "senior (5+ yrs)" }[interview.level] ?? interview.level;
  const questionsList = interview.questions
    .map((q, i) => `QUESTION ${i + 1}: ${q.text} [id:${q.id}]`)
    .join("\n");
  return { userName, role: interview.role, interviewType: typeLabel, level: levelLabel, totalQuestions: String(interview.questions.length), questionsList };
}

function buildFirstMessage(interview: IInterview & { _id: string }, userName: string): string {
  const typeLabel = { technical: "technical", behavioral: "behavioral", mixed: "mixed technical and behavioral" }[interview.type] ?? interview.type;
  const mins = interview.questions.length * 3;
  return `Hi ${userName}! Welcome to your PrepHub mock interview. Today we're doing a ${typeLabel} interview for the ${interview.role} role. I have ${interview.questions.length} questions prepared — expect about ${mins} minutes. I'll ask one follow-up if I need more depth. Take your time. Ready to start?`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function detectCurrentQuestion(transcript: { role: string; text: string }[]): number {
  let last = 0;
  for (const line of transcript) {
    if (line.role === "assistant") {
      const m = line.text.match(/QUESTION\s+(\d+)/i);
      if (m) last = parseInt(m[1], 10);
    }
  }
  return last;
}

// Animated sound wave bars
function SoundWave({ active, color = "bg-primary" }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[0.4, 0.7, 1, 0.7, 0.4, 0.6, 0.9].map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${color} ${active ? "animate-pulse" : "opacity-30"}`}
          style={{
            height: active ? `${Math.round(h * 20)}px` : "4px",
            animationDelay: `${i * 80}ms`,
            animationDuration: `${600 + i * 100}ms`,
            transition: "height 0.15s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function VapiInterviewSession({ interview, userName }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userSpeaking, setUserSpeaking] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const userSpeakingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscriptReady = useCallback(async (
    { transcript: rawTranscript }: { transcript: RawTranscriptEntry[]; questions: { id: string; text: string }[] }
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/interview/${interview._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vapiTranscript: rawTranscript }),
      });
      if (!res.ok) throw new Error("Submission failed");
      router.push(`/interview/${interview._id}/report`);
    } catch {
      setSubmitError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  }, [interview._id, router]);

  const { status, transcript, isSpeaking, startCall, endCall } = useVapi(
    interview.questions.map((q) => ({ id: q.id, text: q.text })),
    { onTranscriptReady: handleTranscriptReady, onError: (msg) => setSubmitError(msg) }
  );

  // Detect user speaking from incoming partial transcript lines
  useEffect(() => {
    const last = transcript[transcript.length - 1];
    if (last?.role === "user" && !last.final) {
      setUserSpeaking(true);
      if (userSpeakingTimer.current) clearTimeout(userSpeakingTimer.current);
      userSpeakingTimer.current = setTimeout(() => setUserSpeaking(false), 1500);
    }
  }, [transcript]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const currentQ = detectCurrentQuestion(transcript);
  const totalQ = interview.questions.length;
  const progress = totalQ > 0 ? Math.round((currentQ / totalQ) * 100) : 0;

  const alexActive = isSpeaking;
  const youActive = userSpeaking && !isSpeaking;

  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-5" />
          <h3 className="text-lg font-semibold text-text mb-2">Evaluating your performance…</h3>
          <p className="text-sm text-text-muted">Gemini AI is analysing your answers. This takes 10–20 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-bg-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text truncate">{interview.title}</h2>
            <p className="text-xs text-text-muted mt-0.5">{totalQ} questions · AI Voice Interview</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status badge */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              status === "active" ? "bg-accent-green/10 border-accent-green/30 text-accent-green" :
              status === "connecting" ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" :
              status === "ended" ? "bg-bg-border border-bg-border text-text-muted" :
              status === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
              "bg-bg-border border-bg-border text-text-muted"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === "active" ? "bg-accent-green animate-pulse" :
                status === "connecting" ? "bg-yellow-400 animate-pulse" :
                status === "error" ? "bg-red-400" : "bg-text-muted"
              }`} />
              {status === "idle" && "Ready"}
              {status === "connecting" && "Connecting"}
              {status === "active" && "Live"}
              {status === "ending" && "Ending"}
              {status === "ended" && "Done"}
              {status === "error" && "Error"}
            </div>

            {/* Controls */}
            {status === "idle" && (
              <button onClick={() => startCall(buildFirstMessage(interview, userName), buildVariableValues(interview, userName))}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-xs">
                <Phone className="w-3.5 h-3.5" /> Start Interview
              </button>
            )}
            {(status === "active" || status === "connecting") && (
              <button onClick={endCall}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-xs bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors">
                <PhoneOff className="w-3.5 h-3.5" /> End Call
              </button>
            )}
          </div>
        </div>

        {/* Question progress bar — shown once active */}
        {status === "active" && currentQ > 0 && (
          <div className="mt-3 pt-3 border-t border-bg-border">
            <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
              <span>Question {currentQ} of {totalQ}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-bg-border overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Connecting ────────────────────────────────────────────── */}
      {status === "connecting" && (
        <div className="glass-card rounded-2xl border border-bg-border p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">Setting up your interviewer…</p>
          <p className="text-xs text-text-muted">Alex will greet you in a moment</p>
        </div>
      )}

      {/* ── Speaker blocks ────────────────────────────────────────── */}
      {(status === "active" || status === "ended" || status === "ending") && (
        <div className="grid grid-cols-2 gap-4">

          {/* Alex block */}
          <div className={`glass-card rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
            alexActive
              ? "border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.2)] bg-primary/5"
              : "border-bg-border"
          }`}>
            {/* Photo */}
            <div className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
              alexActive ? "border-primary/60 shadow-[0_0_20px_rgba(139,92,246,0.35)]" : "border-bg-border"
            }`}>
              <Image src="/Alex.png" alt="Alex" fill className="object-cover" />
              {alexActive && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse" />
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <div className="text-sm font-semibold text-text">Alex</div>
              <div className="text-[10px] text-text-muted">AI Interviewer</div>
            </div>

            {/* Waveform / state */}
            <div className="h-6 flex items-center justify-center">
              {alexActive ? (
                <SoundWave active color="bg-primary" />
              ) : (
                <span className="text-[10px] text-text-muted">Listening…</span>
              )}
            </div>

            {alexActive && (
              <div className="text-[10px] font-medium text-primary animate-pulse">Speaking</div>
            )}
          </div>

          {/* You block */}
          <div className={`glass-card rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
            youActive
              ? "border-accent-green/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-accent-green/5"
              : "border-bg-border"
          }`}>
            {/* Initials avatar */}
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 text-xl font-black ${
              youActive
                ? "border-accent-green/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] bg-accent-green/15 text-accent-green"
                : "border-bg-border bg-bg-surface text-text-muted"
            }`}>
              {getInitials(userName)}
              {youActive && (
                <div className="absolute inset-0 rounded-2xl bg-accent-green/10 animate-pulse" />
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <div className="text-sm font-semibold text-text">{userName.split(" ")[0]}</div>
              <div className="text-[10px] text-text-muted">Candidate</div>
            </div>

            {/* Waveform / mic icon */}
            <div className="h-6 flex items-center justify-center">
              {youActive ? (
                <SoundWave active color="bg-accent-green" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-text-muted opacity-40" />
              )}
            </div>

            {youActive && (
              <div className="text-[10px] font-medium text-accent-green animate-pulse">Speaking</div>
            )}
          </div>
        </div>
      )}

      {/* ── Live transcript ───────────────────────────────────────── */}
      {(status === "active" || status === "ended" || status === "ending") && (
        <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bg-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Live Transcript</span>
            {status === "active" && (
              <span className="flex items-center gap-1.5 text-[10px] text-accent-green font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                Recording
              </span>
            )}
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-2.5">
            {transcript.length === 0 && (
              <p className="text-xs text-text-muted text-center pt-10">Transcript will appear here as you speak…</p>
            )}
            {transcript.map((line) => (
              <div key={line.id} className={`flex gap-2.5 ${line.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Mini avatar */}
                {line.role === "assistant" ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5 border border-primary/30">
                    <Image src="/Alex.png" alt="Alex" width={20} height={20} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-[8px] font-bold text-accent-green">
                    {getInitials(userName)}
                  </div>
                )}

                {/* Bubble */}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  line.role === "assistant"
                    ? "bg-bg-surface border border-bg-border text-text rounded-tl-sm"
                    : "bg-accent-green/10 border border-accent-green/20 text-text rounded-tr-sm"
                } ${!line.final ? "opacity-60 italic" : ""}`}>
                  {line.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* ── Idle start prompt ─────────────────────────────────────── */}
      {status === "idle" && (
        <div className="glass-card rounded-2xl border border-bg-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 border border-primary/30">
            <Image src="/Alex.png" alt="Alex" width={64} height={64} className="object-cover" />
          </div>
          <h3 className="text-base font-semibold text-text mb-1">Meet Alex</h3>
          <p className="text-xs text-text-muted mb-5 max-w-xs mx-auto">
            Your AI interviewer. Alex will ask {totalQ} questions, probe for depth with follow-ups, and evaluate your performance.
          </p>
          <button
            onClick={() => startCall(buildFirstMessage(interview, userName), buildVariableValues(interview, userName))}
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm"
          >
            <Phone className="w-4 h-4" /> Start Interview with Alex
          </button>
        </div>
      )}

      {submitError && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {submitError}
        </div>
      )}
    </div>
  );
}
