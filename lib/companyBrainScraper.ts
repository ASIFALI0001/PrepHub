// lib/companyBrainScraper.ts

export interface ScrapedContext {
  chunks: string[];
  sources: string[];
  meta: {
    sourceStats: Record<string, { ok: boolean; chunks: number; sources: number; ms: number; error?: string }>;
    cacheHit: boolean;
    totalMs: number;
  };
}

export interface ProgressEvent {
  name: string;
  status: "running" | "done" | "failed";
  chunks?: number;
}

// ─── Config ────────────────────────────────────────────────────────────────
const JINA_API_KEY = process.env.JINA_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const PER_SOURCE_TIMEOUT = 10000;
const PER_FETCH_TIMEOUT = 7000;
const MAX_CHUNKS_PER_SOURCE = 6;
const MAX_TOTAL_CHUNKS = 45;
const MAX_TOTAL_SOURCES = 18;

// ─── In-memory cache ───────────────────────────────────────────────────────
type CacheEntry = { value: ScrapedContext; expiresAt: number };
const memoryCache = new Map<string, CacheEntry>();

function cacheKey(company: string, role: string) {
  return `${company.toLowerCase().trim()}::${role.toLowerCase().trim()}`;
}
function getCached(company: string, role: string): ScrapedContext | null {
  const entry = memoryCache.get(cacheKey(company, role));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memoryCache.delete(cacheKey(company, role)); return null; }
  return entry.value;
}
function setCached(company: string, role: string, value: ScrapedContext) {
  memoryCache.set(cacheKey(company, role), { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (memoryCache.size > 200) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

// ─── Logging ───────────────────────────────────────────────────────────────
function log(source: string, msg: string, extra?: unknown) {
  console.log(`[scraper:${source}] ${msg}`, extra ?? "");
}
function warn(source: string, msg: string, err?: unknown) {
  const m = err instanceof Error ? err.message : String(err ?? "");
  console.warn(`[scraper:${source}] ${msg}${m ? ` — ${m}` : ""}`);
}

// ─── Slug helpers ──────────────────────────────────────────────────────────
function basicSlug(s: string): string {
  return s.toLowerCase().trim().replace(/&/g, "and").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function compactSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

const SLUG_OVERRIDES: Record<string, { ambitionbox?: string; gfg?: string; levels?: string; greenhouse?: string; lever?: string }> = {
  "tata consultancy services": { ambitionbox: "tcs", gfg: "tcs" },
  "tcs": { ambitionbox: "tcs", gfg: "tcs" },
  "jpmorgan chase": { ambitionbox: "jpmorgan-chase", gfg: "jp-morgan", greenhouse: "jpmorgan" },
  "goldman sachs": { ambitionbox: "goldman-sachs", gfg: "goldman-sachs", greenhouse: "goldmansachs" },
  "meta": { ambitionbox: "meta", gfg: "facebook", levels: "meta" },
  "facebook": { ambitionbox: "facebook", gfg: "facebook", levels: "meta" },
  "alphabet": { ambitionbox: "google", gfg: "google", levels: "google" },
  "x corp": { ambitionbox: "twitter", gfg: "twitter" },
  "twitter": { ambitionbox: "twitter", gfg: "twitter" },
};

function pickSlug(company: string, key: keyof (typeof SLUG_OVERRIDES)[string]): string {
  const k = company.toLowerCase().trim();
  return SLUG_OVERRIDES[k]?.[key] ?? basicSlug(company);
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = PER_FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithRetry(url: string, options: RequestInit = {}, retries = 1): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("fetch failed");
}

// ─── Jina ──────────────────────────────────────────────────────────────────
async function jinaGet(url: string, maxChars = 2500): Promise<string> {
  try {
    const headers: Record<string, string> = { Accept: "text/plain", "X-Return-Format": "markdown" };
    if (JINA_API_KEY) headers.Authorization = `Bearer ${JINA_API_KEY}`;
    const res = await fetchWithTimeout(`https://r.jina.ai/${url}`, { headers }, 12000);
    if (!res.ok) { warn("jina", `status ${res.status} for ${url}`); return ""; }
    return (await res.text()).slice(0, maxChars);
  } catch (e) { warn("jina", `failed for ${url}`, e); return ""; }
}

// ─── Result helpers ────────────────────────────────────────────────────────
type SrcResult = { chunks: string[]; sources: string[] };
const empty: SrcResult = { chunks: [], sources: [] };

function trimResult(r: SrcResult, maxChunks = MAX_CHUNKS_PER_SOURCE): SrcResult {
  return { chunks: r.chunks.slice(0, maxChunks), sources: Array.from(new Set(r.sources)).slice(0, 5) };
}

// ─── SOURCE 1: Reddit ─────────────────────────────────────────────────────
async function fetchReddit(company: string, role: string): Promise<SrcResult> {
  const queries = [
    `${company} ${role} interview experience`,
    `${company} interview questions`,
    `${company} placement experience`,
  ];
  const subreddits = ["cscareerquestions", "leetcode", "developersIndia", "csMajors"];
  const chunks: string[] = [];
  const sources: string[] = [];
  const tasks: Promise<void>[] = [];

  for (const q of queries) {
    const directUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=6&t=year`;
    tasks.push((async () => {
      try {
        const res = await fetchWithTimeout(directUrl, { headers: { "User-Agent": "PrepHub/1.0 interview-prep-app" } });
        if (!res.ok) {
          const md = await jinaGet(`https://www.reddit.com/search/?q=${encodeURIComponent(q)}`, 2000);
          if (md) { chunks.push(`[Reddit: ${q}]\n${md}`); sources.push(`https://www.reddit.com/search/?q=${encodeURIComponent(q)}`); }
          return;
        }
        const data = await res.json();
        for (const child of data?.data?.children ?? []) {
          const post = child?.data;
          if (!post?.title) continue;
          chunks.push(`Title: ${post.title}\n${(post.selftext ?? "").slice(0, 500)}`);
          if (post.permalink) sources.push(`https://reddit.com${post.permalink}`);
        }
      } catch (e) { warn("reddit", `query "${q}" failed`, e); }
    })());
  }

  for (const sub of subreddits) {
    tasks.push((async () => {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(company + " interview")}&sort=relevance&limit=4&restrict_sr=1`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": "PrepHub/1.0" } });
        if (!res.ok) return;
        const data = await res.json();
        for (const child of data?.data?.children ?? []) {
          const post = child?.data;
          if (!post?.title) continue;
          chunks.push(`[r/${sub}] ${post.title}\n${(post.selftext ?? "").slice(0, 400)}`);
          if (post.permalink) sources.push(`https://reddit.com${post.permalink}`);
        }
      } catch (e) { warn("reddit", `r/${sub} failed`, e); }
    })());
  }

  await Promise.allSettled(tasks);
  log("reddit", `${chunks.length} chunks`);
  return trimResult({ chunks, sources });
}

