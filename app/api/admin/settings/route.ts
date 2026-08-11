import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Settings, { VALID_PAGE_KEYS } from "@/models/Settings";

// Read the current platform settings (which pages are paused).
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const s = await Settings.findOne({ key: "platform" }).select("disabledPages").lean();
    return NextResponse.json({ disabledPages: s?.disabledPages ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Persist the full set of paused pages (upserts the singleton doc).
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const disabledPages: string[] = Array.isArray(body.disabledPages)
      ? Array.from(new Set(body.disabledPages.filter((p: unknown): p is string => typeof p === "string" && VALID_PAGE_KEYS.includes(p))))
      : [];

    await connectDB();
    const s = await Settings.findOneAndUpdate(
      { key: "platform" },
      { disabledPages },
      { upsert: true, new: true }
    ).select("disabledPages");

    return NextResponse.json({ ok: true, disabledPages: s.disabledPages });
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
