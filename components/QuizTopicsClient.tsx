"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, TrendingUp, RotateCcw, Clock, ChevronRight, Lock } from "lucide-react";

interface TopicStats {
  attempts: number; avgScore: number; lastScore: number; lastTaken: string;
}

interface TopicConfig {
  id: string; label: string; desc: string;
  color: string; iconBg: string; border: string; hoverBorder: string;
  available: boolean;
}

const TOPICS: TopicConfig[] = [
  { id: "java", label: "Java", desc: "Core Java · OOP · Collections · Multithreading · Java 8+", color: "text-orange-400", iconBg: "bg-orange-500/10", border: "border-orange-500/20", hoverBorder: "hover:border-orange-500/40", available: true },
  { id: "oops", label: "OOPS", desc: "Encapsulation · Inheritance · Polymorphism · Design Patterns", color: "text-primary-light", iconBg: "bg-primary/10", border: "border-bg-border", hoverBorder: "", available: false },
  { id: "cn", label: "Computer Networks", desc: "OSI model · TCP/IP · DNS · HTTP · Routing", color: "text-accent-blue", iconBg: "bg-accent-blue/10", border: "border-bg-border", hoverBorder: "", available: false },
  { id: "os", label: "Operating Systems", desc: "Processes · Scheduling · Memory Management · Deadlocks", color: "text-accent-green", iconBg: "bg-accent-green/10", border: "border-bg-border", hoverBorder: "", available: false },
];

function gradeLabel(avg: number) {
  if (avg >= 80) return { text: "Well Prepared", color: "text-accent-green" };
  if (avg >= 60) return { text: "On Track", color: "text-yellow-400" };
  if (avg >= 40) return { text: "Needs Practice", color: "text-accent-orange" };
  return { text: "Just Starting", color: "text-text-muted" };
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-bg-border overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {TOPICS.map((t) => {
        const s = stats[t.id] as TopicStats | undefined;
        const prepared = s ? Math.min(100, s.avgScore) : 0;
        const { text: readiness, color: readinessColor } = gradeLabel(prepared);
        const barColor = prepared >= 75 ? "bg-accent-green" : prepared >= 60 ? "bg-yellow-400" : "bg-primary";

        return (
          <div key={t.id}
            onClick={() => t.available && router.push(`/quiz/${t.id}`)}
            className={`glass-card rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200 ${
              t.available
                ? `${t.border} ${t.hoverBorder} hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] cursor-pointer group`
                : "border-bg-border opacity-50 cursor-not-allowed"
            }`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${t.iconBg}`}>
                  <Zap className={`w-6 h-6 ${t.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">{t.label}</h3>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
              {t.available ? (
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
              ) : (
                <div className="flex items-center gap-1 text-xs text-text-muted border border-bg-border rounded-lg px-2.5 py-1 shrink-0">
                  <Lock className="w-3 h-3" /> Soon
                </div>
              )}
            </div>

            {/* Stats section */}
            {t.available && !loading && (
              s ? (
                <div className="space-y-4">
                  {/* Prepared bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={`font-semibold ${readinessColor}`}>{readiness}</span>
                      <span className="font-bold text-text">{prepared}% prepared</span>
                    </div>
                    <ScoreBar pct={prepared} color={barColor} />
                  </div>

                  {/* 3 stat tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: RotateCcw, val: String(s.attempts), lbl: "Taken", c: "text-text" },
                      { icon: TrendingUp, val: `${s.avgScore}%`, lbl: "Avg", c: s.avgScore >= 75 ? "text-accent-green" : s.avgScore >= 60 ? "text-yellow-400" : "text-text" },
                      { icon: Clock, val: `${s.lastScore}%`, lbl: "Last", c: s.lastScore >= 75 ? "text-accent-green" : s.lastScore >= 60 ? "text-yellow-400" : "text-text" },
                    ].map(({ icon: Icon, val, lbl, c }) => (
                      <div key={lbl} className="bg-bg-surface rounded-xl border border-bg-border py-3 text-center">
                        <Icon className="w-3.5 h-3.5 text-text-muted mx-auto mb-1.5" />
                        <div className={`text-lg font-black ${c}`}>{val}</div>
                        <div className="text-[10px] text-text-muted">{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-text-muted bg-bg-surface rounded-xl border border-bg-border px-4 py-3">
                  <Zap className={`w-4 h-4 ${t.color} opacity-60`} />
                  No attempts yet — take your first quiz!
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
