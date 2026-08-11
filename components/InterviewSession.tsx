"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, ChevronRight, Loader2, Volume2, VolumeX, Send, Bot } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import type { IInterview, IAnswer } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
}

// Small equalizer shown while the agent speaks
function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex items-end gap-0.5 h-3.5">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-primary"
          animate={active ? { height: [4, 14, 6, 12, 4] } : { height: 4 }}
          transition={active ? { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </span>
  );
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

  useEffect(() => {
    if (currentText === "(skipped)") {
      commitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentText]);

  const pct = Math.round((currentIndex / total) * 100);
  const isSpeaking = speechState === "speaking";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="tnum font-medium text-text">Question {Math.min(currentIndex + 1, total)} <span className="text-text-muted">/ {total}</span></span>
          <span className="tnum text-text-muted">{pct}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              voiceEnabled ? "bg-primary/10 border-primary/30 text-primary" : "border-bg-border text-text-muted hover:text-text"
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {voiceEnabled ? "Voice on" : "Voice off"}
          </button>
          {isSpeaking && (
            <button onClick={stopSpeaking} className="text-xs px-2.5 py-1.5 rounded-lg border border-bg-border text-text-muted hover:text-text transition-colors">
              Skip speech
            </button>
          )}
        </div>
      </div>

      {/* Agent bubble */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all text-primary ${
            isSpeaking ? "bg-primary/15 border-primary/40" : "bg-primary/10 border-primary/20"
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-muted mb-1 font-medium flex items-center gap-2">
              Interviewer {isSpeaking && <Equalizer active />}
            </div>
            {phase === "intro" ? (
              <p className="text-sm text-text-muted italic">Setting up your interview…</p>
            ) : phase === "submitting" ? (
              <p className="text-sm text-text">Evaluating your answers with Gemini AI…</p>
            ) : (
              <p className="text-sm text-text leading-relaxed">
                <span className="eyebrow block mb-1">Question {currentIndex + 1}</span>
                {question?.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer area */}
      {phase === "question" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text">Your answer</label>
            {micOn && (
              <div className="flex items-center gap-1.5 text-xs text-accent-pink">
                <span className="w-2 h-2 rounded-full bg-accent-pink animate-pulse" />
                Listening — click Stop when done
              </div>
            )}
          </div>

          <textarea
            className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 resize-none transition-all"
            rows={5}
            placeholder="Type your answer, or tap Speak and talk — each sentence is appended below the previous one."
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
          />

          {error && <p className="text-xs text-accent-pink bg-accent-pink/10 border border-accent-pink/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2.5">
            <button
              onClick={toggleMic}
              disabled={isSpeaking}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 ${
                micOn
                  ? "bg-accent-pink/10 border-accent-pink/40 text-accent-pink hover:bg-accent-pink/20"
                  : "border-bg-border text-text-muted hover:text-text hover:border-text-dim/40"
              }`}
            >
              {micOn ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Speak</>}
            </button>

            <button
              onClick={skipQuestion}
              className="px-4 py-2.5 rounded-lg border border-bg-border text-sm text-text-muted hover:text-text transition-colors"
            >
              Skip
            </button>

            <button
              onClick={commitAnswer}
              disabled={!currentText.trim() || submitting}
              className="flex-1 btn-primary justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentIndex + 1 < total ? (
                <>Next question <ChevronRight className="w-4 h-4" /></>
              ) : (
                <><Send className="w-4 h-4" /> Submit interview</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Submitting */}
      {phase === "submitting" && (
        <div className="glass-card rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="grid-backdrop absolute inset-0 opacity-60" />
          <div className="relative">
            <div className="relative w-14 h-14 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-text mb-1">Evaluating your performance…</h3>
            <p className="text-sm text-text-muted">Gemini is reviewing every answer. This takes 10–20 seconds.</p>
          </div>
        </div>
      )}

      {/* Answered list */}
      {answers.length > 0 && phase !== "submitting" && (
        <div className="space-y-2">
          <h3 className="eyebrow px-1">Answered · {answers.length}</h3>
          {answers.map((a, i) => (
            <div key={a.questionId} className="glass-card rounded-xl px-4 py-3">
              <div className="text-xs text-text-muted mb-1 truncate">Q{i + 1} · {interview.questions[i]?.text}</div>
              <p className="text-xs text-text line-clamp-2">{a.answerText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
