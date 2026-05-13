import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { findSimilarResumes } from "@/lib/ats";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeText } = await req.json() as { resumeText: string };
    if (!resumeText?.trim()) return NextResponse.json({ error: "Missing resumeText" }, { status: 400 });

    const similar = await findSimilarResumes(resumeText);
    return NextResponse.json({ similar });
  } catch (err) {
    console.error("[POST /api/ats/similar]", err);
    return NextResponse.json({ error: "Vector search failed" }, { status: 500 });
  }
}
