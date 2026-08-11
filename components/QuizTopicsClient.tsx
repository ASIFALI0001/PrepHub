"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, TrendingUp, RotateCcw, Clock, ChevronRight, Lock } from "lucide-react";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { scoreTheme } from "@/lib/score";

interface TopicStats {
  attempts: number; avgScore: number; lastScore: number; lastTaken: string;
}

interface TopicConfig {
  id: string; label: string; desc: string; accent: string; available: boolean;
}

const TOPICS: TopicConfig[] = [
  { id: "java", label: "Java", desc: "Core Java · OOP · Collections · Multithreading · Java 8+", accent: "text-accent-orange", available: true },
  { id: "oops", label: "OOPS", desc: "Encapsulation · Inheritance · Polymorphism · Design Patterns", accent: "text-accent-violet", available: true },
  { id: "cn", label: "Computer Networks", desc: "OSI model · TCP/IP · DNS · HTTP · Routing", accent: "text-accent-blue", available: true },
  { id: "os", label: "Operating Systems", desc: "Processes · Scheduling · Memory Management · Deadlocks", accent: "text-accent-green", available: true },
];

function readiness(avg: number) {
  if (avg >= 80) return { text: "Well prepared", color: "text-accent-green" };
  if (avg >= 60) return { text: "On track", color: "text-primary" };
  if (avg >= 40) return { text: "Needs practice", color: "text-accent-orange" };
  return { text: "Just starting", color: "text-text-muted" };
}

export default function QuizTopicsClient() {
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, TopicStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quiz/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStats(d.stats ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TOPICS.map((t) => {
        const s = stats[t.id] as TopicStats | undefined;
        const prepared = s ? Math.min(100, s.avgScore) : 0;
        const r = readiness(prepared);
        const bar = scoreTheme(prepared);

        return (
          <motion.div
            key={t.id}
            variants={fadeUp}
            whileHover={t.available ? { y: -3 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => t.available && router.push(`/quiz/${t.id}`)}
            className={`glass-card rounded-2xl p-6 flex flex-col gap-5 transition-colors ${
              t.available ? "cursor-pointer group hover:border-text-dim/25" : "opacity-55 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 ${t.accent}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">{t.label}</h3>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
              {t.available ? (
                <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-text group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
              ) : (
                <span className="chip shrink-0"><Lock className="w-3 h-3" /> Soon</span>
              )}
            </div>

            {t.available && (
              loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-2 w-full rounded-full" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                  </div>
                </div>
              ) : s ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={`font-semibold ${r.color}`}>{r.text}</span>
                      <span className="tnum font-bold text-text">{prepared}% ready</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
                      <motion.div className={`h-full rounded-full ${bar.bar}`}
                        initial={{ width: 0 }} animate={{ width: `${prepared}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: RotateCcw, val: String(s.attempts), lbl: "Taken", c: "text-text" },
                      { icon: TrendingUp, val: `${s.avgScore}%`, lbl: "Avg", c: scoreTheme(s.avgScore).text },
                      { icon: Clock, val: `${s.lastScore}%`, lbl: "Last", c: scoreTheme(s.lastScore).text },
                    ].map(({ icon: Icon, val, lbl, c }) => (
                      <div key={lbl} className="bg-bg-surface rounded-xl border border-bg-border py-3 text-center">
                        <Icon className="w-3.5 h-3.5 text-text-dim mx-auto mb-1.5" />
                        <div className={`tnum text-lg font-bold ${c}`}>{val}</div>
                        <div className="text-[10px] text-text-muted">{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-text-muted bg-bg-surface rounded-xl border border-bg-border px-4 py-3">
                  <Zap className={`w-4 h-4 ${t.accent} opacity-70`} />
                  No attempts yet — take your first quiz!
                </div>
              )
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
