"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, RotateCcw, BookOpen } from "lucide-react";
import { TOPIC_ICONS } from "@/lib/topicIcons";
import type { Topic } from "@/lib/topics";

interface Props {
  topic: Topic;
  completed: number;
}

export default function TopicDetailHeader({ topic, completed }: Props) {
  const { id, label, desc, color, iconBg } = topic;
  const Icon = TOPIC_ICONS[id];

  const [current, setCurrent] = useState(completed);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pct = topic.total > 0 ? Math.round((current / topic.total) * 100) : 0;

  const handleReset = async () => {
    setResetting(true);
    await fetch(`/api/progress/${id}`, { method: "DELETE" });
    setCurrent(0);
    setResetting(false);
    setShowConfirm(false);
  };

  return (
    <div>
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Learn
      </Link>

      <div className="glass-card rounded-2xl border border-bg-border p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {Icon && <Icon className={`w-7 h-7 ${color}`} />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text mb-1">{label}</h1>
            <p className="text-text-muted leading-relaxed">{desc}</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-muted">Your progress</span>
            <span className={`text-sm font-bold ${pct > 0 ? color : "text-text-muted"}`}>
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Reset all progress?</span>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium"
              >
                {resetting ? "Resetting…" : "Yes, reset"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-bg-border text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset progress
            </button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">Questions coming soon</h3>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          The {label} question bank is being prepared. Progress will track automatically as you learn.
        </p>
      </div>
    </div>
  );
}
