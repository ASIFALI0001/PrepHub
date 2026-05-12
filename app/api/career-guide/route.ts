import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CareerGuide from "@/models/CareerGuide";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const guides = await CareerGuide.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ guides });
  } catch (err) {
    console.error("[GET /api/career-guide]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
