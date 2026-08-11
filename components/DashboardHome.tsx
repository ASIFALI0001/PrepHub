"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  GraduationCap, Zap, Mic, Flame, BarChart3, Trophy,
  ArrowRight, Code2, Database, Cpu, Network, Brain, Compass,
} from "lucide-react";
import { staggerContainer, fadeUp, fadeUpSm, duration, easeOutExpo } from "@/lib/motion";

interface Stats {
  streak: number;
  quizAccuracy: number | null;
  quizTopicsAttempted: number;
  interviewsCompleted: number;
  interviewAvgScore: number | null;
  interviewAvgGrade: string | null;
}

const quickActions = [
  { href: "/learn", icon: GraduationCap, label: "Learn", desc: "Browse curated Q&A", accent: "text-accent-blue" },
  { href: "/quiz", icon: Zap, label: "Quiz", desc: "Start a timed session", accent: "text-accent-cyan" },
  { href: "/interview", icon: Mic, label: "Live Interview", desc: "Practice with AI", accent: "text-primary", badge: "AI" },
  { href: "/career-guide", icon: Compass, label: "Career Guide", desc: "Find your path with AI", accent: "text-accent-green" },
];

const topics = [
  { label: "DSA", icon: Code2, accent: "text-accent-blue", count: "1300+ Qs" },
  { label: "OOPS", icon: Brain, accent: "text-accent-violet", count: "100+ Qs" },
  { label: "DBMS", icon: Database, accent: "text-accent-cyan", count: "100+ Qs" },
  { label: "OS", icon: Cpu, accent: "text-accent-green", count: "100+ Qs" },
  { label: "CN", icon: Network, accent: "text-accent-orange", count: "100+ Qs" },
  { label: "SQL", icon: Database, accent: "text-accent-pink", count: "100+ Qs" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

interface Props { userName: string }

export default function DashboardHome({ userName }: Props) {
  const firstName = userName.split(" ")[0];
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d); })
      .catch(() => {});
  }, []);

  // Derived display values (unchanged business logic)
  const streakVal = stats ? `${stats.streak}` : "—";
  const streakUnit = stats ? `day${stats.streak !== 1 ? "s" : ""}` : "";
  const streakSub = stats?.streak ? (stats.streak >= 7 ? "On fire — keep going" : "Keep it up!") : "Start today";

  const quizVal = stats?.quizAccuracy !== null && stats?.quizAccuracy !== undefined
    ? `${stats.quizAccuracy}%` : "—";
  const quizSub = stats?.quizAccuracy !== null && stats?.quizAccuracy !== undefined
    ? `${stats.quizTopicsAttempted} topic${stats.quizTopicsAttempted !== 1 ? "s" : ""} attempted`
    : "No quizzes yet";

  const interviewVal = stats?.interviewAvgGrade ?? "—";
  const interviewSub = stats?.interviewsCompleted
    ? `${stats.interviewsCompleted} interview${stats.interviewsCompleted !== 1 ? "s" : ""} · avg ${stats.interviewAvgScore}%`
    : "No interviews yet";

  const statCards = [
    { icon: Flame, label: "Day streak", value: streakVal, unit: streakUnit, sub: streakSub, accent: "text-accent-orange" },
    { icon: BarChart3, label: "Quiz accuracy", value: quizVal, unit: "", sub: quizSub, accent: "text-accent-green" },
    { icon: Trophy, label: "Interview avg", value: interviewVal, unit: "", sub: interviewSub, accent: "text-accent-cyan" },
  ];

  return (
    <main className="pt-24 md:pt-24 pb-16 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.slow, ease: easeOutExpo }} className="mb-8">
          <p className="eyebrow mb-2">{greeting()}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-text-muted mt-1.5">Here&apos;s where you left off — ready for the next rep?</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={staggerContainer(0.07, 0.05)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          {statCards.map(({ icon: Icon, label, value, unit, sub, accent }) => (
            <motion.div
              key={label}
              variants={fadeUpSm}
              className="glass-card card-hover rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-medium text-text-muted">{label}</span>
                <div className={`w-9 h-9 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center ${accent}`}>
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`tnum text-3xl font-bold ${stats ? "text-text" : "text-text-dim"}`}>{value}</span>
                {unit && <span className="text-sm text-text-muted">{unit}</span>}
              </div>
              <div className="text-xs text-text-muted mt-1">{sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick start */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.slow, delay: 0.15, ease: easeOutExpo }} className="mb-10">
          <h2 className="text-sm font-semibold text-text-muted mb-3">Quick start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(({ href, icon: Icon, label, desc, accent, badge }) => (
              <motion.div key={href} whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                <Link
                  href={href}
                  className="group glass-card rounded-xl p-4 flex items-center gap-3.5 transition-colors hover:border-text-dim/30"
                >
                  <div className={`w-10 h-10 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-text text-sm">{label}</span>
                      {badge && <span className="chip !py-0 !px-1.5 !text-[10px] !text-primary !border-primary/30 !bg-primary/10">{badge}</span>}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Topics */}
        <motion.section variants={staggerContainer(0.05, 0.1)} initial="hidden" animate="show" className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <motion.h2 variants={fadeUpSm} className="text-sm font-semibold text-text-muted">Explore topics</motion.h2>
            <motion.div variants={fadeUpSm}>
              <Link href="/learn" className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topics.map(({ label, icon: Icon, accent, count }) => (
              <motion.div key={label} variants={fadeUpSm} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                <Link
                  href={`/learn/${label.toLowerCase()}`}
                  className="group glass-card rounded-xl p-4 flex flex-col items-center gap-2.5 text-center transition-colors hover:border-text-dim/30"
                >
                  <div className={`w-10 h-10 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">{label}</div>
                    <div className="tnum text-xs text-text-muted mt-0.5">{count}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Interview CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, delay: 0.3, ease: easeOutExpo }}
          className="relative overflow-hidden rounded-2xl border border-bg-border bg-bg-card p-6 sm:p-8"
        >
          <div className="grid-backdrop absolute inset-0 opacity-60 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="max-w-md">
              <p className="eyebrow mb-2.5">Flagship feature</p>
              <h3 className="text-xl font-bold text-text mb-1.5">Live AI Interview</h3>
              <p className="text-sm text-text-muted">
                Gemini plays your interviewer. Answer by voice, get scored in real time,
                and walk away with a full written report.
              </p>
            </div>
            <Link href="/interview" className="btn-primary shrink-0 gap-2">
              <Mic className="w-4 h-4" /> Start interview
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
