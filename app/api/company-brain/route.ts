import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import CompanyBrain from "@/models/CompanyBrain";
import { scrapeCompanyContext } from "@/lib/companyBrainScraper";
import { generateWithRetry } from "@/lib/gemini";
import type { ICompanyQuestion } from "@/models/CompanyBrain";

export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const cards = await CompanyBrain.find({ userId: session.user.id })
      .select("-questions")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[GET /api/company-brain]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { companyName, role, description = "", jd = "" } = body;

    if (!companyName?.trim() || !role?.trim()) {
      return NextResponse.json({ error: "Company name and role are required" }, { status: 400 });
    }

    // Scrape all free sources in parallel
    const ctx = await scrapeCompanyContext(companyName.trim(), role.trim());

    const scrapedBlock = ctx.chunks.length > 0
      ? `=== SCRAPED INTERVIEW DATA (${ctx.chunks.length} sources) ===\n${ctx.chunks.join("\n\n---\n\n")}`
      : "";

    const userBlock = [
      description.trim() && `=== PLACEMENT ANNOUNCEMENT / CONTEXT ===\n${description.trim()}`,
      jd.trim() && `=== JOB DESCRIPTION ===\n${jd.trim()}`,
    ].filter(Boolean).join("\n\n");

    const contextBlock = [scrapedBlock, userBlock].filter(Boolean).join("\n\n");

    const prompt = `You are an expert technical interview coach with deep knowledge of ${companyName}'s hiring process.

Your task: Generate exactly 50 interview questions that ${companyName} is likely to ask a ${role} candidate.

Use this research data to make questions as company-specific and accurate as possible:

${contextBlock || `[No external data found — use your knowledge of ${companyName}'s known interview style and typical ${role} interview questions]`}

Generate exactly 50 questions distributed across these categories:
- DSA: 15 questions (algorithms, data structures, complexity, problem solving patterns)
- System Design: 8 questions (architecture, scalability, trade-offs, distributed systems)
- OOPS: 6 questions (OOP principles, design patterns, SOLID, real-world application)
- Core CS: 7 questions (OS, DBMS, Computer Networks, fundamentals)
- Behavioral: 8 questions (STAR method, leadership, conflict, teamwork, past experience)
- Domain: 6 questions (role-specific technical depth for ${role} at ${companyName})

Return ONLY a valid JSON array (no markdown fences, no extra text, just the raw array):
[
  {
    "id": "1",
    "text": "Full question text here",
    "category": "DSA",
    "difficulty": "medium"
  }
]

Critical rules:
- Questions must reflect ${companyName}'s known interview patterns from the scraped data above
- DSA: name the actual pattern/problem (e.g. "Implement an LRU Cache using HashMap and DoublyLinkedList")
- System Design: be specific (e.g. "Design ${companyName}'s notification delivery system")
- Behavioral: use proper prompts (e.g. "Tell me about a time you had to debug a production issue under pressure")
- difficulty must be exactly "easy", "medium", or "hard"
- category must be exactly one of: DSA, System Design, OOPS, Core CS, Behavioral, Domain
- Total must be exactly 50 questions`;

    const text = await generateWithRetry(prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Gemini did not return a valid JSON array");

    const questions: ICompanyQuestion[] = JSON.parse(jsonMatch[0]);

    await connectDB();
    const card = await CompanyBrain.create({
      userId: session.user.id,
      companyName: companyName.trim(),
      role: role.trim(),
      description: description.trim(),
      questions,
      sources: ctx.sources,
      status: "ready",
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/company-brain]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
