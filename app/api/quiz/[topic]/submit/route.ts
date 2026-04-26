import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { updateStreak } from "@/lib/streak";

export async function POST(
  req: NextRequest,
  { params }: { params: { topic: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { score, total } = await req.json(); // score = number correct
    if (typeof score !== "number" || typeof total !== "number") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const pct = Math.round((score / total) * 100);
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const stats = (user.quizStats ?? {}) as Record<string, { attempts: number; avgScore: number; lastScore: number; lastTaken: Date }>;
    const prev = stats[params.topic] ?? { attempts: 0, avgScore: 0, lastScore: 0, lastTaken: new Date() };

    const attempts = prev.attempts + 1;
    const avgScore = Math.round(((prev.avgScore * prev.attempts) + pct) / attempts);

    stats[params.topic] = { attempts, avgScore, lastScore: pct, lastTaken: new Date() };
    user.quizStats = stats;
    user.markModified("quizStats");
    await user.save();
    updateStreak(session.user.id); // fire-and-forget

    return NextResponse.json({ pct, attempts, avgScore });
  } catch (err) {
    console.error("[POST /api/quiz/[topic]/submit]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
