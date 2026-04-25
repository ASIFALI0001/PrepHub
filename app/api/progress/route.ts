import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select("topicProgress");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure field exists for users created before this field was added
    const progress = (user.topicProgress && typeof user.topicProgress === "object")
      ? user.topicProgress
      : {};

    return NextResponse.json({ progress });
  } catch (err) {
    console.error("[GET /api/progress]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
