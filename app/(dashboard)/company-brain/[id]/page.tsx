import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect, notFound } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import { ChevronLeft, Brain, ExternalLink, ChevronDown } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import CompanyBrain from "@/models/CompanyBrain";
import CompanyBrainQuestionsClient from "@/components/CompanyBrainQuestionsClient";

interface Props { params: { id: string } }

async function getCard(id: string, userId: string) {
  await connectDB();
  return CompanyBrain.findOne({ _id: id, userId }).lean();
}

export default async function CompanyBrainDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let card;
  try {
    card = await getCard(params.id, session.user.id);
  } catch { notFound(); }
  if (!card) notFound();

  const serialized = JSON.parse(JSON.stringify(card));

  const counts = serialized.questions.reduce((acc: Record<string, number>, q: { category: string }) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <Link
            href="/company-brain"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Company Brain
          </Link>

          {/* Header card */}
          <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center shrink-0 text-lg font-bold text-accent-pink">
                {serialized.companyName.split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text mb-0.5">{serialized.companyName}</h1>
                <p className="text-sm text-text-muted">{serialized.role}</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-accent-pink">
                <Brain className="w-4 h-4" />
                {serialized.questions.length} Questions
              </div>
            </div>

            {/* Category breakdown */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(counts).map(([cat, n]) => (
                <span key={cat} className="text-[10px] px-2.5 py-1 rounded-lg border border-bg-border text-text-muted font-medium">
                  {cat}: {String(n)}
                </span>
              ))}
            </div>

            {/* Description */}
            {serialized.description && (
              <p className="text-xs text-text-muted leading-relaxed border-t border-bg-border pt-4">
                {serialized.description.slice(0, 300)}{serialized.description.length > 300 ? "…" : ""}
              </p>
            )}
          </div>

          {/* Sources */}
          {serialized.sources.length > 0 && (
            <div className="glass-card rounded-xl border border-bg-border p-4 mb-5">
              <div className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-widest">Sources Scraped</div>
              <div className="flex flex-wrap gap-2">
                {serialized.sources.map((src: string, i: number) => (
                  <a
                    key={i}
                    href={src.startsWith("http") ? src : `https://${src}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-bg-surface border border-bg-border text-text-muted hover:text-primary transition-colors"
                  >
                    {src.replace(/^https?:\/\//, "").split("/")[0].slice(0, 30)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Questions — client component for accordion + filter */}
          <CompanyBrainQuestionsClient questions={serialized.questions} />
        </div>
      </main>
    </>
  );
}
