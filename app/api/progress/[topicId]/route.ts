import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { TOPIC_MAP } from "@/lib/topics";
import { updateStreak } from "@/lib/streak";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId } = params;
    if (!TOPIC_MAP[topicId]) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }

    const body = await req.json();
    const { questionId, action } = body;

    if (!questionId || !["add", "remove"].includes(action)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Initialise topicProgress if missing (users created before this field was added)
    if (!user.topicProgress || typeof user.topicProgress !== "object") {
      user.topicProgress = {};
    }

    const progress = user.topicProgress as Record<string, string[]>;
    const current: string[] = Array.isArray(progress[topicId]) ? progress[topicId] : [];

    if (action === "add") {
      const merged = new Set(current);
      merged.add(String(questionId));
      progress[topicId] = Array.from(merged);
    } else {
      progress[topicId] = current.filter((id) => id !== String(questionId));
    }

    user.topicProgress = progress;
    user.markModified("topicProgress");
    await user.save();
    if (action === "add") updateStreak(session.user.id); // fire-and-forget

    return NextResponse.json({
      topicId,
      learned: progress[topicId].length,
      total: TOPIC_MAP[topicId].total,
    });
  } catch (err) {
    console.error("[PATCH /api/progress]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId } = params;
    if (!TOPIC_MAP[topicId]) {
      return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.topicProgress || typeof user.topicProgress !== "object") {
      user.topicProgress = {};
    }

    (user.topicProgress as Record<string, string[]>)[topicId] = [];
    user.markModified("topicProgress");
    await user.save();

    return NextResponse.json({ topicId, learned: 0 });
  } catch (err) {
    console.error("[DELETE /api/progress]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
