"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
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

  return {
    userName,
    role: interview.role,
    interviewType: typeLabel,
    level: levelLabel,
    totalQuestions: String(interview.questions.length),
    questionsList,
  };
}

function buildFirstMessage(interview: IInterview & { _id: string }, userName: string): string {
  const typeLabel = { technical: "technical", behavioral: "behavioral", mixed: "mixed technical and behavioral" }[interview.type] ?? interview.type;
  const mins = interview.questions.length * 3;
  return `Hi ${userName}! Welcome to your PrepHub mock interview. Today we're doing a ${typeLabel} interview for the ${interview.role} role. I have ${interview.questions.length} questions prepared — expect about ${mins} minutes. I'll ask one follow-up if I need more depth on an answer. Take your time. Ready to start?`;
}

export default function VapiInterviewSession({ interview, userName }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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
      setSubmitError("Failed to submit interview. Please try again.");
      setSubmitting(false);
    }
  }, [interview._id, router]);

  const { status, transcript, isSpeaking, startCall, endCall } = useVapi(
    interview.questions.map((q) => ({ id: q.id, text: q.text })),
    { onTranscriptReady: handleTranscriptReady, onError: (msg) => setSubmitError(msg) }
  );

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleStart = () => {
    startCall(
      buildFirstMessage(interview, userName),
      buildVariableValues(interview, userName)
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Interview info bar */}
      <div className="glass-card rounded-2xl border border-bg-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-text">{interview.title}</h2>
            <p className="text-xs text-text-muted mt-0.5">{interview.questions.length} questions · Vapi AI Agent</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
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
            {status === "idle" && "Not started"}
            {status === "connecting" && "Connecting…"}
            {status === "active" && "Live"}
            {status === "ending" && "Ending…"}
            {status === "ended" && "Ended"}
            {status === "error" && "Error"}
          </div>
        </div>

        {/* Call controls */}
        <div className="flex gap-3">
          {status === "idle" && (
            <button
              onClick={handleStart}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
            >
              <Phone className="w-4 h-4" />
              Start Vapi Interview
            </button>
          )}
          {(status === "active" || status === "connecting") && (
            <button
              onClick={endCall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          )}
        </div>
      </div>

      {/* Connecting state */}
      {status === "connecting" && (
        <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-text mb-1">Connecting to Vapi AI…</p>
          <p className="text-xs text-text-muted">Setting up your interviewer Alex</p>
        </div>
      )}

      {/* Live transcript */}
      {(status === "active" || status === "ended" || status === "ending") && (
        <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
          {/* Agent speaking indicator */}
          <div className="px-5 py-3 border-b border-bg-border flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              isSpeaking ? "bg-primary/20 border-primary/50 animate-pulse" : "bg-primary/10 border-primary/20"
            }`}>
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <div className="text-xs font-medium text-text">Alex — PrepHub AI Interviewer</div>
              {isSpeaking && <div className="text-[10px] text-primary animate-pulse">Speaking…</div>}
            </div>
          </div>

          {/* Transcript messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-3">
            {transcript.length === 0 && (
              <p className="text-xs text-text-muted text-center pt-8">Transcript will appear here…</p>
            )}
            {transcript.map((line) => (
              <div
                key={line.id}
                className={`flex gap-3 ${line.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  line.role === "assistant" ? "bg-primary/20 text-primary" : "bg-bg-border text-text-muted"
                }`}>
                  {line.role === "assistant" ? "AI" : "ME"}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  line.role === "assistant"
                    ? "bg-bg-surface border border-bg-border text-text"
                    : "bg-primary/10 border border-primary/20 text-text"
                } ${!line.final ? "opacity-60 italic" : ""}`}>
                  {line.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text mb-1">Evaluating your interview…</h3>
          <p className="text-sm text-text-muted">Gemini AI is reviewing your answers. This may take 10–20 seconds.</p>
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