// ─── SOURCE 2: GitHub ─────────────────────────────────────────────────────
async function fetchGitHub(company: string, role: string): Promise<SrcResult> {
  const chunks: string[] = [];
  const sources: string[] = [];
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    for (const q of [`${company} interview questions ${role}`, `${company} interview prep`]) {
      try {
        const data = await fetchJsonWithRetry(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=4`,
          { headers }, 1
        ) as { items?: Array<{ full_name: string; html_url: string; stargazers_count: number }> };

        for (const repo of (data?.items ?? []).slice(0, 3)) {
          try {
            const rr = await fetchWithTimeout(
              `https://api.github.com/repos/${repo.full_name}/readme`,
              { headers: { ...headers, Accept: "application/vnd.github.raw+json" } }, 5000
            );
            if (!rr.ok) continue;
            const raw = await rr.text();
            const clean = raw.replace(/```[\s\S]*?```/g, "").replace(/[<>[\]#*`]/g, " ").replace(/\s{2,}/g, " ").slice(0, 1800);
            chunks.push(`[GitHub: ${repo.full_name} ⭐${repo.stargazers_count}]\n${clean}`);
            sources.push(repo.html_url);
          } catch (e) { warn("github", `readme ${repo.full_name}`, e); }
        }
      } catch (e) { warn("github", `search "${q}"`, e); }
    }
  } catch (e) { warn("github", "unavailable", e); }

  log("github", `${chunks.length} chunks`);
  return trimResult({ chunks, sources });
}

// ─── SOURCE 3: AmbitionBox ────────────────────────────────────────────────
async function fetchAmbitionBox(company: string, role: string): Promise<SrcResult> {
  const slug = pickSlug(company, "ambitionbox");
  const urls = [
    `https://www.ambitionbox.com/interviews/${slug}-interview-questions?designation=${encodeURIComponent(role)}`,
    `https://www.ambitionbox.com/interviews/${slug}-interview-questions`,
  ];
  for (const url of urls) {
    const text = await jinaGet(url, 2500);
    if (text && text.length > 200 && !/page not found|404/i.test(text.slice(0, 500))) {
      log("ambitionbox", `hit ${url}`);
      return { chunks: [`[AmbitionBox: ${company}]\n${text}`], sources: [url] };
    }
  }
  warn("ambitionbox", `no page for "${company}"`);
  return empty;
}

