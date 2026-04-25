import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { generateInterviewQuestions } from "@/lib/gemini";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const interviews = await Interview.find({ userId: session.user.id })
      .select("-questions.expectedKeyPoints -answers -report")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ interviews });
  } catch (err) {
    console.error("[GET /api/interview]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, type, level, questionCount } = body;

    if (!role || !["technical", "behavioral", "mixed"].includes(type) ||
        !["beginner", "intermediate", "senior"].includes(level) ||
        !questionCount || questionCount < 3 || questionCount > 20) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const questions = await generateInterviewQuestions(role, type, level, questionCount);

    const typeLabel = { technical: "Technical", behavioral: "Behavioral", mixed: "Mixed" }[type as string];
    const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", senior: "Senior" }[level as string];
    const title = `${role} — ${typeLabel} (${levelLabel})`;

    await connectDB();
    const interview = await Interview.create({
      userId: session.user.id,
      title,
      role,
      type,
      level,
      questionCount,
      questions,
      status: "pending",
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/interview]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
