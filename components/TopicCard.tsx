"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { TOPIC_ICONS } from "@/lib/topicIcons";
import type { Topic } from "@/lib/topics";

interface Props {
  topic: Topic;
  completed: number;
}

export default function TopicCard({ topic, completed }: Props) {
  const { id, label, desc, accent } = topic;
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
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="h-full">
      <Link
        href={`/learn/${id}`}
        className="group relative flex flex-col h-full glass-card rounded-2xl p-5 hover:border-text-dim/25 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 ${accent}`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <div className="flex items-center gap-1">
            {hasStarted && localPct > 0 && (
              <button
                onClick={handleReset}
                title="Reset progress"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-dim hover:text-accent-pink hover:bg-accent-pink/10"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              </button>
            )}
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            ) : (
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </div>

        <h3 className="font-semibold text-text mb-1 text-[15px]">{label}</h3>
        <p className="text-xs text-text-muted leading-relaxed mb-5 flex-1">{desc}</p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">
              {localPct === 0 ? "Not started" : isComplete ? "Complete" : "In progress"}
            </span>
            <span className={`tnum text-xs font-semibold ${localPct > 0 ? accent : "text-text-dim"}`}>{localPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? "bg-accent-green" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${localPct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
