import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import DSACodeBlock from "@/components/DSACodeBlock";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import path from "path";
import fs from "fs";

interface BasicItem {
  name: string;
  code: string;
  description: string;
}
interface BasicSection {
  title: string;
  emoji: string;
  items: BasicItem[];
}
interface BasicsData {
  concept: string;
  language: string;
  sections: BasicSection[];
}

function loadBasics(concept: string): BasicsData | null {
  const filePath = path.join(process.cwd(), "content", "learn", "dsa", concept, "basics.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as BasicsData;
}

export default async function BasicsPage({ params }: { params: { concept: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const data = loadBasics(params.concept);
  if (!data) notFound();

  return (
    <>
      <DashboardNav userName={session.user.name} />

      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href="/learn/dsa" className="hover:text-text transition-colors">DSA</Link>
            <span className="text-text-dim">/</span>
            <Link href={`/learn/dsa/${params.concept}`} className="hover:text-text transition-colors capitalize">{params.concept}</Link>
            <span className="text-text-dim">/</span>
            <span className="text-accent-violet">Basics</span>
          </div>

          {/* Title */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-text mb-1">{data.concept} — Basics</h1>
            <p className="text-sm text-text-muted">
              All the essential {data.language} array knowledge for interviews, clean and concise.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {data.sections.map((section) => (
              <div key={section.title}>

                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-xl">{section.emoji}</span>
                  <h2 className="text-base font-bold text-text">{section.title}</h2>
                  <span className="chip">{section.items.length} items</span>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.name} className="glass-card rounded-2xl overflow-hidden">
                      {/* Item header */}
                      <div className="px-5 py-3 border-b border-bg-border bg-bg-surface/50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text">{item.name}</h3>
                      </div>

                      {/* Code block */}
                      <div className="p-4">
                        <DSACodeBlock code={item.code} />
                      </div>

                      {/* Description */}
                      <div className="px-5 py-3 border-t border-bg-border bg-primary/5">
                        <p className="text-xs text-text-muted leading-relaxed">
                          <span className="text-primary font-semibold">Tip · </span>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between">
            <Link href={`/learn/dsa/${params.concept}`}
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <Link href={`/learn/dsa/${params.concept}/leetcode`} className="btn-primary gap-1.5">
              Next: LeetCode questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
