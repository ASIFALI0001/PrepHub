"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ChevronRight, Loader2, Volume2, VolumeX, Send } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import type { IInterview, IAnswer } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
}

export default function InterviewSession({ interview }: Props) {
  const router = useRouter();
  const { state: speechState, speak, startListening, stopListening, stopSpeaking } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<IAnswer[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [phase, setPhase] = useState<"intro" | "question" | "submitting">("intro");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const question = interview.questions[currentIndex];
  const total = interview.questions.length;

  const askQuestion = useCallback(async (idx: number) => {
    const q = interview.questions[idx];
    setPhase("question");
    setCurrentText("");
    setMicOn(false);
    if (voiceEnabled) {
      await speak(`Question ${idx + 1} of ${total}. ${q.text}`);
    }
  }, [interview.questions, total, voiceEnabled, speak]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const intro = async () => {
      setPhase("intro");
      if (voiceEnabled) {
        await speak(`Welcome to your ${interview.role} interview. I'll ask you ${total} question${total > 1 ? "s" : ""}. Answer each one clearly. Ready? Let's begin.`);
      }
      await askQuestion(0);
    };
    intro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle mic on/off — accumulates chunks instead of replacing
  const toggleMic = useCallback(() => {
    if (micOn) {
      stopListening();
      setMicOn(false);
    } else {
      setMicOn(true);
      startListening((chunk) => {
        setCurrentText((prev) => prev ? `${prev} ${chunk}` : chunk);
      });
    }
  }, [micOn, startListening, stopListening]);

  const commitAnswer = useCallback(async () => {
    // Stop mic if it's running
    if (micOn) {
      stopListening();
      setMicOn(false);
    }

    const ans: IAnswer = {
      questionId: question.id,
      questionText: question.text,
      answerText: currentText.trim(),
    };

    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    if (currentIndex + 1 < total) {
      setCurrentIndex(currentIndex + 1);
      await askQuestion(currentIndex + 1);
    } else {
      setPhase("submitting");
      setSubmitting(true);
      if (voiceEnabled) await speak("Great job! Submitting your answers and generating your evaluation. Please wait.");

      try {
        const res = await fetch(`/api/interview/${interview._id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answers: newAnswers }),
        });

        if (!res.ok) throw new Error("Submission failed");
        router.push(`/interview/${interview._id}/report`);
      } catch {
        setError("Failed to submit. Please try again.");
        setSubmitting(false);
        setPhase("question");
      }
    }
  }, [question, currentText, answers, currentIndex, total, askQuestion, speak, voiceEnabled, micOn, stopListening, interview._id, router]);

  const skipQuestion = () => {
    setCurrentText("(skipped)");
  };

  // Use effect to submit when text is set to "(skipped)"
  useEffect(() => {
    if (currentText === "(skipped)") {
      commitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentText]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Progress bar */}
      <div className="glass-card rounded-2xl border border-bg-border p-5">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>Question {Math.min(currentIndex + 1, total)} of {total}</span>
          <span>{Math.round((currentIndex / total) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              voiceEnabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-bg-border border-bg-border text-text-muted"
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            {voiceEnabled ? "Voice on" : "Voice off"}
          </button>
          {speechState === "speaking" && (
            <button onClick={stopSpeaking} className="text-xs px-2.5 py-1 rounded-lg border border-bg-border text-text-muted hover:text-text">
              Skip speech
            </button>
          )}
        </div>
      </div>

      {/* Agent bubble */}
      <div className="glass-card rounded-2xl border border-bg-border p-6">
        <div className="flex gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            speechState === "speaking" ? "bg-primary/20 border-primary/50 animate-pulse" : "bg-primary/10 border-primary/20"
          }`}>
            <span className="text-lg">🤖</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1 font-medium">Interviewer</div>
            {phase === "intro" ? (
              <p className="text-sm text-text-muted italic">Setting up your interview…</p>
            ) : phase === "submitting" ? (
              <p className="text-sm text-text">Evaluating your answers with Gemini AI…</p>
            ) : (
              <p className="text-sm text-text leading-relaxed">
                <span className="text-xs text-text-muted block mb-1">Q{currentIndex + 1}</span>
                {question?.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer area */}
      {phase === "question" && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text">Your Answer</label>
            {micOn && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Listening — speak freely, click Stop when done
              </div>
            )}
          </div>

          <textarea
            className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
            rows={5}
            placeholder="Type your answer, or press the mic button and speak — each sentence gets added below the previous one."
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
          />

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            {/* Toggle mic */}
            <button
              onClick={toggleMic}
              disabled={speechState === "speaking"}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                micOn
                  ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25"
                  : "bg-bg-border border-bg-border text-text-muted hover:text-text hover:border-primary/30"
              }`}
            >
              {micOn ? <><MicOff className="w-4 h-4" /> Stop mic</> : <><Mic className="w-4 h-4" /> Speak</>}
            </button>

            <button
              onClick={skipQuestion}
              className="px-4 py-2.5 rounded-xl border border-bg-border text-sm text-text-muted hover:text-text transition-colors"
            >
              Skip
            </button>

            <button
              onClick={commitAnswer}
              disabled={!currentText.trim() || submitting}
              className="flex-1 btn-primary py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {currentIndex + 1 < total ? (
                <><ChevronRight className="w-4 h-4" /> Next Question</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Interview</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submitting state */}
      {phase === "submitting" && (
        <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text mb-1">Evaluating your performance…</h3>
          <p className="text-sm text-text-muted">Gemini AI is reviewing all your answers. This may take 10–20 seconds.</p>
        </div>
      )}

      {/* Answered questions list */}
      {answers.length > 0 && phase !== "submitting" && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest px-1">Answered</h3>
          {answers.map((a, i) => (
            <div key={a.questionId} className="glass-card rounded-xl border border-bg-border px-4 py-3">
              <div className="text-xs text-text-muted mb-1">Q{i + 1} · {interview.questions[i]?.text.slice(0, 60)}…</div>
              <p className="text-xs text-text line-clamp-2">{a.answerText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
