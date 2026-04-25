import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CompanyBrain from "@/models/CompanyBrain";
import { scrapeCompanyContext } from "@/lib/companyBrainScraper";
import { generateWithRetry } from "@/lib/gemini";
import type { ICompanyQuestion } from "@/models/CompanyBrain";

export const maxDuration = 60;

// ─── Chunk filter: drop noise before sending to Gemini ────────────────────
function isUsefulChunk(chunk: string): boolean {
  if (chunk.length < 150) return false;
  return /\?|asked|question|round|interview|design|implement|explain|write|describe|what is|how would|tell me|experience|hiring|process/i.test(chunk);
}

// ─── Validate Gemini output ───────────────────────────────────────────────
const VALID_CATEGORIES = new Set(["DSA", "System Design", "OOPS", "Core CS", "Behavioral", "Domain"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const TARGET_COUNT = 50;

function validateQuestions(questions: ICompanyQuestion[]): string | null {
  if (!Array.isArray(questions)) return "Output is not an array";
  if (questions.length < 45 || questions.length > 55) return `Expected ~50 questions, got ${questions.length}`;

  for (const q of questions) {
    if (!q.text?.trim()) return "Question missing text";
    if (!VALID_CATEGORIES.has(q.category)) return `Invalid category: "${q.category}"`;
    if (!VALID_DIFFICULTIES.has(q.difficulty)) return `Invalid difficulty: "${q.difficulty}"`;
  }

  const uniqueTexts = new Set(questions.map((q) => q.text.toLowerCase().slice(0, 60)));
  if (uniqueTexts.size < questions.length * 0.9) return "Too many duplicate questions";

  return null;
}

// ─── Build the tiered prompt ──────────────────────────────────────────────
function buildPrompt(
  companyName: string,
  role: string,
  description: string,
  jd: string,
  scrapedChunks: string[],
  isRetry = false,
  retryReason = ""
): string {
  const tier1 = jd.trim()
    ? `## TIER 1 — Job Description (HIGHEST PRIORITY — most authoritative)\n${jd.trim()}`
    : `## TIER 1 — Job Description\n(Not provided — infer from company + role knowledge)`;

  const tier2 = description.trim()
    ? `## TIER 2 — Placement Announcement / Company Context\n${description.trim()}`
    : `## TIER 2 — Company Context\n(Not provided)`;

  const tier3 = scrapedChunks.length > 0
    ? `## TIER 3 — Scraped Interview Data (${scrapedChunks.length} snippets from Reddit, GitHub, AmbitionBox, GeeksForGeeks, Glassdoor, LeetCode, etc.)\n${scrapedChunks.join("\n\n---\n\n")}`
    : `## TIER 3 — Scraped Interview Data\n(No data found — use your training knowledge of ${companyName})`;

  const retryNote = isRetry
    ? `\n⚠️ RETRY: Previous attempt failed validation — ${retryReason}. Fix this issue and return exactly ${TARGET_COUNT} questions.\n`
    : "";

  return `You are an expert technical interview coach specialising in ${companyName}'s hiring process.${retryNote}

# CONTEXT (read in priority order)

${tier1}

${tier2}

${tier3}

---

# STEP 1 — Internalise the company (think before generating)

Before writing any questions, mentally note:
- What 3 topics does ${companyName} emphasise most for a ${role} role?
- What is the typical difficulty bar (easy/medium/hard ratio)?
- What patterns appear in TIER 3 data that are specific to ${companyName}?

Do NOT output this analysis — it is only to guide your generation.

---

# STEP 2 — Generate exactly ${TARGET_COUNT} questions

Distribution (must be exact):
- DSA: 15 (algorithms, data structures, complexity, patterns — name the specific problem)
- System Design: 8 (architecture, scalability — make at least 2 specific to ${companyName}'s domain)
- OOPS: 6 (OOP principles, design patterns, SOLID — with real-world context)
- Core CS: 7 (OS, DBMS, Computer Networks fundamentals)
- Behavioral: 8 (STAR-format prompts — tailor to ${companyName}'s culture)
- Domain: 6 (${role}-specific depth at ${companyName})

Rules:
- Weight TIER 1 (JD) most heavily; use TIER 3 to capture ${companyName}-specific style
- DSA: always name the specific problem type (e.g. "Implement LRU Cache using HashMap + DoublyLinkedList")
- System Design: be company-specific where possible (e.g. "Design ${companyName}'s real-time data pipeline")
- Behavioral: reference real work scenarios, not generic questions
- sourceHint: 1–5 word note on which source inspired this (e.g. "AmbitionBox interview post", "JD requirement", "Glassdoor SWE review", "GitHub prep repo")

Return ONLY a valid JSON array — no markdown fences, no extra text:
[
  {
    "id": "1",
    "text": "Full self-contained question text",
    "category": "DSA",
    "difficulty": "medium",
    "sourceHint": "AmbitionBox interview post"
  }
]

category must be exactly one of: DSA, System Design, OOPS, Core CS, Behavioral, Domain
difficulty must be exactly one of: easy, medium, hard
Total must be exactly ${TARGET_COUNT} questions.`;
}

// ─── Parse + validate with one retry ─────────────────────────────────────
async function generateAndValidate(
  prompt: string,
  companyName: string,
  role: string,
  description: string,
  jd: string,
  scrapedChunks: string[]
): Promise<ICompanyQuestion[]> {
  const parse = (text: string): ICompanyQuestion[] | null => {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  };

  // First attempt
  let text = await generateWithRetry(prompt);
  let questions = parse(text);

  if (questions) {
    const error = validateQuestions(questions);
    if (!error) return questions;

    // Retry with corrective prompt
    console.warn(`[generate] validation failed: ${error} — retrying`);
    const retryPrompt = buildPrompt(companyName, role, description, jd, scrapedChunks, true, error);
    text = await generateWithRetry(retryPrompt);
    questions = parse(text);
  }

  if (!questions) throw new Error("Gemini did not return a valid JSON array after retry");

  const error = validateQuestions(questions);
  if (error) {
    // Soft-fix: clip/pad to 50 if close enough, otherwise throw
    if (questions.length > 55 || questions.length < 40) throw new Error(`Validation failed after retry: ${error}`);
    questions = questions.slice(0, TARGET_COUNT);
  }

  return questions;
}

// ─── Streaming SSE handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const { companyName, role, description = "", jd = "" } = body;

  if (!companyName?.trim() || !role?.trim()) {
    return new Response(JSON.stringify({ error: "Company name and role are required" }), { status: 400 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
        catch { /* stream closed */ }
      };

      try {
        const TOTAL_SOURCES = 9;
        let completedSources = 0;

        send({ type: "start", message: `Researching ${companyName}…`, total: TOTAL_SOURCES });

        const ctx = await scrapeCompanyContext(companyName.trim(), role.trim(), (event) => {
          if (event.status === "running") {
            send({ type: "source_start", name: event.name });
          } else {
            completedSources++;
            const percent = Math.round((completedSources / TOTAL_SOURCES) * 70); // scraping = 0–70%
            send({
              type: "source_done",
              name: event.name,
              ok: event.status === "done",
              chunks: event.chunks ?? 0,
              percent,
              completed: completedSources,
              total: TOTAL_SOURCES,
            });
          }
        });

        // Filter noisy chunks before sending to Gemini
        const usefulChunks = ctx.chunks.filter(isUsefulChunk);
        const filteredCount = ctx.chunks.length - usefulChunks.length;
        if (filteredCount > 0) {
          console.log(`[generate] filtered ${filteredCount} noisy chunks, ${usefulChunks.length} remain`);
        }

        send({ type: "gemini_start", percent: 75, message: `Analysing ${usefulChunks.length} relevant snippets with Gemini AI…` });

        const prompt = buildPrompt(companyName.trim(), role.trim(), description, jd, usefulChunks);
        const questions = await generateAndValidate(prompt, companyName.trim(), role.trim(), description, jd, usefulChunks);

        send({ type: "saving", percent: 95, message: "Saving to your library…" });

        await connectDB();
        const card = await CompanyBrain.create({
          userId,
          companyName: companyName.trim(),
          role: role.trim(),
          description: description.trim(),
          questions,
          sources: ctx.sources,
          status: "ready",
        });

        send({
          type: "complete",
          percent: 100,
          cardId: card._id.toString(),
          questionCount: questions.length,
          sourceCount: ctx.sources.length,
          usefulChunks: usefulChunks.length,
          message: `Done! ${questions.length} questions from ${ctx.sources.length} sources.`,
        });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
