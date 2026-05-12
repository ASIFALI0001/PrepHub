import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  let tmpPath = "";
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

    // Write to system temp dir (works locally + on Vercel /tmp)
    tmpPath = join(tmpdir(), `resume-${randomUUID()}.pdf`);
    await writeFile(tmpPath, buffer);

    // Upload to Gemini File API
    const uploadResult = await fileManager.uploadFile(tmpPath, {
      mimeType: "application/pdf",
      displayName: "resume.pdf",
    });
    await unlink(tmpPath).catch(() => {});
    tmpPath = "";

    // Wait for file to be processed (usually instant for small PDFs)
    let uploadedFile = uploadResult.file;
    let retries = 0;
    while (uploadedFile.state === "PROCESSING" && retries < 10) {
      await new Promise((r) => setTimeout(r, 1000));
      uploadedFile = await fileManager.getFile(uploadedFile.name);
      retries++;
    }

    if (uploadedFile.state !== "ACTIVE") {
      return NextResponse.json({ error: "Failed to process PDF" }, { status: 422 });
    }

    // Extract text using the uploaded file reference
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.mimeType,
          fileUri: uploadedFile.uri,
        },
      },
      "Extract all the text from this resume PDF exactly as it appears. Return only the raw text content with no commentary.",
    ]);

    let text = "";
    try {
      text = result.response.text().trim();
    } catch {
      const parts = result.response.candidates?.[0]?.content?.parts;
      text = (parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    }

    if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });

    return NextResponse.json({ text });
  } catch (err) {
    if (tmpPath) await unlink(tmpPath).catch(() => {});
    console.error("[POST /api/career-guide/parse-resume]", err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
