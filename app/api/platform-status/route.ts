import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Settings from "@/models/Settings";

/**
 * Per-request access status for the signed-in user:
 *  - `blocked`: whether an admin has blocked this account
 *  - `disabledPages`: feature keys an admin has paused platform-wide
 * Read fresh from the DB each call so blocks/pauses reflect without re-login.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ blocked: false, disabledPages: [] });

  try {
    await connectDB();
    const [user, settings] = await Promise.all([
      User.findById(session.user.id).select("blocked").lean(),
      Settings.findOne({ key: "platform" }).select("disabledPages").lean(),
    ]);

    return NextResponse.json({
      blocked: !!user?.blocked,
      disabledPages: settings?.disabledPages ?? [],
    });
  } catch (err) {
    console.error("[GET /api/platform-status]", err);
    return NextResponse.json({ blocked: false, disabledPages: [] });
  }
}
