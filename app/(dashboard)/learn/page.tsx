import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import TopicCard from "@/components/TopicCard";
import { SECTIONS, ALL_TOPICS } from "@/lib/topics";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function getProgress(email: string): Promise<Record<string, string[]>> {
  await connectDB();
  const user = await User.findOne({ email }).select("topicProgress");
  return user?.topicProgress ?? {};
}

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const progress = await getProgress(session.user.email);
  const getCompleted = (topicId: string) => (progress[topicId]?.length ?? 0);

  const totalCompleted = ALL_TOPICS.reduce((sum, t) => sum + Math.min(getCompleted(t.id), t.total), 0);
  const grandTotal = ALL_TOPICS.reduce((sum, t) => sum + t.total, 0);
  const overallPct = grandTotal > 0 ? Math.round((totalCompleted / grandTotal) * 100) : 0;

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Curated concepts"
            icon={<GraduationCap />}
            title="Learn"
            description="Master interview topics one curated question at a time."
            actions={
              <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5">
                <div className="w-24 h-1.5 rounded-full bg-bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overallPct}%` }} />
                </div>
                <span className="tnum text-sm font-semibold text-text">{overallPct}%</span>
                <span className="text-xs text-text-muted">overall</span>
              </div>
            }
          />

          <div className="space-y-12">
            {SECTIONS.map((section) => {
              const sectionCompleted = section.topics.reduce((sum, t) => sum + Math.min(getCompleted(t.id), t.total), 0);
              const sectionTotal = section.topics.reduce((sum, t) => sum + t.total, 0);
              const sectionPct = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;
              const topicsStarted = section.topics.filter((t) => getCompleted(t.id) > 0).length;

              return (
                <section key={section.id}>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-bg-border">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase tracking-[0.14em] ${section.accent}`}>{section.label}</span>
                      <span className="tnum text-xs text-text-muted">{topicsStarted} / {section.topics.length} started</span>
                    </div>
                    <span className="tnum text-xs text-text-muted font-medium">{sectionPct}% done</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.topics.map((topic) => (
                      <TopicCard key={topic.id} topic={topic} completed={getCompleted(topic.id)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
