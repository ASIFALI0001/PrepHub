import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select("quizStats").lean();
    return NextResponse.json({ stats: user?.quizStats ?? {} });
  } catch (err) {
    console.error("[GET /api/quiz/stats]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
