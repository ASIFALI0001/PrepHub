"use client";

import { motion } from "framer-motion";
import { Mic, Bot, ChevronRight, Zap, MessageSquare, Check } from "lucide-react";
import { staggerContainer, fadeUp } from "@/lib/motion";

export type InterviewMode = "web" | "vapi";

interface Props {
  onSelect: (mode: InterviewMode) => void;
  interviewTitle: string;
  questionCount: number;
}

export default function InterviewModeSelector({ onSelect, interviewTitle, questionCount }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-8"
      >
        <p className="eyebrow mb-2">Choose how to run it</p>
        <h2 className="text-xl font-bold text-text">{interviewTitle}</h2>
        <p className="text-sm text-text-muted mt-1 tnum">{questionCount} questions</p>
      </motion.div>

      <motion.div variants={staggerContainer(0.1)} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-4">
        {/* Web Speech */}
        <motion.button
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => onSelect("web")}
          className="group glass-card rounded-2xl p-6 text-left hover:border-accent-blue/40 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-4 text-accent-blue">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text mb-1.5">Web Speech</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            Uses your browser&apos;s built-in speech recognition. Type or speak answers and advance at your own pace.
          </p>
          <ul className="space-y-1.5 mb-5">
            {["Works offline", "Manual pacing control", "Type or speak answers", "Edit before submitting"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-blue">
            Start basic interview
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </motion.button>

        {/* Vapi AI Agent */}
        <motion.button
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => onSelect("vapi")}
          className="group glass-card rounded-2xl p-6 text-left relative overflow-hidden border-primary/25 hover:border-primary/50 transition-colors"
        >
          <div className="absolute top-4 right-4">
            <span className="chip !text-primary !border-primary/30 !bg-primary/10">Recommended</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text mb-1.5">Vapi AI Agent</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-4">
            A real AI interviewer calls you, asks conversationally, digs in with follow-ups, and evaluates your answers.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              { icon: Bot, text: "Natural voice conversation" },
              { icon: MessageSquare, text: "Intelligent follow-up questions" },
              { icon: Zap, text: "Real interview feel" },
              { icon: Mic, text: "Automatic answer capture" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-xs text-text-muted">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" /> {text}
              </li>
            ))}
          </ul>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            Start AI interview
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </motion.button>
      </motion.div>

      <p className="text-center text-xs text-text-dim mt-5">
        Vapi AI Agent requires microphone access and an internet connection.
      </p>
    </div>
  );
}
