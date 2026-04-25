import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CompanyBrain from "@/models/CompanyBrain";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const card = await CompanyBrain.findOne({ _id: params.id, userId: session.user.id }).lean();
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ card });
  } catch (err) {
    console.error("[GET /api/company-brain/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const result = await CompanyBrain.deleteOne({ _id: params.id, userId: session.user.id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/company-brain/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
