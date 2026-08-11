"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap, Zap, Mic, LogOut, ChevronDown, Brain, Compass,
  ClipboardList, User, Star, LayoutDashboard, Menu, X,
} from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import AccessGuard from "./AccessGuard";
import { popover, easeOutExpo } from "@/lib/motion";

const navItems = [
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/quiz", label: "Quiz", icon: Zap },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/company-brain", label: "Company Brain", icon: Brain },
  { href: "/career-guide", label: "Career Guide", icon: Compass },
  { href: "/ats", label: "ATS Checker", icon: ClipboardList },
];

const userItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Update profile", icon: User },
  { href: "/feedback", label: "Give feedback", icon: Star },
];

interface Props {
  userName: string;
}

export default function DashboardNav({ userName }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close desktop user menu on outside-click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open + close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 glass border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo href="/dashboard" markClassName="w-7 h-7" />

          {/* Desktop nav with animated active pill */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className="nav-link flex items-center gap-1.5">
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-bg-surface border border-bg-border"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{label}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Desktop user menu */}
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl border border-bg-border bg-bg-card hover:bg-bg-surface transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm font-medium text-text max-w-[110px] truncate">{userName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    variants={popover} initial="hidden" animate="show" exit="exit"
                    className="absolute right-0 top-full mt-2 w-56 origin-top-right glass-card rounded-xl shadow-lg p-1.5 z-50"
                  >
                    <div className="px-2 py-2 mb-1 border-b border-bg-border">
                      <p className="text-xs text-text-dim">Signed in as</p>
                      <p className="text-sm font-medium text-text truncate">{userName}</p>
                    </div>
                    {userItems.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-bg-surface transition-colors">
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-bg-border" />
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-accent-pink hover:bg-accent-pink/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="md:hidden w-10 h-10 rounded-xl border border-bg-border bg-bg-card flex items-center justify-center text-text-muted hover:text-text transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: easeOutExpo }}
              className="absolute right-0 top-0 bottom-0 w-[82%] max-w-xs bg-bg-elevated border-l border-bg-border flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-bg-border shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{userName}</p>
                    <p className="text-xs text-text-dim">Signed in</p>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close menu"
                  className="w-9 h-9 rounded-lg border border-bg-border flex items-center justify-center text-text-muted hover:text-text transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto p-3">
                <p className="eyebrow px-2 mb-2">Explore</p>
                <div className="space-y-1">
                  {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link key={href} href={href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                          active ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text hover:bg-bg-surface"
                        }`}>
                        <Icon className="w-5 h-5 shrink-0" /> {label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>

                <div className="my-3 border-t border-bg-border" />
                <p className="eyebrow px-2 mb-2">Account</p>
                <div className="space-y-1">
                  {userItems.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-bg-surface transition-colors">
                      <Icon className="w-5 h-5 shrink-0" /> {label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Drawer footer */}
              <div className="p-3 border-t border-bg-border shrink-0">
                <button onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-accent-pink hover:bg-accent-pink/10 transition-colors">
                  <LogOut className="w-5 h-5" /> Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Block / maintenance enforcement (renders overlays when needed) */}
      <AccessGuard />
    </>
  );
}
