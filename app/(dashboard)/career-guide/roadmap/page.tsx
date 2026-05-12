import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import CareerGuideRoadmap from "@/components/CareerGuideRoadmap";

export default async function CareerGuideRoadmapPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <CareerGuideRoadmap />
    </>
  );
}
