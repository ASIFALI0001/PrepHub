import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { Lock, ArrowRight, Braces } from "lucide-react";

const CONCEPTS = [
  { id: "array", label: "Arrays", emoji: "📦", desc: "Declaration, traversal, sorting, two-pointer, prefix sum, sliding window.", accent: "text-accent-violet", available: true },
  { id: "string", label: "Strings", emoji: "🔤", desc: "String methods, StringBuilder, substring, palindrome, anagram patterns.", accent: "text-accent-blue", available: false },
  { id: "linked-list", label: "Linked List", emoji: "🔗", desc: "Singly, doubly, cycle detection, reversal, merge, fast-slow pointers.", accent: "text-accent-green", available: false },
  { id: "stack", label: "Stack", emoji: "📚", desc: "LIFO, monotonic stack, parenthesis matching, next greater element.", accent: "text-accent-orange", available: false },
  { id: "queue", label: "Queue", emoji: "🚶", desc: "FIFO, BFS traversal, circular queue, deque, sliding window maximum.", accent: "text-accent-cyan", available: false },
  { id: "tree", label: "Tree", emoji: "🌳", desc: "Binary trees, BST, traversals (in/pre/post-order), height, LCA.", accent: "text-accent-green", available: false },
  { id: "graph", label: "Graph", emoji: "🕸️", desc: "BFS, DFS, Dijkstra, topological sort, union-find, cycle detection.", accent: "text-accent-pink", available: false },
  { id: "dp", label: "Dynamic Programming", emoji: "🧩", desc: "Memoization, tabulation, LCS, knapsack, coin change, DP on trees.", accent: "text-accent-cyan", available: false },
];

export default async function DSAPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <PageHeader
            eyebrow="Concept-by-concept"
            icon={<Braces />}
            title="Data Structures & Algorithms"
            description="Pick a concept — each has Basics + LeetCode questions with Java solutions."
            back={{ href: "/learn", label: "Back to Learn" }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONCEPTS.map((c) => {
              const card = (
                <div className={`group relative flex flex-col h-full glass-card rounded-2xl p-5 transition-all duration-300 ${
                  c.available ? "hover:-translate-y-1 hover:border-text-dim/25 cursor-pointer" : "opacity-55 cursor-not-allowed"
                }`}>
                  {!c.available && (
                    <span className="chip absolute top-3 right-3"><Lock className="w-2.5 h-2.5" /> Soon</span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center text-2xl mb-4">
                    {c.emoji}
                  </div>
                  <h3 className={`font-semibold text-[15px] mb-1 ${c.available ? c.accent : "text-text"}`}>{c.label}</h3>
                  <p className="text-xs text-text-muted leading-relaxed flex-1">{c.desc}</p>
                  {c.available && (
                    <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold ${c.accent}`}>
                      Start learning
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  )}
                </div>
              );
              return c.available ? (
                <Link key={c.id} href={`/learn/dsa/${c.id}`} className="h-full">{card}</Link>
              ) : (
                <div key={c.id} className="h-full">{card}</div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
