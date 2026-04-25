"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { TOPIC_ICONS } from "@/lib/topicIcons";
import type { Topic } from "@/lib/topics";

interface Props {
  topic: Topic;
  completed: number;
}

export default function TopicCard({ topic, completed }: Props) {
  const { id, label, desc, color, iconBg, border, glow } = topic;
  const Icon = TOPIC_ICONS[id];

  const pct = topic.total > 0 ? Math.round((completed / topic.total) * 100) : 0;
  const isComplete = pct >= 100;
  const hasStarted = completed > 0;

  const [localPct, setLocalPct] = useState(pct);
  const [resetting, setResetting] = useState(false);

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (resetting) return;
    setResetting(true);
    await fetch(`/api/progress/${id}`, { method: "DELETE" });
    setLocalPct(0);
    setResetting(false);
  };

  return (
    <Link
      href={`/learn/${id}`}
      className={`group relative flex flex-col glass-card rounded-2xl border border-bg-border ${border} ${glow} p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden`}
    >
      {/* Subtle bg glow on hover */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 ${iconBg}`} />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${iconBg}`}>
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        <div className="flex items-center gap-1.5">
          {hasStarted && (
            <button
              onClick={handleReset}
              title="Reset progress"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            </button>
          )}
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
          ) : (
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      </div>

      {/* Text */}
      <h3 className="font-semibold text-text mb-1 text-[15px]">{label}</h3>
      <p className="text-xs text-text-muted leading-relaxed mb-5 flex-1">{desc}</p>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted">
            {localPct === 0 ? "Not started" : isComplete ? "Complete" : "In progress"}
          </span>
          <span className={`text-xs font-semibold ${localPct > 0 ? color : "text-text-muted"}`}>
            {localPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary to-primary-light"
            style={{ width: `${localPct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
