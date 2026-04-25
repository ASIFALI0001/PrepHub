import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect, notFound } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import InterviewModeWrapper from "@/components/InterviewModeWrapper";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";

interface Props {
  params: { id: string };
}

async function getInterview(id: string, userId: string) {
  await connectDB();
  return Interview.findOne({ _id: id, userId }).lean();
}

export default async function InterviewSessionPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let interview;
  try {
    interview = await getInterview(params.id, session.user.id);
  } catch { notFound(); }
  if (!interview) notFound();

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10">
          <InterviewModeWrapper
            interview={JSON.parse(JSON.stringify(interview))}
            userName={session.user.name}
          />
        </div>
      </main>
    </>
  );
}
