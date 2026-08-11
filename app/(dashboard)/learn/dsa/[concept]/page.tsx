import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import { ChevronLeft, BookOpen, Code2, ArrowRight } from "lucide-react";

const CONCEPT_META: Record<string, { label: string; emoji: string; accent: string }> = {
  array: { label: "Arrays", emoji: "📦", accent: "text-accent-violet" },
  string: { label: "Strings", emoji: "🔤", accent: "text-accent-blue" },
  "linked-list": { label: "Linked List", emoji: "🔗", accent: "text-accent-green" },
  stack: { label: "Stack", emoji: "📚", accent: "text-accent-orange" },
  queue: { label: "Queue", emoji: "🚶", accent: "text-accent-cyan" },
  tree: { label: "Tree", emoji: "🌳", accent: "text-accent-green" },
  graph: { label: "Graph", emoji: "🕸️", accent: "text-accent-pink" },
  dp: { label: "Dynamic Programming", emoji: "🧩", accent: "text-accent-cyan" },
};

const SUB_CARDS = [
  {
    id: "basics",
    label: "Basics",
    icon: BookOpen,
    desc: "Core concepts, syntax, built-in methods and essential patterns — everything you need before LeetCode.",
    accent: "text-primary", hoverBorder: "hover:border-primary/40", tag: "Fundamentals",
  },
  {
    id: "leetcode",
    label: "LeetCode Questions",
    icon: Code2,
    desc: "Top interview questions with complete Java solutions, an editor-style code view, and a quick approach summary.",
    accent: "text-accent-orange", hoverBorder: "hover:border-accent-orange/40", tag: "Coding practice",
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
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/learn" className="hover:text-text transition-colors">Learn</Link>
            <span className="text-text-dim">/</span>
            <Link href="/learn/dsa" className="hover:text-text transition-colors">DSA</Link>
            <span className="text-text-dim">/</span>
            <span className={meta.accent}>{meta.label}</span>
          </nav>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center text-3xl">
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text tracking-tight">{meta.label}</h1>
              <p className="text-sm text-text-muted mt-0.5">Choose how you want to study</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUB_CARDS.map(({ id, label, icon: Icon, desc, accent, hoverBorder, tag }) => (
              <Link
                key={id}
                href={`/learn/dsa/${params.concept}/${id}`}
                className={`group flex flex-col glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${hoverBorder}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="chip">{tag}</span>
                </div>
                <h2 className={`text-lg font-bold mb-2 ${accent}`}>{label}</h2>
                <p className="text-sm text-text-muted leading-relaxed flex-1">{desc}</p>
                <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${accent}`}>
                  Open {label}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <Link href="/learn/dsa" className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mt-10">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> All DSA concepts
          </Link>
        </div>
      </main>
    </>
  );
}
