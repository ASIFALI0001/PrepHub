import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import { ChevronLeft, BookOpen, Code2, ArrowRight } from "lucide-react";

const CONCEPT_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  array:       { label: "Arrays",                      emoji: "📦", color: "text-violet-400", bg: "bg-violet-500/10" },
  string:      { label: "Strings",                     emoji: "🔤", color: "text-sky-400",    bg: "bg-sky-500/10"    },
  "linked-list":{ label: "Linked List",                emoji: "🔗", color: "text-emerald-400",bg: "bg-emerald-500/10"},
  stack:       { label: "Stack",                       emoji: "📚", color: "text-orange-400", bg: "bg-orange-500/10" },
  queue:       { label: "Queue",                       emoji: "🚶", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  tree:        { label: "Tree",                        emoji: "🌳", color: "text-green-400",  bg: "bg-green-500/10"  },
  graph:       { label: "Graph",                       emoji: "🕸️", color: "text-pink-400",   bg: "bg-pink-500/10"   },
  dp:          { label: "Dynamic Programming",         emoji: "🧩", color: "text-cyan-400",   bg: "bg-cyan-500/10"   },
};

const SUB_CARDS = [
  {
    id: "basics",
    label: "Basics",
    icon: BookOpen,
    desc: "Core concepts, syntax, built-in methods and essential patterns — everything you need to know before LeetCode.",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/30 hover:border-violet-500/60",
    accentText: "text-violet-400",
    glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]",
    tag: "Fundamentals",
  },
  {
    id: "leetcode",
    label: "LeetCode Questions",
    icon: Code2,
    desc: "Top interview questions with complete Java solutions, VS Code-style code view, and a quick approach summary.",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30 hover:border-amber-500/60",
    accentText: "text-amber-400",
    glow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]",
    tag: "Coding Practice",
  },
];

export default async function ConceptPage({ params }: { params: { concept: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const meta = CONCEPT_META[params.concept];
  if (!meta) notFound();

  return (
    <>
      <DashboardNav userName={session.user.name} />

      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/learn" className="hover:text-text transition-colors">Learn</Link>
            <span>/</span>
            <Link href="/learn/dsa" className="hover:text-text transition-colors">DSA</Link>
            <span>/</span>
            <span className={meta.color}>{meta.label}</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center text-3xl`}>
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">{meta.label}</h1>
              <p className="text-sm text-text-muted mt-0.5">Choose how you want to study</p>
            </div>
          </div>

          {/* Sub-cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SUB_CARDS.map(({ id, label, icon: Icon, desc, accentBg, accentBorder, accentText, glow, tag }) => (
              <Link
                key={id}
                href={`/learn/dsa/${params.concept}/${id}`}
                className={`group flex flex-col glass-card rounded-2xl border ${accentBorder} ${glow} p-6 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${accentBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${accentText}`} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${accentBg} ${accentText} border ${accentBorder}`}>
                    {tag}
                  </span>
                </div>

                <h2 className={`text-lg font-bold ${accentText} mb-2`}>{label}</h2>
                <p className="text-sm text-text-muted leading-relaxed flex-1">{desc}</p>

                <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${accentText}`}>
                  Open {label}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Back */}
          <Link href="/learn/dsa" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mt-10">
            <ChevronLeft className="w-4 h-4" /> All DSA concepts
          </Link>

        </div>
      </main>
    </>
  );
}
