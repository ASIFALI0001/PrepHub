"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-bg-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">PrepHub</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost text-sm py-2 px-5">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
