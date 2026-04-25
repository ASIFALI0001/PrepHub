import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAnswer, IQuestion, IReport } from "@/models/Interview";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"];

export async function generateWithRetry(prompt: string, maxAttempts = 4): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const modelName = MODELS[attempt % MODELS.length];
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastError = err as Error;
      const is503 = lastError.message?.includes("503") || lastError.message?.includes("Service Unavailable");
      const is429 = lastError.message?.includes("429") || lastError.message?.includes("quota");

      if (!is503 && !is429) throw lastError; // non-retryable error

      // Exponential backoff: 2s, 4s, 8s
      const delay = 2000 * Math.pow(2, attempt);
      console.warn(`[gemini] ${modelName} attempt ${attempt + 1} failed (${is503 ? "503" : "429"}), retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError ?? new Error("Gemini request failed after all retries");
}

export async function generateInterviewQuestions(
  role: string,
  type: "technical" | "behavioral" | "mixed",
  level: "beginner" | "intermediate" | "senior",
  count: number
): Promise<IQuestion[]> {
  const typeDesc = {
    technical: "technical coding, system design, and domain-specific questions",
    behavioral: "behavioral STAR-method questions about past experience and soft skills",
    mixed: "a mix of technical and behavioral questions",
  }[type];

  const levelDesc = {
    beginner: "entry-level (0–2 years experience)",
    intermediate: "mid-level (2–5 years experience)",
    senior: "senior-level (5+ years experience)",
  }[level];

  const prompt = `You are an expert technical interviewer. Generate exactly ${count} interview questions for a ${levelDesc} ${role} position.

Focus on ${typeDesc}.

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "id": "q1",
    "text": "The interview question",
    "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
  }
]

Rules:
- Questions should be realistic and commonly asked at top tech companies
- Each question must have 3–6 expected key points that a strong answer should cover
- Questions must be appropriate for ${levelDesc} candidates
- IDs must be "q1", "q2", ... "q${count}"`;

  const text = await generateWithRetry(prompt);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON array");

  return JSON.parse(jsonMatch[0]) as IQuestion[];
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

export async function evaluateFromTranscript(
  role: string,
  level: "beginner" | "intermediate" | "senior",
  questions: { id: string; text: string; expectedKeyPoints?: string[] }[],
  transcript: TranscriptEntry[]
): Promise<IReport> {
  const levelDesc = {
    beginner: "entry-level (0–2 years experience)",
    intermediate: "mid-level (2–5 years experience)",
    senior: "senior-level (5+ years experience)",
  }[level];

  const questionsList = questions
    .map((q, i) => `${i + 1}. [${q.id}] ${q.text}${q.expectedKeyPoints?.length ? `\n   Key points: ${q.expectedKeyPoints.join(", ")}` : ""}`)
    .join("\n");

  const transcriptText = transcript
    .map((t) => `${t.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${t.text}`)
    .join("\n");

  const prompt = `You are an expert technical interviewer evaluating a ${levelDesc} ${role} candidate.

ORIGINAL QUESTIONS:
${questionsList}

FULL INTERVIEW TRANSCRIPT (includes follow-up questions and answers):
${transcriptText}

Evaluate the candidate based on the COMPLETE conversation above. For each original question, find all relevant candidate responses — including follow-up turns — and assess the overall quality.

Important notes:
- If the candidate needed follow-up prompting, factor that into the score (stronger candidates answer fully on the first try)
- If a question never appears in the transcript, give it a score of 0
- Judge correctness, depth, clarity, and structure

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "overallScore": <0-100>,
  "grade": "<A|B|C|D|F>",
  "correctness": <0-100>,
  "structure": <0-100>,
  "confidence": <0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "2-3 sentence overall assessment",
  "questionReports": [
    {
      "questionId": "q1",
      "questionText": "the question text",
      "answerText": "candidate's consolidated answer including all follow-up responses",
      "score": <0-10>,
      "feedback": "specific, constructive feedback",
      "keyPointsCovered": ["point covered"],
      "keyPointsMissed": ["point missed"]
    }
  ]
}

Grading: A=90-100, B=75-89, C=60-74, D=45-59, F=0-44
Be fair and rigorous. If the transcript has little or no candidate speech, scores should be very low.`;

  const text = await generateWithRetry(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON object");

  const report = JSON.parse(jsonMatch[0]);
  report.generatedAt = new Date();
  return report as IReport;
}

export async function evaluateInterviewAnswers(
  role: string,
  level: "beginner" | "intermediate" | "senior",
  answers: IAnswer[]
): Promise<IReport> {
  const levelDesc = {
    beginner: "entry-level (0–2 years experience)",
    intermediate: "mid-level (2–5 years experience)",
    senior: "senior-level (5+ years experience)",
  }[level];

  const answersText = answers
    .map((a, i) => `Q${i + 1}: ${a.questionText}\nAnswer: ${a.answerText || "(no answer provided)"}`)
    .join("\n\n");

  const prompt = `You are an expert technical interviewer evaluating a candidate for a ${levelDesc} ${role} position.

Here are all the questions and candidate answers:

${answersText}

Evaluate the entire interview and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "overallScore": <0-100>,
  "grade": "<A|B|C|D|F>",
  "correctness": <0-100>,
  "structure": <0-100>,
  "confidence": <0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "2-3 sentence overall assessment",
  "questionReports": [
    {
      "questionId": "q1",
      "questionText": "the question text",
      "answerText": "the answer text",
      "score": <0-10>,
      "feedback": "specific feedback for this answer",
      "keyPointsCovered": ["point covered"],
      "keyPointsMissed": ["point missed"]
    }
  ]
}

Grading: A=90-100, B=75-89, C=60-74, D=45-59, F=0-44
Be fair but rigorous. Missing or very short answers should score low.`;

  const text = await generateWithRetry(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON object");

  const report = JSON.parse(jsonMatch[0]);
  report.generatedAt = new Date();
  return report as IReport;
}
