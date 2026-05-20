import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";

const CONCEPTS = [
  {
    id: "array",
    label: "Arrays",
    emoji: "📦",
    desc: "Declaration, traversal, sorting, two-pointer, prefix sum, sliding window.",
    color: "text-violet-400",
    border: "border-violet-500/30 hover:border-violet-500/60",
    glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]",
    bg: "bg-violet-500/8",
    available: true,
  },
  {
    id: "string",
    label: "Strings",
    emoji: "🔤",
    desc: "String methods, StringBuilder, substring, palindrome, anagram patterns.",
    color: "text-sky-400",
    border: "border-sky-500/20",
    glow: "",
    bg: "bg-sky-500/5",
    available: false,
  },
  {
    id: "linked-list",
    label: "Linked List",
    emoji: "🔗",
    desc: "Singly, doubly, cycle detection, reversal, merge, fast-slow pointers.",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "",
    bg: "bg-emerald-500/5",
    available: false,
  },
  {
    id: "stack",
    label: "Stack",
    emoji: "📚",
    desc: "LIFO, monotonic stack, parenthesis matching, next greater element.",
    color: "text-orange-400",
    border: "border-orange-500/20",
    glow: "",
    bg: "bg-orange-500/5",
    available: false,
  },
  {
    id: "queue",
    label: "Queue",
    emoji: "🚶",
    desc: "FIFO, BFS traversal, circular queue, deque, sliding window maximum.",
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    glow: "",
    bg: "bg-yellow-500/5",
    available: false,
  },
  {
    id: "tree",
    label: "Tree",
    emoji: "🌳",
    desc: "Binary trees, BST, traversals (inorder/preorder/postorder), height, LCA.",
    color: "text-green-400",
    border: "border-green-500/20",
    glow: "",
    bg: "bg-green-500/5",
    available: false,
  },
  {
    id: "graph",
    label: "Graph",
    emoji: "🕸️",
    desc: "BFS, DFS, Dijkstra, topological sort, union-find, cycle detection.",
    color: "text-pink-400",
    border: "border-pink-500/20",
    glow: "",
    bg: "bg-pink-500/5",
    available: false,
  },
  {
    id: "dp",
    label: "Dynamic Programming",
    emoji: "🧩",
    desc: "Memoization, tabulation, LCS, knapsack, coin change, DP on trees.",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    glow: "",
    bg: "bg-cyan-500/5",
    available: false,
  },
];

export default async function DSAPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />

      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Back */}
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" /> Back to Learn
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">🧠</div>
              <h1 className="text-2xl font-bold text-text">Data Structures & Algorithms</h1>
            </div>
            <p className="text-text-muted text-sm ml-[52px]">
              Pick a concept — each has Basics + LeetCode questions with Java solutions.
            </p>
          </div>

          {/* Concept grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONCEPTS.map((c) => {
              const card = (
                <div
                  className={`group relative flex flex-col glass-card rounded-2xl border ${c.border} ${c.glow} p-5 transition-all duration-300 h-full
                    ${c.available ? "hover:-translate-y-1 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                >
                  {/* Lock badge */}
                  {!c.available && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-text-muted bg-bg-card border border-bg-border rounded-full px-2 py-0.5">
                      <Lock className="w-2.5 h-2.5" /> Soon
                    </span>
                  )}

                  {/* Emoji icon */}
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl mb-4 transition-colors`}>
                    {c.emoji}
                  </div>

                  <h3 className={`font-semibold text-[15px] mb-1 ${c.available ? c.color : "text-text"}`}>{c.label}</h3>
                  <p className="text-xs text-text-muted leading-relaxed flex-1">{c.desc}</p>

                  {c.available && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      Start learning
                    </div>
                  )}
                </div>
              );

              return c.available ? (
                <Link key={c.id} href={`/learn/dsa/${c.id}`} className="h-full">
                  {card}
                </Link>
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
