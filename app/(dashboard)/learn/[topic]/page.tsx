import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import TopicPageContent from "@/components/TopicPageContent";
import { TOPIC_MAP } from "@/lib/topics";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function getLearnedIds(email: string, topicId: string): Promise<string[]> {
  await connectDB();
  const user = await User.findOne({ email }).select("topicProgress");
  return user?.topicProgress?.[topicId] ?? [];
}

export default async function TopicPage({ params }: { params: { topic: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const topic = TOPIC_MAP[params.topic];
  if (!topic) notFound();

  const learnedIds = await getLearnedIds(session.user.email, topic.id);

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <TopicPageContent topic={topic} initialLearnedIds={learnedIds} />
        </div>
      </main>
    </>
  );
}
