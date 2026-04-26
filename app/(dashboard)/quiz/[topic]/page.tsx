import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import QuizTopicContent from "@/components/QuizTopicContent";

interface Props { params: { topic: string } }

export default async function QuizTopicPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10">
          <QuizTopicContent topic={params.topic} />
        </div>
      </main>
    </>
  );
}
