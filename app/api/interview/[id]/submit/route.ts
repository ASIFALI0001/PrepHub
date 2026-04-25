import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { evaluateInterviewAnswers, evaluateFromTranscript } from "@/lib/gemini";
import type { IAnswer } from "@/models/Interview";
import type { TranscriptEntry } from "@/lib/gemini";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();
    const interview = await Interview.findOne({ _id: params.id, userId: session.user.id });
    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let report;

    if (body.vapiTranscript) {
      // ── Vapi mode: evaluate from full conversation transcript ──────────────
      const vapiTranscript: TranscriptEntry[] = body.vapiTranscript;

      if (!Array.isArray(vapiTranscript) || vapiTranscript.length === 0) {
        return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
      }

      report = await evaluateFromTranscript(
        interview.role,
        interview.level,
        interview.questions.map((q) => ({
          id: q.id,
          text: q.text,
          expectedKeyPoints: q.expectedKeyPoints,
        })),
        vapiTranscript
      );

      // Build IAnswer records from the question reports for storage
      const answers: IAnswer[] = report.questionReports.map((qr) => ({
        questionId: qr.questionId,
        questionText: qr.questionText,
        answerText: qr.answerText,
      }));
      interview.answers = answers;

    } else {
      // ── Web speech mode: structured answers ────────────────────────────────
      const { answers }: { answers: IAnswer[] } = body;
      if (!Array.isArray(answers) || answers.length === 0) {
        return NextResponse.json({ error: "No answers provided" }, { status: 400 });
      }

      report = await evaluateInterviewAnswers(interview.role, interview.level, answers);
      interview.answers = answers;
    }

    interview.report = report;
    interview.status = "completed";
    await interview.save();

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[POST /api/interview/[id]/submit]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
