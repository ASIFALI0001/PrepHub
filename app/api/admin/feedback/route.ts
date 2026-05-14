import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Feedback from "@/models/Feedback";

const FEATURES = ["learn", "quiz", "interview", "companyBrain", "ats", "careerGuide"] as const;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const all = await Feedback.find({}).sort({ createdAt: -1 }).lean();

    // Compute averages per feature
    const avgs: Record<string, number | null> = {};
    for (const feature of FEATURES) {
      const rated = all.filter((f) => (f.ratings as Record<string, number>)[feature] > 0);
      avgs[feature] = rated.length > 0
        ? Math.round((rated.reduce((sum, f) => sum + (f.ratings as Record<string, number>)[feature], 0) / rated.length) * 10) / 10
        : null;
    }

    return NextResponse.json({ feedbacks: all, averages: avgs, total: all.length });
  } catch (err) {
    console.error("[GET /api/admin/feedback]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
