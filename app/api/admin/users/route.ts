import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Interview from "@/models/Interview";

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const users = await User.find({})
      .select("name email blocked streak lastActive quizStats profile createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const interviews = await Interview.find({ status: "completed" })
      .select("userId report.overallScore")
      .lean();

    // Group interview scores by userId
    const interviewMap: Record<string, number[]> = {};
    for (const iv of interviews) {
      const score = (iv.report as { overallScore?: number } | null)?.overallScore;
      if (typeof score === "number") {
        if (!interviewMap[iv.userId]) interviewMap[iv.userId] = [];
        interviewMap[iv.userId].push(score);
      }
    }

    const enriched = users.map((u) => {
      const qs = (u.quizStats ?? {}) as Record<string, { attempts: number; avgScore: number }>;
      const attempted = Object.values(qs).filter((s) => s.attempts > 0);
      const quizAccuracy = attempted.length > 0
        ? Math.round(attempted.reduce((sum, s) => sum + s.avgScore, 0) / attempted.length)
        : null;

      const scores = interviewMap[u._id.toString()] ?? [];
      const interviewAvgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      return {
        _id:           u._id,
        name:          u.name,
        email:         u.email,
        blocked:       u.blocked ?? false,
        streak:        u.streak ?? 0,
        lastActive:    u.lastActive,
        createdAt:     u.createdAt,
        profile:       u.profile ?? {},
        quizAccuracy,
        quizTopics:    attempted.length,
        interviewCount: scores.length,
        interviewAvgScore,
        interviewGrade: interviewAvgScore !== null ? scoreToGrade(interviewAvgScore) : null,
      };
    });

    return NextResponse.json({ users: enriched, total: enriched.length });
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Block / unblock a user
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, blocked } = await req.json();
    if (!userId || typeof blocked !== "boolean") {
      return NextResponse.json({ error: "userId and blocked (boolean) required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(userId, { blocked }, { new: true }).select("_id blocked");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ok: true, userId, blocked: user.blocked });
  } catch (err) {
    console.error("[PATCH /api/admin/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
