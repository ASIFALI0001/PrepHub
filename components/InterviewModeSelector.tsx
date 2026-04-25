"use client";

import { useState } from "react";
import { Mic, Bot, ChevronRight, Zap, MessageSquare } from "lucide-react";

export type InterviewMode = "web" | "vapi";

interface Props {
  onSelect: (mode: InterviewMode) => void;
  interviewTitle: string;
  questionCount: number;
}

export default function InterviewModeSelector({ onSelect, interviewTitle, questionCount }: Props) {
  const [hovered, setHovered] = useState<InterviewMode | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
        <h2 className="text-base font-semibold text-text mb-1">Choose Interview Mode</h2>
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text">{interviewTitle}</span> · {questionCount} questions
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Web Speech */}
        <button
          onClick={() => onSelect("web")}
          onMouseEnter={() => setHovered("web")}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card rounded-2xl border p-6 text-left transition-all duration-200 ${
            hovered === "web" ? "border-accent-blue/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-bg-border"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-4">
            <Mic className="w-6 h-6 text-accent-blue" />
          </div>
          <h3 className="text-sm font-semibold text-text mb-2">Web Speech</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            Uses browser's built-in speech recognition. Type or speak your answers, advance manually at your own pace.
          </p>
          <div className="space-y-1.5 mb-5">
            {[
              "Works offline",
              "Manual control over pacing",
              "Type or speak answers",
              "Edit before submitting",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-text-muted">
                <div className="w-1 h-1 rounded-full bg-accent-blue shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium text-accent-blue transition-opacity ${hovered === "web" ? "opacity-100" : "opacity-60"}`}>
            Start Basic Interview <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Vapi AI Agent */}
        <button
          onClick={() => onSelect("vapi")}
          onMouseEnter={() => setHovered("vapi")}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card rounded-2xl border p-6 text-left transition-all duration-200 relative overflow-hidden ${
            hovered === "vapi" ? "border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-primary/20"
          }`}
        >
          {/* Recommended badge */}
          <div className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">
            Recommended
          </div>

          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-primary-light" />
          </div>
          <h3 className="text-sm font-semibold text-text mb-2">Vapi AI Agent</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            A real AI interviewer calls you, asks questions conversationally, asks follow-ups for depth, and evaluates your answers.
          </p>
          <div className="space-y-1.5 mb-5">
            {[
              { icon: Bot, text: "Natural voice conversation" },
              { icon: MessageSquare, text: "Intelligent follow-up questions" },
              { icon: Zap, text: "Real interview feel" },
              { icon: Mic, text: "Automatic answer capture" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-text-muted">
                <Icon className="w-3 h-3 text-primary/60 shrink-0" />
                {text}
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium text-primary-light transition-opacity ${hovered === "vapi" ? "opacity-100" : "opacity-60"}`}>
            Start AI Interview <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-text-muted mt-5">
        Vapi AI Agent requires microphone access and an internet connection.
      </p>
    </div>
  );
}
