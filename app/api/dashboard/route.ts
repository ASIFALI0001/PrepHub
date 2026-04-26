import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [user, interviews] = await Promise.all([
      User.findOne({ email: session.user.email }).select("streak lastActive quizStats").lean(),
      Interview.find({ userId: session.user.id, status: "completed" })
        .select("report.overallScore createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // ── Streak ───────────────────────────────────────────────────────────
    const streak = user?.streak ?? 0;

    // ── Quiz accuracy — avg of all attempted topic avgScores ────────────
    const quizStats = (user?.quizStats ?? {}) as Record<string, { attempts: number; avgScore: number }>;
    const attempted = Object.values(quizStats).filter((s) => s.attempts > 0);
    const quizAccuracy = attempted.length > 0
      ? Math.round(attempted.reduce((sum, s) => sum + s.avgScore, 0) / attempted.length)
      : null;

    // ── Interview stats ──────────────────────────────────────────────────
    const completedCount = interviews.length;
    const scores = interviews
      .map((i) => (i.report as { overallScore?: number } | null)?.overallScore)
      .filter((s): s is number => typeof s === "number");

    const interviewAvgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const interviewAvgGrade = interviewAvgScore !== null ? scoreToGrade(interviewAvgScore) : null;

    return NextResponse.json({
      streak,
      quizAccuracy,         // number | null
      quizTopicsAttempted: attempted.length,
      interviewsCompleted: completedCount,
      interviewAvgScore,    // number | null
      interviewAvgGrade,    // string | null
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
