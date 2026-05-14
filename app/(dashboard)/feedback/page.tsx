import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import FeedbackPage from "@/components/FeedbackPage";

export default async function Feedback() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <>
      <DashboardNav userName={session.user.name} />
      <FeedbackPage />
    </>
  );
}