// ─── SOURCE 4: GeeksForGeeks ──────────────────────────────────────────────
async function fetchGeeksForGeeks(company: string): Promise<SrcResult> {
  const slug = pickSlug(company, "gfg");
  const urls = [
    `https://www.geeksforgeeks.org/${slug}-interview-questions/`,
    `https://www.geeksforgeeks.org/tag/${slug}/`,
    `https://practice.geeksforgeeks.org/company/${slug}/`,
  ];
  for (const url of urls) {
    const text = await jinaGet(url, 2500);
    if (text && text.length > 200 && !/page not found|404/i.test(text.slice(0, 500))) {
      log("gfg", `hit ${url}`);
      return { chunks: [`[GeeksForGeeks: ${company}]\n${text}`], sources: [url] };
    }
  }
  warn("gfg", `no page for "${company}"`);
  return empty;
}

// ─── SOURCE 5: LeetCode Discuss ───────────────────────────────────────────
async function fetchLeetCodeDiscuss(company: string): Promise<SrcResult> {
  const url = `https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=${encodeURIComponent(company)}`;
  const text = await jinaGet(url, 2000);
  if (!text || text.length < 150) { warn("leetcode", `no content for "${company}"`); return empty; }
  log("leetcode", "ok");
  return { chunks: [`[LeetCode Discuss: ${company}]\n${text}`], sources: [url] };
}

// ─── SOURCE 6: InterviewBit ───────────────────────────────────────────────
async function fetchInterviewBit(company: string, role: string): Promise<SrcResult> {
  const slug = basicSlug(company);
  const urls = [
    `https://www.interviewbit.com/${slug}-interview-questions/`,
    `https://www.interviewbit.com/interview-questions/${slug}/`,
  ];
  for (const url of urls) {
    const text = await jinaGet(url, 2000);
    if (text && text.length > 150 && !/page not found|404/i.test(text.slice(0, 500))) {
      log("interviewbit", `hit ${url}`);
      return { chunks: [`[InterviewBit: ${company} ${role}]\n${text}`], sources: [url] };
    }
  }
  warn("interviewbit", `no page for "${company}"`);
  return empty;
}

// ─── SOURCE 7: Glassdoor via Google snippets ──────────────────────────────
async function fetchGlassdoor(company: string, role: string): Promise<SrcResult> {
  const q = `${company} ${role} interview questions site:glassdoor.com`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const text = await jinaGet(url, 2000);
  if (!text || text.length < 200) { warn("glassdoor", `no snippets for "${company}"`); return empty; }
  log("glassdoor", "ok via google");
  return { chunks: [`[Glassdoor (via Google): ${company}]\n${text}`], sources: [url] };
}

// ─── SOURCE 8: Levels.fyi ─────────────────────────────────────────────────
async function fetchLevelsFyi(company: string): Promise<SrcResult> {
  const slug = pickSlug(company, "levels") ?? basicSlug(company);
  const urls = [
    `https://www.levels.fyi/companies/${slug}/interviews`,
    `https://www.levels.fyi/companies/${slug}/salaries/software-engineer`,
  ];
  for (const url of urls) {
    const text = await jinaGet(url, 1800);
    if (text && text.length > 150 && !/page not found|404/i.test(text.slice(0, 500))) {
      log("levels", `hit ${url}`);
      return { chunks: [`[Levels.fyi: ${company}]\n${text}`], sources: [url] };
    }
  }
  warn("levels", `no page for "${company}"`);
  return empty;
}

