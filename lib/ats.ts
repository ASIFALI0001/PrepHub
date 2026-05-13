import { generateWithRetry } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongodb";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
import TopResume from "@/models/TopResume";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ATSSection {
  name: string;
  score: number;
  feedback: string;
}

export interface ATSFormattingCheck {
  check: string;
  passed: boolean;
  note: string;
}

export interface ATSReport {
  overallScore: number;
  summary: string;
  roleType: string;
  sections: ATSSection[];
  keywordsFound: string[];
  keywordsMissing: string[];
  formattingChecks: ATSFormattingCheck[];
  quickWins: string[];
}

export interface SimilarResume {
  score: number;
  roleType: string;
  skills: string[];
  contentPreview: string;
  fullContent: string;
}

// ─── ATS Analysis ─────────────────────────────────────────────────────────────

export async function analyzeATS(
  resumeText: string,
  jobDescription?: string
): Promise<ATSReport> {
  const jdContext = jobDescription?.trim()
    ? `\n\nJOB DESCRIPTION / ROLE / COMPANY:\n${jobDescription.slice(0, 3000)}`
    : "\n\nNo job description provided — perform a general ATS analysis.";

  const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze this resume and return a detailed ATS score report.

RESUME:
${resumeText.slice(0, 4000)}
${jdContext}

Return ONLY valid JSON, no markdown:
{
  "overallScore": <0-100 integer>,
  "summary": "<2-3 sentence overall assessment>",
  "roleType": "<detected primary role: one of Frontend Developer, Backend Developer, Full Stack Developer, AI/ML Engineer, Data Scientist, DevOps Engineer, Mobile Developer, Systems Engineer, Product Manager, General Software Engineer>",
  "sections": [
    { "name": "Contact Information", "score": <0-100>, "feedback": "<specific feedback>" },
    { "name": "Summary / Objective", "score": <0-100>, "feedback": "<specific feedback>" },
    { "name": "Skills", "score": <0-100>, "feedback": "<specific feedback>" },
    { "name": "Experience / Projects", "score": <0-100>, "feedback": "<specific feedback>" },
    { "name": "Education", "score": <0-100>, "feedback": "<specific feedback>" },
    { "name": "Formatting & Structure", "score": <0-100>, "feedback": "<specific feedback>" }
  ],
  "keywordsFound": ["keyword1", "keyword2"],
  "keywordsMissing": ["keyword1", "keyword2"],
  "formattingChecks": [
    { "check": "Single page", "passed": true, "note": "<brief note>" },
    { "check": "Clear section headings", "passed": true, "note": "<brief note>" },
    { "check": "Bullet points used", "passed": true, "note": "<brief note>" },
    { "check": "No tables or columns", "passed": true, "note": "<brief note>" },
    { "check": "Standard fonts only", "passed": true, "note": "<brief note>" },
    { "check": "Quantified achievements", "passed": true, "note": "<brief note>" },
    { "check": "Action verbs used", "passed": true, "note": "<brief note>" },
    { "check": "No special characters/graphics", "passed": true, "note": "<brief note>" }
  ],
  "quickWins": ["<specific actionable improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"]
}

Rules:
- Be specific and honest — don't inflate scores
- keywordsFound: important technical/role keywords present in resume (max 20)
- keywordsMissing: important keywords from JD or role that are absent (max 15). If no JD, suggest common keywords for the apparent role
- quickWins: specific, actionable — e.g. "Add 'Docker' to skills section" not "improve skills"`;

  const raw = await generateWithRetry(prompt);
  const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(json) as ATSReport;
}

// ─── PII Stripping ────────────────────────────────────────────────────────────

async function stripPII(text: string): Promise<string> {
  // Regex pass first — remove emails, phones, URLs, LinkedIn/GitHub
  let cleaned = text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
    .replace(/(\+?\d[\d\s\-().]{8,}\d)/g, "[PHONE]")
    .replace(/https?:\/\/[^\s]+/g, "[URL]")
    .replace(/linkedin\.com\/in\/[^\s,)]+/gi, "[LINKEDIN]")
    .replace(/github\.com\/[^\s,)]+/gi, "[GITHUB]");

  // Gemini pass — remove names and specific institutions
  const prompt = `Remove all personally identifiable information from this resume text. Replace:
- Person's full name → [NAME]
- College/university names → [UNIVERSITY]
- Specific company names where the person worked/interned → [COMPANY]
- City/location details → [LOCATION]

Keep: job titles, skills, technologies, project descriptions, certifications, metrics.
Return ONLY the cleaned text, nothing else.

TEXT:
${cleaned.slice(0, 3000)}`;

  try {
    return await generateWithRetry(prompt);
  } catch {
    return cleaned;
  }
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const result = await model.embedContent(text.slice(0, 2000));
  return result.embedding.values;
}

// ─── Store 90+ Resume ─────────────────────────────────────────────────────────

export async function storeTopResume(
  resumeText: string,
  score: number,
  roleType: string,
  skills: string[]
): Promise<void> {
  try {
    await connectDB();
    const anonymized = await stripPII(resumeText);
    const embedding = await generateEmbedding(anonymized);

    await TopResume.create({
      anonymizedContent: anonymized,
      embedding,
      score,
      roleType,
      skills,
    });
  } catch (err) {
    // Fire-and-forget — don't fail the main request
    console.error("[storeTopResume]", err);
  }
}

// ─── Vector Search — find top 3 similar resumes ───────────────────────────────

export async function findSimilarResumes(
  resumeText: string
): Promise<SimilarResume[]> {
  await connectDB();
  const queryEmbedding = await generateEmbedding(resumeText);

  // Atlas Vector Search with cosine similarity
  const results = await TopResume.aggregate([
    {
      $vectorSearch: {
        index: "top_resumes_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: 3,
      },
    },
    {
      $project: {
        score: 1,
        roleType: 1,
        skills: 1,
        anonymizedContent: 1,
        searchScore: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results.map((r) => ({
    score: r.score as number,
    roleType: r.roleType as string,
    skills: r.skills as string[],
    contentPreview: (r.anonymizedContent as string).slice(0, 300) + "…",
    fullContent: r.anonymizedContent as string,
  }));
}

// ─── LaTeX Resume Builder ─────────────────────────────────────────────────────

const LATEX_TEMPLATE = `%-------------------------
% ATS-Optimized Resume - Single Page Full Content
%------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage[sfdefault]{sourcesanspro}
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage[11pt]{moresize}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usetikzlibrary{svg.path}

\\definecolor{body}{HTML}{222222}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries\\color{body}
}{}{0em}{}[\\color{body}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{\\item\\small{\\color{body}{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
  \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{\\large\\color{body}#1} & \\textbf{\\small\\color{body}#2} \\\\
    \\textit{\\large\\color{body}#3} & \\textit{\\small\\color{body}#4} \\\\
  \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    {\\small\\color{body}\\textbf{#1}~\\ifx&#2&\\else\\href{#2}{\\faExternalLink*}\\fi}\\vspace{1pt}
}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[topsep=2pt, itemsep=0pt]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-3pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\Huge \\scshape CANDIDATE NAME} \\\\ \\vspace{1pt}
    City, State\\\\ \\vspace{1pt}
    \\small
    \\href{tel:+91XXXXXXXXXX}{\\raisebox{-0.1\\height}\\faPhone\\ \\underline{+91-XXXXXXXXXX}} ~
    \\href{mailto:email@example.com}{\\raisebox{-0.2\\height}\\faEnvelope\\ \\underline{email@example.com}} ~
    \\href{https://linkedin.com/in/handle}{\\raisebox{-0.2\\height}\\faLinkedinSquare\\ \\underline{linkedin.com/in/handle}} ~
    \\href{https://github.com/handle}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{github.com/handle}}
\\end{center}
\\vspace{0.5mm}

%-----------SUMMARY-----------
\\section{SUMMARY}
\\small{SUMMARY TEXT HERE}
\\vspace{2pt}

%-----------EDUCATION-----------
\\section{EDUCATION}
\\resumeSubHeadingListStart
  \\resumeSubheading
    {University Name}{Start -- End}
    {Degree | \\textbf{CGPA: X.XX / 10}}{City, State}
\\resumeSubHeadingListEnd

%-----------SKILLS-----------
\\section{SKILLS}
\\begin{itemize}[leftmargin=0.15in, label={}, topsep=0pt, itemsep=0pt]
  \\small{\\item{
    \\textbf{Languages:} ... \\\\
    \\textbf{Frontend \\& Backend:} ... \\\\
    \\textbf{AI / ML:} ... \\\\
    \\textbf{Databases \\& Tools:} ...
  }}
\\end{itemize}

%-----------PROJECTS-----------
\\section{PROJECT EXPERIENCE}
\\resumeSubHeadingListStart

\\resumeProjectHeading{Project Name}{https://github.com/link}
{\\textit{Tech | Stack | Here}}
\\resumeItemListStart
    \\resumeItem{Bullet point one with strong action verb and quantified result.}
    \\resumeItem{Bullet point two with strong action verb and quantified result.}
\\resumeItemListEnd

\\resumeSubHeadingListEnd

%-----------CERTIFICATIONS-----------
\\section{CERTIFICATIONS}
\\begin{itemize}[leftmargin=0.15in, topsep=2pt, itemsep=1pt]
  \\small{
  \\item \\textbf{Cert Name} | detail
  }
\\end{itemize}

\\end{document}`;

export async function buildLatexResume(
  resumeText: string,
  jobDescription?: string,
  editInstruction?: string,
  similarResumes?: SimilarResume[]
): Promise<string> {

  const jdSection = jobDescription?.trim()
    ? `TARGET ROLE / COMPANY / JD PROVIDED BY USER:
${jobDescription.slice(0, 2000)}
→ Tailor the resume content, skills ordering, and bullet point emphasis toward this role. Highlight the most relevant projects and skills for this specific position.`
    : `TARGET ROLE / COMPANY / JD: No data given by user.
→ Optimize for a general software engineering / tech role based on the candidate's background.`;

  const ragSection = similarResumes?.length
    ? `────────────────────────────────────────────────────
TOP ${similarResumes.length} SIMILAR HIGH-SCORING RESUMES FROM KNOWLEDGE BASE
(These are real resumes that scored 90+ on ATS. Use them ONLY as relevance references —
study HOW they write bullets, HOW they present skills, HOW they structure sections.
DO NOT copy any content. The candidate's OWN data must fill every field.)
────────────────────────────────────────────────────
${similarResumes.map((r, i) =>
  `REFERENCE ${i + 1} — ATS Score: ${r.score}/100 | Role: ${r.roleType}
What to learn from this: bullet writing style, keyword density, section ordering, achievement quantification.
---
${r.fullContent.slice(0, 1000)}
---`
).join("\n\n")}
────────────────────────────────────────────────────`
    : `TOP SIMILAR RESUMES FROM KNOWLEDGE BASE: None available yet. Generate based on candidate data and best practices.`;

  const editSection = editInstruction?.trim()
    ? `USER REQUESTED CHANGE: ${editInstruction}
→ Apply this change to the resume while keeping all other rules intact.`
    : "";

  const prompt = `You are a world-class resume writer and LaTeX expert. Your job is to generate a perfectly formatted, ATS-optimized, single-page LaTeX resume for the candidate below.

════════════════════════════════════════════════════
CANDIDATE'S FULL RESUME DATA (source of truth — use ALL of this):
════════════════════════════════════════════════════
${resumeText.slice(0, 4000)}

════════════════════════════════════════════════════
${jdSection}
════════════════════════════════════════════════════

${ragSection}

${editSection}

════════════════════════════════════════════════════
LATEX TEMPLATE — YOU MUST FOLLOW THIS STRUCTURE EXACTLY:
════════════════════════════════════════════════════
${LATEX_TEMPLATE}

════════════════════════════════════════════════════
NON-NEGOTIABLE RULES (breaking any = failure):
════════════════════════════════════════════════════

[1] ██ SINGLE PAGE — ABSOLUTE MAXIMUM ██
    The compiled PDF must fit on exactly ONE page. Not one page and a line. ONE page.
    To achieve this:
    - Limit each project to 2-3 tight bullet points maximum
    - Keep each bullet under 2 lines when compiled
    - Keep SUMMARY to 2 sentences max
    - Keep SKILLS section dense and compact (no line wasting)
    - If content overflows: cut the least impactful project first, never cut certifications or education

[2] USE EVERY PIECE OF CANDIDATE DATA
    Extract and include ALL of the following from the candidate's resume:
    - Real name, phone, email, LinkedIn URL, GitHub URL (exact values, no placeholders)
    - Every project they listed (include all, compress bullets if needed to stay on one page)
    - Every skill, language, framework, tool they mentioned
    - Education with exact CGPA, university name, degree, dates, location
    - Every certification with grade/score if mentioned
    - Summary — rewrite for the target role but based on their actual background

[3] FOLLOW THE TEMPLATE STRUCTURE EXACTLY
    - Use \\resumeProjectHeading, \\resumeSubheading, \\resumeItem etc — these exact macros only
    - Section order: HEADING → SUMMARY → EDUCATION → SKILLS → PROJECT EXPERIENCE → CERTIFICATIONS
    - Do NOT add extra sections, do NOT reorder sections
    - Do NOT use tabular, minipage, or any layout not in the template
    - Keep all package imports exactly as in the template

[4] QUALITY OF BULLETS
    - Every bullet MUST start with a past-tense action verb (Built, Engineered, Designed, Architected, Developed, Optimized, Reduced, Led, Increased, Deployed, Integrated, Automated)
    - Every bullet MUST have a quantified result where possible (%, ms, users, requests/sec, reduction in time/cost)
    - If no metric exists in original resume, keep the bullet factual and strong — do not fabricate numbers

[5] KEYWORD ALIGNMENT
    - If a JD was provided: naturally weave the JD's key terms into bullets and skills — do NOT keyword-stuff
    - If no JD: use standard industry keywords relevant to the candidate's stack

[6] OUTPUT FORMAT
    - Return ONLY the complete, compilable LaTeX code
    - No markdown fences (\`\`\`latex or \`\`\`)
    - No explanations, no comments outside the LaTeX
    - The output must compile in Overleaf without errors`;

  return await generateWithRetry(prompt);
}
