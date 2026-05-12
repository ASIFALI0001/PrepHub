import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CareerGuide from "@/models/CareerGuide";
import { generateCareerRoadmap } from "@/lib/careerGuide";
import type { GitHubData } from "@/lib/careerGuide";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { chosenPath, guideId } = await req.json() as { chosenPath: string; guideId: string };
    if (!chosenPath || !guideId) return NextResponse.json({ error: "Missing chosenPath or guideId" }, { status: 400 });

    await connectDB();
    const guide = await CareerGuide.findOne({ _id: guideId, userId: session.user.id });
    if (!guide) return NextResponse.json({ error: "Career guide not found" }, { status: 404 });

    const roadmap = await generateCareerRoadmap(
      chosenPath,
      guide.resumeText,
      guide.githubData as GitHubData | null,
      {},
      guide.mcqAnswers as { question: string; answer: string }[]
    );

    guide.roadmap = roadmap;
    guide.status = "roadmap_ready";
    await guide.save();

    return NextResponse.json({ roadmap });
  } catch (err) {
    console.error("[POST /api/career-guide/roadmap]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
