import { generateWithRetry } from "@/lib/gemini";
import type { ICareerPath, IRoadmap } from "@/models/CareerGuide";

// ─── GitHub Data Fetcher ──────────────────────────────────────────────────────

export interface GitHubData {
  username: string;
  bio: string;
  publicRepos: number;
  followers: number;
  topLanguages: { language: string; count: number }[];
  recentProjects: { name: string; description: string; language: string; topics: string[]; stars: number }[];
  totalStars: number;
}

export async function fetchGitHubData(usernameOrUrl: string): Promise<GitHubData | null> {
  try {
    // Extract username from URL if provided
    const username = usernameOrUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/$/, "")
      .trim();

    const headers: Record<string, string> = { "User-Agent": "PrepHub-CareerGuide/1.0" };
    if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    ]);

    if (!profileRes.ok) return null;

    const profile = await profileRes.json();
    const repos: Record<string, unknown>[] = reposRes.ok ? await reposRes.json() : [];

    // Aggregate languages
    const langCount: Record<string, number> = {};
    let totalStars = 0;

    const recentProjects = repos
      .filter((r) => !r.fork)
      .slice(0, 15)
      .map((r) => {
        const lang = (r.language as string) ?? "Unknown";
        if (lang !== "Unknown") langCount[lang] = (langCount[lang] ?? 0) + 1;
        totalStars += (r.stargazers_count as number) ?? 0;
        return {
          name: r.name as string,
          description: (r.description as string) ?? "",
          language: lang,
          topics: (r.topics as string[]) ?? [],
          stars: (r.stargazers_count as number) ?? 0,
        };
      });

    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([language, count]) => ({ language, count }));

    return {
      username,
      bio: (profile.bio as string) ?? "",
      publicRepos: (profile.public_repos as number) ?? 0,
      followers: (profile.followers as number) ?? 0,
      topLanguages,
      recentProjects,
      totalStars,
    };
  } catch {
    return null;
  }
}

// ─── Career Options Analysis ──────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "priority",
    text: "What matters most to you right now?",
    options: [
      "High salary ASAP",
      "Deep technical expertise",
      "Leadership & business impact",
      "Research & innovation",
    ],
  },
  {
    id: "fiveYears",
    text: "Where do you see yourself in 5 years?",
    options: [
      "Senior SWE at a product company",
      "Engineering Manager / Tech Lead",
      "Data Scientist / ML Engineer",
      "Researcher or in academia",
    ],
  },
  {
    id: "moreStudy",
    text: "How do you feel about studying 2+ more years before working full-time?",
    options: [
      "Totally fine if ROI is clear",
      "Only if stipend or scholarship covered",
      "Prefer to work first, study later",
      "Want to start working ASAP",
    ],
  },
  {
    id: "techInterest",
    text: "Which area excites you most technically?",
    options: [
      "Large-scale systems & backend",
      "Machine Learning & AI",
      "Data analysis & insights",
      "Security / low-level systems",
    ],
  },
  {
    id: "abroad",
    text: "How important is working or studying abroad to you?",
    options: [
      "Top priority — want to go abroad",
      "Open to it but not a must",
      "Prefer to stay in India",
      "No strong preference",
    ],
  },
  {
    id: "academics",
    text: "How would you describe your academic performance?",
    options: [
      "Top performer (8.5+ CGPA)",
      "Above average (7.5–8.5 CGPA)",
      "Average (6.5–7.5 CGPA)",
      "Below average (below 6.5 CGPA)",
    ],
  },
  {
    id: "problemType",
    text: "What kind of problems do you enjoy solving?",
    options: [
      "Algorithmic / competitive programming",
      "Real-world product problems",
      "Research & open-ended problems",
      "Business & strategy problems",
    ],
  },
  {
    id: "finance",
    text: "What is your financial situation regarding further education?",
    options: [
      "Can self-fund or family support",
      "Need scholarship or stipend",
      "Prefer to earn first then study",
      "Not willing to spend more on education",
    ],
  },
];

export function getCareerQuestions() {
  return QUESTIONS;
}

function buildProfileSummary(
  resumeText: string,
  githubData: GitHubData | null,
  platformData: Record<string, unknown>,
  mcqAnswers: { question: string; answer: string }[]
): string {
  const ghSummary = githubData
    ? `GitHub (@${githubData.username}): ${githubData.publicRepos} public repos, ${githubData.followers} followers, top languages: ${githubData.topLanguages.map((l) => l.language).join(", ")}. Recent projects: ${githubData.recentProjects.slice(0, 5).map((p) => `${p.name} (${p.language}${p.topics.length ? ", " + p.topics.join("/") : ""})`).join("; ")}.`
    : "GitHub: not provided.";

  const answers = mcqAnswers.map((a) => `  - ${a.question}: ${a.answer}`).join("\n");

  return `
RESUME TEXT:
${resumeText.slice(0, 3000)}

${ghSummary}

PLATFORM PERFORMANCE:
${JSON.stringify(platformData, null, 2)}

USER PREFERENCES (MCQ answers):
${answers}
`.trim();
}

