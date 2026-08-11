import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import QuizTopicsClient from "@/components/QuizTopicsClient";

export default async function QuizPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Test yourself"
            icon={<Zap />}
            title="Quiz"
            description="Timed MCQ sessions that track your readiness topic-by-topic."
          />
          <QuizTopicsClient />
        </div>
      </main>
    </>
  );
}
