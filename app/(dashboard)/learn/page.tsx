import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import TopicCard from "@/components/TopicCard";
import { SECTIONS, ALL_TOPICS } from "@/lib/topics";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { GraduationCap } from "lucide-react";

async function getProgress(email: string): Promise<Record<string, string[]>> {
  await connectDB();
  const user = await User.findOne({ email }).select("topicProgress");
  return user?.topicProgress ?? {};
}

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const progress = await getProgress(session.user.email);

  // completed = number of learned question IDs per topic
  const getCompleted = (topicId: string) => (progress[topicId]?.length ?? 0);

  const totalCompleted = ALL_TOPICS.reduce((sum, t) => sum + Math.min(getCompleted(t.id), t.total), 0);
  const grandTotal = ALL_TOPICS.reduce((sum, t) => sum + t.total, 0);
  const overallPct = Math.round((totalCompleted / grandTotal) * 100);

  return (
    <>
      <DashboardNav userName={session.user.name} />

      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">Learn</h1>
                <p className="text-text-muted text-sm">Curated concepts, one topic at a time.</p>
              </div>
            </div>

            {/* Overall progress */}
            <div className="flex items-center gap-3 glass rounded-xl border border-bg-border px-4 py-2.5 self-start sm:self-auto">
              <div className="w-20 h-1.5 rounded-full bg-bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-text">{overallPct}%</span>
              <span className="text-xs text-text-muted">overall</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {SECTIONS.map((section) => {
              const sectionCompleted = section.topics.reduce((sum, t) => sum + Math.min(getCompleted(t.id), t.total), 0);
              const sectionTotal = section.topics.reduce((sum, t) => sum + t.total, 0);
              const sectionPct = Math.round((sectionCompleted / sectionTotal) * 100);
              const topicsStarted = section.topics.filter((t) => getCompleted(t.id) > 0).length;

              return (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase tracking-widest ${section.accent}`}>
                        {section.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        {topicsStarted} / {section.topics.length} started
                      </span>
                    </div>
                    <span className="text-xs text-text-muted font-medium">{sectionPct}% done</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.topics.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        completed={getCompleted(topic.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
