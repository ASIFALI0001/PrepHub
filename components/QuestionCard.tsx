"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

export interface Question {
  id: string;
  section: string;
  question: string;
  answer: string;
  frequency: "MOST_FREQ" | "MED" | "LOW";
  sources: string[];
}

interface Props {
  question: Question;
  index: number;
  isLearned: boolean;
  onToggle: (id: string) => void;
  toggling: boolean;
}

const FREQ_CONFIG = {
  MOST_FREQ: { label: "Must Know", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  MED:       { label: "Expected",  className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  LOW:       { label: "Deep Dive", className: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" },
};

export default function QuestionCard({ question, index, isLearned, onToggle, toggling }: Props) {
  const [open, setOpen] = useState(false);
  const freq = FREQ_CONFIG[question.frequency];

  return (
    <div className={`glass-card rounded-2xl border transition-all duration-200 overflow-hidden ${
      isLearned ? "border-accent-green/35 bg-accent-green/[0.02]" : "border-bg-border hover:border-primary/20"
    }`}>

      {/* ── Question row ──────────────────────────────────────────── */}
      <div
        className="flex items-start gap-4 px-5 py-5 cursor-pointer hover:bg-bg-border/10 transition-colors select-none"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Index number */}
        <span className="text-sm text-text-muted w-7 shrink-0 text-right font-mono pt-0.5">{index}.</span>

        {/* Middle: badge + question */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${freq.className}`}>
              {freq.label}
            </span>
          </div>
          <p className="text-base font-semibold text-text leading-relaxed">{question.question}</p>
        </div>

        {/* Right: learned toggle + chevron */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(question.id); }}
            disabled={toggling}
            title={isLearned ? "Mark as not learned" : "Mark as learned"}
            className="transition-colors disabled:opacity-40"
          >
            {isLearned
              ? <CheckCircle2 className="w-6 h-6 text-accent-green" />
              : <Circle className="w-6 h-6 text-text-muted hover:text-accent-green" />
            }
          </button>

          <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ── Answer panel ─────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-bg-border bg-bg-surface/40">
          <div className="px-5 py-5 space-y-4">
            {/* Answer text */}
            <p className="text-sm text-text leading-relaxed">{question.answer}</p>

            {/* Sources */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-text-muted font-medium">Sources:</span>
              {question.sources.map((src) => (
                <span key={src} className="text-xs px-2.5 py-1 rounded-lg bg-bg-border text-text-muted font-medium">
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* Mark as learned footer */}
          <div className="border-t border-bg-border px-5 py-3.5">
            <button
              onClick={() => onToggle(question.id)}
              disabled={toggling}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 ${
                isLearned
                  ? "bg-accent-green/10 text-accent-green border border-accent-green/25 hover:bg-accent-green/20"
                  : "bg-bg-border text-text-muted border border-bg-border hover:bg-primary/10 hover:text-primary hover:border-primary/25"
              }`}
            >
              {isLearned
                ? <><CheckCircle2 className="w-4 h-4" /> Marked as Learned</>
                : <><Circle className="w-4 h-4" /> Mark as Learned</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
