import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { analyzeATS, storeTopResume } from "@/lib/ats";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeText, jobDescription } = await req.json() as {
      resumeText: string;
      jobDescription?: string;
    };

    if (!resumeText?.trim()) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    const report = await analyzeATS(resumeText, jobDescription);

    // Fire-and-forget: store if score >= 90
    if (report.overallScore >= 90) {
      storeTopResume(
        resumeText,
        report.overallScore,
        report.roleType,
        report.keywordsFound
      );
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[POST /api/ats/analyze]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
