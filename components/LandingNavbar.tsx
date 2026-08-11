"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, BarChart2, ArrowUpRight, Menu, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-3"
    >
      <div className="relative mx-auto max-w-6xl">
        <div
          className={`h-14 px-3 pl-4 flex items-center justify-between rounded-xl transition-all duration-300 ${
            scrolled || open ? "glass shadow-md" : "border border-transparent bg-transparent"
          }`}
        >
          <Logo href="/" markClassName="w-7 h-7" />

          <div className="flex items-center gap-1.5">
            {/* Desktop links */}
            <a href="http://localhost:3000/"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-bg-surface transition-colors">
              <BarChart2 className="w-4 h-4" /> Visualizer
            </a>
            <Link href="/admin/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-bg-surface transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
            <div className="mx-1.5 hidden sm:block h-5 w-px bg-bg-border" />

            <ThemeToggle />

            <Link href="/login" className="hidden sm:inline-flex btn-subtle">Log in</Link>
            <Link href="/signup" className="hidden sm:inline-flex btn-primary group gap-1">
              Get started
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="sm:hidden w-10 h-10 rounded-lg border border-bg-border bg-bg-card flex items-center justify-center text-text-muted hover:text-text transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="sm:hidden absolute top-full inset-x-0 mt-2 glass-card rounded-2xl p-3 shadow-lg origin-top"
            >
              <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary w-full justify-center gap-1.5 mb-2">
                Get started <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost w-full justify-center mb-3">
                Log in
              </Link>
              <div className="border-t border-bg-border pt-2 space-y-1">
                <a href="http://localhost:3000/" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text hover:bg-bg-surface transition-colors">
                  <BarChart2 className="w-4 h-4" /> Visualizer
                </a>
                <Link href="/admin/login" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text hover:bg-bg-surface transition-colors">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
