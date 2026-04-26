"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  GraduationCap, Zap, Mic, Flame, BarChart3, Trophy,
  ArrowRight, Code2, Database, Cpu, Network, Brain,
} from "lucide-react";

interface Stats {
  streak: number;
  quizAccuracy: number | null;
  quizTopicsAttempted: number;
  interviewsCompleted: number;
  interviewAvgScore: number | null;
  interviewAvgGrade: string | null;
}

const quickActions = [
  { href: "/learn", icon: GraduationCap, label: "Learn", desc: "Browse curated Q&A", color: "text-accent-blue", bg: "bg-accent-blue/10 hover:bg-accent-blue/15", border: "hover:border-accent-blue/40", glow: "hover:shadow-glow-blue" },
  { href: "/quiz",  icon: Zap,           label: "Quiz",  desc: "Start a timed session", color: "text-accent-cyan", bg: "bg-accent-cyan/10 hover:bg-accent-cyan/15", border: "hover:border-accent-cyan/40", glow: "hover:shadow-glow-cyan" },
  { href: "/interview", icon: Mic, label: "Live Interview", desc: "Practice with AI", color: "text-primary-light", bg: "bg-primary/10 hover:bg-primary/15", border: "hover:border-primary/40", glow: "hover:shadow-glow", badge: "AI" },
];

const topics = [
  { label: "DSA",  icon: Code2,    color: "text-accent-blue",   count: "1300+ Qs" },
  { label: "OOPS", icon: Brain,    color: "text-primary-light",  count: "100+ Qs" },
  { label: "DBMS", icon: Database, color: "text-accent-cyan",    count: "100+ Qs" },
  { label: "OS",   icon: Cpu,      color: "text-accent-green",   count: "100+ Qs" },
  { label: "CN",   icon: Network,  color: "text-accent-orange",  count: "100+ Qs" },
  { label: "SQL",  icon: Database, color: "text-accent-pink",    count: "100+ Qs" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

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

  // Derived display values
  const streakVal   = stats ? `${stats.streak} day${stats.streak !== 1 ? "s" : ""}` : "—";
  const streakSub   = stats?.streak ? (stats.streak >= 7 ? "🔥 On fire!" : "Keep it up!") : "Start today";

  const quizVal     = stats?.quizAccuracy !== null && stats?.quizAccuracy !== undefined
    ? `${stats.quizAccuracy}%`
    : stats !== null ? "—" : "—";
  const quizSub     = stats?.quizAccuracy !== null && stats?.quizAccuracy !== undefined
    ? `${stats.quizTopicsAttempted} topic${stats.quizTopicsAttempted !== 1 ? "s" : ""} attempted`
    : "No quizzes yet";

  const interviewVal = stats?.interviewAvgGrade ?? (stats !== null ? "—" : "—");
  const interviewSub = stats?.interviewsCompleted
    ? `${stats.interviewsCompleted} interview${stats.interviewsCompleted !== 1 ? "s" : ""} · avg ${stats.interviewAvgScore}%`
    : "No interviews yet";

  const statCards = [
    {
      icon: Flame, label: "Day Streak", value: streakVal, sub: streakSub,
      color: "text-accent-orange", bg: "bg-accent-orange/10", border: "border-accent-orange/20",
    },
    {
      icon: BarChart3, label: "Quiz Accuracy", value: quizVal, sub: quizSub,
      color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/20",
    },
    {
      icon: Trophy, label: "Interview Avg", value: interviewVal, sub: interviewSub,
      color: "text-accent-cyan", bg: "bg-accent-cyan/10", border: "border-accent-cyan/20",
    },
  ];

  return (
    <main className="pt-24 md:pt-20 pb-16 px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-1.5">
            Welcome back, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-text-muted">What are we preparing today?</p>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {statCards.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
            <div key={label} className={`glass-card rounded-2xl border ${border} p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-sm font-medium text-text-muted">{label}</span>
              </div>
              <div className={`text-3xl font-black mb-1 ${stats ? "text-text" : "text-text-muted/40"}`}>
                {value}
              </div>
              <div className="text-xs text-text-muted">{sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="mb-10">
          <h2 className="text-lg font-semibold text-text mb-4">Quick start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map(({ href, icon: Icon, label, desc, color, bg, border, glow, badge }) => (
              <Link key={href} href={href}
                className={`group glass-card rounded-xl border border-bg-border ${border} ${glow} p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5`}>
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0 transition-colors`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">{label}</span>
                    {badge && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">{badge}</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Topics */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Explore topics</h2>
            <Link href="/learn" className="text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topics.map(({ label, icon: Icon, color, count }) => (
              <motion.div key={label} variants={item}>
                <Link href={`/learn/${label.toLowerCase()}`}
                  className="group glass-card rounded-xl border border-bg-border hover:border-bg-border/80 p-4 flex flex-col items-center gap-2.5 text-center transition-all duration-200 hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl bg-bg-border/40 group-hover:bg-bg-border flex items-center justify-center transition-colors">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">{label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{count}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Interview CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent-cyan/10 p-6 sm:p-8">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Flagship Feature</div>
              <h3 className="text-xl font-bold text-text mb-1">Live AI Interview</h3>
              <p className="text-sm text-text-muted max-w-md">
                Gemini plays your interviewer. Answer via voice, get scored in real-time, and receive a full report.
              </p>
            </div>
            <Link href="/interview" className="btn-primary shrink-0 flex items-center gap-2">
              <Mic className="w-4 h-4" /> Start interview
            </Link>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
