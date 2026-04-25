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
    <div
      className={`glass-card rounded-xl border transition-all duration-200 overflow-hidden ${
        isLearned ? "border-accent-green/30 bg-accent-green/[0.03]" : "border-bg-border"
      }`}
    >
      {/* Question row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-bg-border/20 transition-colors select-none"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Index */}
        <span className="text-xs text-text-muted w-6 shrink-0 text-right font-mono">{index}.</span>

        {/* Freq badge */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${freq.className}`}>
          {freq.label}
        </span>

        {/* Question text */}
        <p className="flex-1 text-sm text-text font-medium leading-snug">{question.question}</p>

        {/* Learned toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(question.id);
          }}
          disabled={toggling}
          title={isLearned ? "Mark as not learned" : "Mark as learned"}
          className="shrink-0 text-text-muted hover:text-accent-green transition-colors disabled:opacity-50 p-1"
        >
          {isLearned
            ? <CheckCircle2 className="w-4.5 h-4.5 text-accent-green" />
            : <Circle className="w-4.5 h-4.5" />
          }
        </button>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Answer panel */}
      {open && (
        <div className="border-t border-bg-border px-4 py-4 space-y-3">
          <p className="text-sm text-text leading-relaxed">{question.answer}</p>

          {/* Sources */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-text-muted">Sources:</span>
            {question.sources.map((src) => (
              <span
                key={src}
                className="text-[10px] px-2 py-0.5 rounded bg-bg-border text-text-muted"
              >
                {src}
              </span>
            ))}
          </div>

          {/* Mark as learned button (visible in expanded view too) */}
          <button
            onClick={() => onToggle(question.id)}
            disabled={toggling}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
              isLearned
                ? "bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
                : "bg-bg-border text-text-muted hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {isLearned
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Learned</>
              : <><Circle className="w-3.5 h-3.5" /> Mark as learned</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
