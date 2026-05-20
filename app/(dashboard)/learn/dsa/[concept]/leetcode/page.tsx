import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import DSACodeBlock from "@/components/DSACodeBlock";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import path from "path";
import fs from "fs";

interface Problem {
  id: number;
  number: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  description: string;
  code: string;
  approach: string;
}
interface LeetcodeData {
  concept: string;
  problems: Problem[];
}

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Medium: "text-amber-400   bg-amber-400/10   border-amber-400/30",
  Hard:   "text-red-400     bg-red-400/10     border-red-400/30",
};

function loadLeetcode(concept: string): LeetcodeData | null {
  const filePath = path.join(process.cwd(), "content", "learn", "dsa", concept, "leetcode.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as LeetcodeData;
}

export default async function LeetcodePage({ params }: { params: { concept: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const data = loadLeetcode(params.concept);
  if (!data) notFound();

  return (
    <>
      <DashboardNav userName={session.user.name} />

      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/learn/dsa" className="hover:text-text transition-colors">DSA</Link>
            <span>/</span>
            <Link href={`/learn/dsa/${params.concept}`} className="hover:text-text transition-colors capitalize">{params.concept}</Link>
            <span>/</span>
            <span className="text-amber-400">LeetCode</span>
          </div>

          {/* Title */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-text mb-1">{data.concept} — LeetCode Questions</h1>
            <p className="text-sm text-text-muted">
              Top {data.problems.length} interview questions · Java solutions · Approach explained
            </p>
          </div>

          {/* Problems */}
          <div className="space-y-8">
            {data.problems.map((problem, idx) => (
              <div
                key={problem.id}
                className="glass-card rounded-2xl border border-bg-border overflow-hidden"
              >
                {/* Problem header */}
                <div className="px-6 py-4 border-b border-bg-border bg-bg-card/40 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Number badge */}
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-text-muted font-mono">{problem.number}</span>
                        <h2 className="text-base font-bold text-text">{problem.title}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[problem.difficulty]}`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-2xl">
                        {problem.description}
                      </p>
                    </div>
                  </div>

                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs text-text-muted hover:text-amber-400 transition-colors mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">LeetCode</span>
                  </a>
                </div>

                {/* Code block */}
                <div className="p-5">
                  <DSACodeBlock code={problem.code} />
                </div>

                {/* Approach summary */}
                <div className="px-5 pb-5">
                  <div className="rounded-xl bg-amber-400/5 border border-amber-400/20 px-4 py-3">
                    <p className="text-xs text-text-muted leading-relaxed">
                      <span className="text-amber-400 font-bold">⚡ Approach — </span>
                      {problem.approach}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between">
            <Link href={`/learn/dsa/${params.concept}/basics`}
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Basics
            </Link>
            <Link href="/learn/dsa"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
              All DSA Topics →
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
