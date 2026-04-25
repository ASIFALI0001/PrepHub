import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import LandingNavbar from "@/components/LandingNavbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="noise-overlay" />
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <LandingNavbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
