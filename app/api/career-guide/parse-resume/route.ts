import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// pdf-parse is CJS only — must use require to avoid ESM interop issues on Vercel
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse(buffer);
    const text = result.text.trim();

    if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[POST /api/career-guide/parse-resume]", err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