export async function analyzeCareerOptions(
  resumeText: string,
  githubData: GitHubData | null,
  platformData: Record<string, unknown>,
  mcqAnswers: { question: string; answer: string }[]
): Promise<ICareerPath[]> {
  const profile = buildProfileSummary(resumeText, githubData, platformData, mcqAnswers);

  const prompt = `You are an expert career counselor for Indian CS/engineering students. Analyze the following student profile and recommend the best career paths.

${profile}

Based on this data, return EXACTLY a JSON array of 4 career path objects. Choose from: "MS Abroad", "M.Tech (IIT/NIT)", "Direct SWE Job", "MBA (IIM/ISB)", "Data Science / ML", "PhD", "Product Management". Only include paths that genuinely fit — be honest about poor fits with low scores.

Return ONLY valid JSON, no markdown, no explanation:
[
  {
    "path": "MS Abroad",
    "score": 85,
    "reasoning": "2-3 sentence explanation referencing specific data points from their profile",
    "specialization": "Machine Learning",
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"]
  }
]

Rules:
- Scores must reflect genuine fit (don't inflate all to 80+)
- Reference actual data from resume/GitHub/platform in reasoning
- specialization should be specific (e.g. "ML/AI", "Systems", "Cybersecurity", "Business Analytics")
- Sort by score descending`;

  const raw = await generateWithRetry(prompt);
  const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(json) as ICareerPath[];
}

// ─── Roadmap Generator ────────────────────────────────────────────────────────

export async function generateCareerRoadmap(
  chosenPath: string,
  resumeText: string,
  githubData: GitHubData | null,
  platformData: Record<string, unknown>,
  mcqAnswers: { question: string; answer: string }[]
): Promise<IRoadmap> {
  const profile = buildProfileSummary(resumeText, githubData, platformData, mcqAnswers);

  const needsColleges = ["MS Abroad", "M.Tech (IIT/NIT)", "MBA (IIM/ISB)", "PhD"].includes(chosenPath);

  const prompt = `You are a career counselor creating a detailed roadmap for an Indian CS engineering student who has chosen: "${chosenPath}".

Student profile:
${profile}

Generate a comprehensive roadmap. Return ONLY valid JSON, no markdown:
{
  "chosenPath": "${chosenPath}",
  "specialization": "specific domain e.g. Machine Learning",
  "phases": [
    {
      "label": "0–3 Months",
      "title": "Phase title",
      "goals": ["goal 1", "goal 2"],
      "actions": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
      "exams": ["GATE CSE — target 650+"]
    },
    {
      "label": "3–6 Months",
      "title": "Phase title",
      "goals": ["goal 1", "goal 2"],
      "actions": ["action 1", "action 2", "action 3"],
      "exams": []
    },
    {
      "label": "6–12 Months",
      "title": "Phase title",
      "goals": ["goal 1", "goal 2"],
      "actions": ["action 1", "action 2", "action 3"],
      "exams": []
    },
    {
      "label": "12–24 Months",
      "title": "Phase title",
      "goals": ["goal 1", "goal 2"],
      "actions": ["action 1", "action 2", "action 3"],
      "exams": []
    }
  ],
  ${needsColleges ? `"collegeTargets": {
    "reach": ["College 1", "College 2", "College 3"],
    "match": ["College 1", "College 2", "College 3"],
    "safe": ["College 1", "College 2"]
  },` : '"collegeTargets": null,'}
  "keySkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5", "skill 6"]
}

Rules:
- Actions must be specific and actionable (e.g. "Solve 150 LeetCode problems focusing on graphs and DP" not "practice coding")
- Exams only in relevant phases — include target scores
- College targets should be realistic for Indian students (for MS: US/Canada/Europe universities; for M.Tech: IITs/NITs/IIITs; for MBA: IIMs/ISB/XLRI)
- keySkills should be the 6 most important skills to build for this path
- Reference the student's current strengths/gaps from their profile`;

  const raw = await generateWithRetry(prompt);
  const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const roadmap = JSON.parse(json) as IRoadmap;
  roadmap.generatedAt = new Date();
  return roadmap;
}
