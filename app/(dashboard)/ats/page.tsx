import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import ATSChecker from "@/components/ATSChecker";

export default async function ATSPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <ATSChecker />
    </>
  );
}
