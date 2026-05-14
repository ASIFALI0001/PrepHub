import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Feedback from "@/models/Feedback";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ratings, text } = await req.json() as {
      ratings: { learn: number; quiz: number; interview: number; companyBrain: number; ats: number; careerGuide: number };
      text?: string;
    };

    await connectDB();

    // Upsert — one feedback per user (update if they submit again)
    await Feedback.findOneAndUpdate(
      { userId: session.user.id },
      {
        userId:    session.user.id,
        userName:  session.user.name,
        userEmail: session.user.email,
        ratings,
        text: text ?? "",
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/feedback]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const existing = await Feedback.findOne({ userId: session.user.id }).lean();
    return NextResponse.json({ feedback: existing ?? null });
  } catch (err) {
    console.error("[GET /api/feedback]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
