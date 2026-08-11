"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Ban, Wrench, LogOut, ArrowLeft } from "lucide-react";
import { TOGGLEABLE_PAGES } from "@/lib/pages";
import { easeOutExpo } from "@/lib/motion";

interface Status { blocked: boolean; disabledPages: string[] }

/**
 * Rendered by DashboardNav (present on every gated page). Polls the user's
 * access status and renders a full-screen "blocked" overlay, or a per-page
 * "under maintenance" overlay when an admin has paused the current feature.
 */
export default function AccessGuard() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/platform-status", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => { if (active) setStatus({ blocked: !!d.blocked, disabledPages: d.disabledPages ?? [] }); })
        .catch(() => {});
    load();
    // Re-check periodically so a block/pause takes effect without a manual refresh.
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [pathname]);

  if (!status) return null;

  if (status.blocked) return <BlockedOverlay />;

  const current = TOGGLEABLE_PAGES.find((p) => pathname.startsWith(p.href));
  if (current && status.disabledPages.includes(current.key)) {
    return <MaintenanceOverlay label={current.label} />;
  }

  return null;
}

function BlockedOverlay() {
  return (
    <div className="fixed inset-0 z-[200] bg-bg flex items-center justify-center px-6">
      <div className="grid-backdrop absolute inset-0 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOutExpo }}
        className="relative text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center mx-auto mb-6 text-accent-pink">
          <Ban className="w-8 h-8" />
        </div>
        <p className="eyebrow mb-3">Access restricted</p>
        <h1 className="text-2xl font-bold text-text tracking-tight mb-2">Admin blocked you</h1>
        <p className="text-text-muted leading-relaxed mb-8">
          An administrator has restricted your access to PrepHub. If you believe this is a mistake,
          please reach out to the PrepHub team.
        </p>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </motion.div>
    </div>
  );
}

function MaintenanceOverlay({ label }: { label: string }) {
  // Sits below the fixed nav (top-16) so the user can still navigate away.
  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-bg flex items-center justify-center px-6">
      <div className="grid-backdrop absolute inset-0 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOutExpo }}
        className="relative text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center mx-auto mb-6 text-accent-orange">
          <Wrench className="w-8 h-8" />
        </div>
        <p className="eyebrow mb-3">Under maintenance</p>
        <h1 className="text-2xl font-bold text-text tracking-tight mb-2">{label} is paused</h1>
        <p className="text-text-muted leading-relaxed mb-8">
          An administrator has temporarily paused this page for maintenance. Please check back soon —
          the rest of PrepHub is still available.
        </p>
        <Link href="/dashboard" className="btn-primary gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
