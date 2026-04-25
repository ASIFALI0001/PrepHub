import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { TOPIC_MAP } from "@/lib/topics";

export async function GET(
  _req: NextRequest,
  { params }: { params: { topic: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic } = params;
  if (!TOPIC_MAP[topic]) return NextResponse.json({ error: "Unknown topic" }, { status: 404 });

  const filePath = join(process.cwd(), "content", "learn", topic, "questions.json");

  try {
    const raw = await readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Content not available yet" }, { status: 404 });
  }
}
