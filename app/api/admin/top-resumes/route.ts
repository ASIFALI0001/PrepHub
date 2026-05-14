import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import TopResume from "@/models/TopResume";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const resumes = await TopResume.find({})
      .select("score roleType skills anonymizedContent createdAt")
      .sort({ score: -1 })
      .lean();

    const enriched = resumes.map((r) => ({
      _id:      r._id,
      score:    r.score,
      roleType: r.roleType,
      skills:   r.skills,
      preview:  (r.anonymizedContent as string).slice(0, 400),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ resumes: enriched, total: enriched.length });
  } catch (err) {
    console.error("[GET /api/admin/top-resumes]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
