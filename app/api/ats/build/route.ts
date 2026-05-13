import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { buildLatexResume } from "@/lib/ats";
import type { SimilarResume } from "@/lib/ats";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeText, jobDescription, editInstruction, similarResumes } = await req.json() as {
      resumeText: string;
      jobDescription?: string;
      editInstruction?: string;
      similarResumes?: SimilarResume[];
    };

    if (!resumeText?.trim()) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
    }

    const latex = await buildLatexResume(resumeText, jobDescription, editInstruction, similarResumes);
    return NextResponse.json({ latex });
  } catch (err) {
    console.error("[POST /api/ats/build]", err);
    return NextResponse.json({ error: "Resume build failed" }, { status: 500 });
  }
}
