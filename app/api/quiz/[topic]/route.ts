import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { readFile } from "fs/promises";
import { join } from "path";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const VALID_TOPICS = ["java", "oops", "cn", "os", "dbms"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { topic: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic } = params;
    if (!VALID_TOPICS.includes(topic)) return NextResponse.json({ error: "Unknown topic" }, { status: 400 });

    const count = Math.min(Number(req.nextUrl.searchParams.get("count") ?? "20"), 100);

    const filePath = join(process.cwd(), "content", "quiz", topic, "mcq.json");
    let raw: string;
    try {
      raw = await readFile(filePath, "utf-8");
    } catch {
      return NextResponse.json({ error: "Quiz not available for this topic yet" }, { status: 404 });
    }

    const data = JSON.parse(raw) as { questions: Record<string, unknown>[] };
    const questions = shuffle(data.questions).slice(0, count).map((q, i) => ({
      ...q,
      index: i + 1,
    }));

    // Also return user's stats for this topic
    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select("quizStats").lean();
    const stats = (user?.quizStats as Record<string, unknown>)?.[topic] ?? null;

    return NextResponse.json({ questions, total: questions.length, metadata: data.metadata, stats });
  } catch (err) {
    console.error("[GET /api/quiz/[topic]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
