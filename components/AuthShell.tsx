"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { fadeUp, staggerContainer, duration, easeOutExpo } from "@/lib/motion";

const highlights = [
  "1,300+ curated DSA problems across 13 tracks",
  "Timed quizzes with per-topic high scores",
  "Live AI voice interviews, scored in real time",
];

/**
 * Split-screen auth shell — editorial brand panel + focused form column.
 * Shared by /login and /signup so both stay perfectly consistent.
 */
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-bg-surface border-r border-bg-border">
        <div className="grid-backdrop absolute inset-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.slow, ease: easeOutExpo }} className="relative">
          <Logo href="/" markClassName="w-8 h-8" />
        </motion.div>

        <motion.div variants={staggerContainer(0.08, 0.1)} initial="hidden" animate="show" className="relative max-w-md">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-text tracking-tight leading-tight mb-8">
            The calm, focused way to
            <br /> get interview-ready.
          </motion.h2>
          <motion.ul variants={fadeUp} className="space-y-3.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-text-muted">
                <span className="mt-0.5 w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                {h}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.figure variants={fadeUp} initial="hidden" animate="show" className="relative glass-card rounded-xl p-5 max-w-md">
          <Quote className="w-5 h-5 text-primary/40 mb-2" />
          <blockquote className="text-sm text-text leading-relaxed">
            The mock interviews felt uncannily real. Two weeks of practice here and I
            walked into the real thing genuinely calm.
          </blockquote>
          <figcaption className="mt-3 text-xs text-text-muted">Priya · SDE-1, offer accepted</figcaption>
        </motion.figure>
      </div>

      {/* ── Form column ── */}
      <div className="relative flex flex-col items-center justify-center px-6 py-12">
        <div className="mesh-gradient fixed inset-0 pointer-events-none lg:hidden" />
        <div className="absolute top-5 right-5"><ThemeToggle /></div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, ease: easeOutExpo }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo href="/" markClassName="w-8 h-8" />
          </div>

          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1 className="text-2xl font-bold text-text tracking-tight mb-1.5">{title}</h1>
          <p className="text-text-muted text-sm mb-8">{subtitle}</p>

          {children}

          <p className="text-center text-sm text-text-muted mt-6">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}

/** Shared inline error banner in the new palette (no raw red-*). */
export function AuthError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-accent-pink/10 border border-accent-pink/30 text-accent-pink text-sm">
        <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        {message}
      </div>
    </motion.div>
  );
}

/** Submit button with built-in loading spinner, shared by both forms. */
export function AuthSubmit({ loading, idle, busy }: { loading: boolean; idle: string; busy: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {busy}
        </span>
      ) : idle}
    </button>
  );
}
