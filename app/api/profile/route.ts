import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select("name email profile createdAt").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ profile: user });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { semester, college, branch } = await req.json() as {
      semester?: string;
      college?: string;
      branch?: string;
    };

    await connectDB();
    await User.updateOne(
      { email: session.user.email },
      { $set: { "profile.semester": semester ?? "", "profile.college": college ?? "", "profile.branch": branch ?? "" } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
