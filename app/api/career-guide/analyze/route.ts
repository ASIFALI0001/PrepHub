import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CareerGuide from "@/models/CareerGuide";
import User from "@/models/User";
import Interview from "@/models/Interview";
import CompanyBrain from "@/models/CompanyBrain";
import { fetchGitHubData, analyzeCareerOptions } from "@/lib/careerGuide";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { resumeText, githubUrl, mcqAnswers, usePlatformData } = body as {
      resumeText: string;
      githubUrl: string;
      mcqAnswers: { question: string; answer: string }[];
      usePlatformData: boolean;
    };

    if (!resumeText || !mcqAnswers?.length) {
      return NextResponse.json({ error: "Missing resume or answers" }, { status: 400 });
    }

    await connectDB();

    // Conditionally pull platform data
    let platformData: Record<string, unknown> = {};
    if (usePlatformData) {
      const [user, interviews, companyBrains] = await Promise.all([
        User.findOne({ email: session.user.email }).select("quizStats").lean(),
        Interview.find({ userId: session.user.id })
          .select("report.overallScore role level type status")
          .lean(),
        CompanyBrain.find({ userId: session.user.id })
          .select("companyName role")
          .lean(),
      ]);

      const quizStats = (user?.quizStats ?? {}) as Record<string, { attempts: number; avgScore: number }>;
      const completedInterviews = interviews.filter((i) => i.status === "completed");

      platformData = {
        quizStats,
        interviewsCompleted: completedInterviews.length,
        interviewHistory: interviews.map((i) => ({
          role: i.role,
          level: i.level,
          type: i.type,
          status: i.status,
          score: (i.report as { overallScore?: number } | null)?.overallScore ?? null,
        })),
        companiesResearched: companyBrains.map((c) => ({
          company: c.companyName,
          role: c.role,
        })),
      };
    }

    // Fetch GitHub data
    const githubData = githubUrl ? await fetchGitHubData(githubUrl) : null;

    // Analyze with Gemini
    const careerOptions = await analyzeCareerOptions(resumeText, githubData, platformData, mcqAnswers);

    // Always create a new doc — every assessment is stored separately
    const guide = await CareerGuide.create({
      userId: session.user.id,
      resumeText,
      githubUsername: githubData?.username ?? "",
      githubData: githubData ?? {},
      mcqAnswers,
      usedPlatformData: usePlatformData,
      careerOptions,
      roadmap: null,
      status: "options_ready",
    });

    return NextResponse.json({ guideId: guide._id.toString(), careerOptions });
  } catch (err) {
    console.error("[POST /api/career-guide/analyze]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