// ─── SOURCE 9: Greenhouse / Lever JDs ────────────────────────────────────
async function fetchJobDescription(company: string, role: string): Promise<SrcResult> {
  const ghSlug = SLUG_OVERRIDES[company.toLowerCase()]?.greenhouse ?? compactSlug(company);
  const leverSlug = SLUG_OVERRIDES[company.toLowerCase()]?.lever ?? compactSlug(company);

  const candidates: { url: string; parser: (d: unknown) => string }[] = [
    {
      url: `https://boards-api.greenhouse.io/v1/boards/${ghSlug}/jobs?content=true`,
      parser: (d) => {
        const jobs = (d as { jobs?: Array<{ title?: string; content?: string }> })?.jobs ?? [];
        const matching = jobs.filter((j) => j.title?.toLowerCase().includes(role.toLowerCase())).slice(0, 3);
        return (matching.length ? matching : jobs.slice(0, 3))
          .map((j) => `${j.title ?? ""}: ${(j.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 500)}`)
          .join("\n\n");
      },
    },
    {
      url: `https://api.lever.co/v0/postings/${leverSlug}?mode=json`,
      parser: (d) => {
        const arr = Array.isArray(d) ? (d as Array<{ text?: string; description?: string }>) : [];
        const matching = arr.filter((j) => (j.text ?? "").toLowerCase().includes(role.toLowerCase())).slice(0, 3);
        return (matching.length ? matching : arr.slice(0, 3))
          .map((j) => `${j.text ?? ""}: ${(j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 500)}`)
          .join("\n\n");
      },
    },
  ];

  for (const { url, parser } of candidates) {
    try {
      const data = await fetchJsonWithRetry(url, {}, 0);
      const text = parser(data);
      if (text.length > 80) { log("jd", `hit ${url}`); return { chunks: [`[Job Descriptions: ${company}]\n${text}`], sources: [url] }; }
    } catch (e) { warn("jd", `${url}`, e); }
  }
  return empty;
}

// ─── Per-source runner with timeout ──────────────────────────────────────
async function runSource(
  name: string,
  fn: () => Promise<SrcResult>
): Promise<{ name: string; result: SrcResult; ms: number; ok: boolean; error?: string }> {
  const start = Date.now();
  try {
    const result = await Promise.race<SrcResult>([
      fn(),
      new Promise<SrcResult>((_, rej) => setTimeout(() => rej(new Error(`timeout ${PER_SOURCE_TIMEOUT}ms`)), PER_SOURCE_TIMEOUT)),
    ]);
    return { name, result, ms: Date.now() - start, ok: result.chunks.length > 0 };
  } catch (e) {
    return { name, result: empty, ms: Date.now() - start, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Round-robin interleave ────────────────────────────────────────────────
function interleave(buckets: string[][], maxTotal: number): string[] {
  const out: string[] = [];
  let idx = 0, added = true;
  while (added && out.length < maxTotal) {
    added = false;
    for (const bucket of buckets) {
      if (idx < bucket.length && out.length < maxTotal) { out.push(bucket[idx]); added = true; }
    }
    idx++;
  }
  return out;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export async function scrapeCompanyContext(
  company: string,
  role: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<ScrapedContext> {
  const totalStart = Date.now();

  const cached = getCached(company, role);
  if (cached) {
    log("cache", `HIT for ${company}/${role}`);
    return { ...cached, meta: { ...cached.meta, cacheHit: true } };
  }

  const sources: Array<[string, () => Promise<SrcResult>]> = [
    ["Reddit", () => fetchReddit(company, role)],
    ["GitHub", () => fetchGitHub(company, role)],
    ["AmbitionBox", () => fetchAmbitionBox(company, role)],
    ["GeeksForGeeks", () => fetchGeeksForGeeks(company)],
    ["LeetCode", () => fetchLeetCodeDiscuss(company)],
    ["InterviewBit", () => fetchInterviewBit(company, role)],
    ["Glassdoor", () => fetchGlassdoor(company, role)],
    ["Levels.fyi", () => fetchLevelsFyi(company)],
    ["Job Postings", () => fetchJobDescription(company, role)],
  ];

  const results = await Promise.all(
    sources.map(async ([name, fn]) => {
      onProgress?.({ name, status: "running" });
      const r = await runSource(name, fn);
      onProgress?.({ name, status: r.ok ? "done" : "failed", chunks: r.result.chunks.length });
      return r;
    })
  );

  const sourceStats: Record<string, { ok: boolean; chunks: number; sources: number; ms: number; error?: string }> = {};
  const buckets: string[][] = [];
  const allSources: string[] = [];

  for (const r of results) {
    sourceStats[r.name] = { ok: r.ok, chunks: r.result.chunks.length, sources: r.result.sources.length, ms: r.ms, error: r.error };
    if (r.result.chunks.length) buckets.push(r.result.chunks);
    allSources.push(...r.result.sources);
  }

  const chunks = interleave(buckets, MAX_TOTAL_CHUNKS);
  const sourcesDeduped = Array.from(new Set(allSources)).slice(0, MAX_TOTAL_SOURCES);
  const totalMs = Date.now() - totalStart;

  log("done", `${chunks.length} chunks / ${sourcesDeduped.length} sources in ${totalMs}ms`);

  const value: ScrapedContext = { chunks, sources: sourcesDeduped, meta: { sourceStats, cacheHit: false, totalMs } };
  if (chunks.length >= 3) setCached(company, role, value);
  return value;
}
