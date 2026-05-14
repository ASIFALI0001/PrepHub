// lib/companyBrainScraper.ts
// Dual-engine scraper: TinyFish (search + fetch) + Jina (reader + fallback)

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
const JINA_API_KEY      = process.env.JINA_API_KEY;
const GITHUB_TOKEN      = process.env.GITHUB_TOKEN;
const TINYFISH_API_KEY  = process.env.TINYFISH_API_KEY;

const CACHE_TTL_MS         = 1000 * 60 * 60 * 24 * 7; // 7 days
const PER_SOURCE_TIMEOUT   = 25000;
const FETCH_TIMEOUT        = 12000;
const MAX_CHUNKS_PER_SOURCE = 8;
const MAX_TOTAL_CHUNKS     = 55;
const MAX_TOTAL_SOURCES    = 20;

// Domains confirmed working with TinyFish
const TINYFISH_GOOD_DOMAINS = [
  "geeksforgeeks.org",
  "ambitionbox.com",
  "interviewbit.com",
  "igotanoffer.com",
  "careercup.com",
  "prepinsta.com",
  "medium.com",
  "reddit.com",
  "github.com",
  "techinterviewhandbook.org",
  "leetcode.com",
  "dev.to",
];

// Domains confirmed BLOCKED — skip entirely
const BLOCKED_DOMAINS = [
  "glassdoor.com", "glassdoor.co.in", "linkedin.com", "indeed.com",
  "quora.com", "naukri.com", "levels.fyi", "teamblind.com",
  "youtube.com", "twitter.com", "x.com",
];

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
function log(source: string, msg: string) { console.log(`[scraper:${source}] ${msg}`); }
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

const SLUG_OVERRIDES: Record<string, { ambitionbox?: string; gfg?: string; greenhouse?: string }> = {
  "tata consultancy services": { ambitionbox: "tcs", gfg: "tcs" },
  "tcs":          { ambitionbox: "tcs", gfg: "tcs" },
  "jpmorgan chase": { ambitionbox: "jpmorgan-chase", gfg: "jp-morgan", greenhouse: "jpmorgan" },
  "goldman sachs": { ambitionbox: "goldman-sachs", gfg: "goldman-sachs", greenhouse: "goldmansachs" },
  "meta":         { ambitionbox: "meta", gfg: "facebook" },
  "facebook":     { ambitionbox: "facebook", gfg: "facebook" },
  "alphabet":     { ambitionbox: "google", gfg: "google" },
  "x corp":       { ambitionbox: "twitter", gfg: "twitter" },
  "twitter":      { ambitionbox: "twitter", gfg: "twitter" },
};

function pickSlug(company: string, key: keyof typeof SLUG_OVERRIDES[string]): string {
  const k = company.toLowerCase().trim();
  return (SLUG_OVERRIDES[k]?.[key] as string | undefined) ?? basicSlug(company);
}

// ─── HTTP helper ───────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── URL domain check ──────────────────────────────────────────────────────
function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}
function isBlocked(url: string): boolean {
  const domain = getDomain(url);
  return BLOCKED_DOMAINS.some((d) => domain.includes(d));
}
function isGoodForTinyFish(url: string): boolean {
  const domain = getDomain(url);
  return TINYFISH_GOOD_DOMAINS.some((d) => domain.includes(d));
}

// ─── Result type ───────────────────────────────────────────────────────────
type SrcResult = { chunks: string[]; sources: string[] };
const empty: SrcResult = { chunks: [], sources: [] };
function trimResult(r: SrcResult, maxChunks = MAX_CHUNKS_PER_SOURCE): SrcResult {
  return { chunks: r.chunks.slice(0, maxChunks), sources: Array.from(new Set(r.sources)).slice(0, 5) };
}

// ════════════════════════════════════════════════════════════════════════════
//  TINYFISH ENGINE
// ════════════════════════════════════════════════════════════════════════════

interface TFSearchResult { title: string; url: string; snippet: string }
interface TFFetchResult  { url: string; text: string; title: string }

async function tfSearch(query: string): Promise<TFSearchResult[]> {
  if (!TINYFISH_API_KEY) return [];
  try {
    const res = await fetchWithTimeout(
      `https://api.search.tinyfish.ai/?query=${encodeURIComponent(query)}&language=en`,
      { headers: { "X-API-Key": TINYFISH_API_KEY } }, 12000
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: TFSearchResult[] };
    return data.results ?? [];
  } catch { return []; }
}

async function tfFetch(urls: string[]): Promise<TFFetchResult[]> {
  if (!TINYFISH_API_KEY || !urls.length) return [];
  try {
    const res = await fetchWithTimeout(
      "https://api.fetch.tinyfish.ai/",
      {
        method: "POST",
        headers: { "X-API-Key": TINYFISH_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urls.slice(0, 8), format: "markdown" }),
      }, 22000
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: TFFetchResult[] };
    return (data.results ?? []).filter((r) => r.text && r.text.length > 100);
  } catch { return []; }
}

// SOURCE TF-1: TinyFish smart search — finds best URLs then fetches them
async function fetchTinyFishSearch(company: string, role: string): Promise<SrcResult> {
  if (!TINYFISH_API_KEY) return empty;

  const queries = [
    `${company} ${role} interview questions experience 2024 2025`,
    `${company} software engineer interview technical questions rounds`,
    `${company} ${role} interview experience site:geeksforgeeks.org OR site:interviewbit.com OR site:ambitionbox.com`,
    `${company} interview questions site:reddit.com OR site:medium.com OR site:careercup.com`,
    `${company} ${role} interview experience igotanoffer prepinsta`,
  ];

  const allResults = (await Promise.all(queries.map((q) => tfSearch(q)))).flat();

  // Deduplicate + filter to known-good domains only
  const seen = new Set<string>();
  const urls = allResults
    .filter((r) => {
      if (seen.has(r.url)) return false;
      if (isBlocked(r.url)) return false;
      if (!isGoodForTinyFish(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .slice(0, 8)
    .map((r) => r.url);

  if (!urls.length) { warn("tf-search", "no good URLs found"); return empty; }
  log("tf-search", `fetching ${urls.length} URLs`);

  const fetched = await tfFetch(urls);
  const chunks: string[] = [];
  const sources: string[] = [];

  for (const page of fetched) {
    const clean = page.text.slice(0, 2500);
    if (clean.length < 150) continue;
    chunks.push(`[${getDomain(page.url)}: ${page.title || company}]\n${clean}`);
    sources.push(page.url);
  }

  log("tf-search", `${chunks.length} chunks from ${fetched.length} pages`);
  return trimResult({ chunks, sources }, 8);
}

// SOURCE TF-2: TinyFish direct — known high-quality URLs for each site
async function fetchTinyFishDirect(company: string, role: string): Promise<SrcResult> {
  if (!TINYFISH_API_KEY) return empty;

  const gfgSlug    = pickSlug(company, "gfg");
  const abSlug     = pickSlug(company, "ambitionbox");
  const basicS     = basicSlug(company);
  const compactS   = compactSlug(company);

  const candidateUrls = [
    // GeeksForGeeks
    `https://www.geeksforgeeks.org/${gfgSlug}-interview-questions/`,
    `https://www.geeksforgeeks.org/tag/${gfgSlug}/`,
    // AmbitionBox
    `https://www.ambitionbox.com/interviews/${abSlug}-interview-questions?designation=${encodeURIComponent(role)}`,
    `https://www.ambitionbox.com/interviews/${abSlug}-interview-questions`,
    // InterviewBit
    `https://www.interviewbit.com/${basicS}-interview-questions/`,
    // CareerCup
    `https://careercup.com/page?pid=${compactS}-interview-questions`,
    // igotanoffer (excellent content)
    `https://igotanoffer.com/blogs/tech/${basicS}-software-engineer-interview`,
    `https://igotanoffer.com/blogs/tech/${basicS}-${basicSlug(role)}-interview`,
    // PrepInsta
    `https://prepinsta.com/${basicS}/interview-questions/`,
    // Medium search
    `https://medium.com/tag/${basicS}-interview`,
  ];

  // Filter to good domains only
  const urls = candidateUrls.filter((u) => !isBlocked(u) && isGoodForTinyFish(u)).slice(0, 8);
  log("tf-direct", `fetching ${urls.length} direct URLs`);

  const fetched = await tfFetch(urls);
  const chunks: string[] = [];
  const sources: string[] = [];

  for (const page of fetched) {
    if (!page.text || page.text.length < 200) continue;
    // Filter out clearly wrong pages
    const lower = page.text.slice(0, 500).toLowerCase();
    if (/page not found|404|no results|doesn't exist/i.test(lower)) continue;
    const clean = page.text.slice(0, 2500);
    chunks.push(`[${getDomain(page.url)}: ${page.title || company}]\n${clean}`);
    sources.push(page.url);
  }

  log("tf-direct", `${chunks.length} useful chunks`);
  return trimResult({ chunks, sources }, 8);
}

// SOURCE TF-3: TinyFish LeetCode Discuss (targeted search)
async function fetchTinyFishLeetCode(company: string, role: string): Promise<SrcResult> {
  if (!TINYFISH_API_KEY) return empty;
  const results = await tfSearch(`${company} ${role} interview experience site:leetcode.com/discuss`);
  const urls = results
    .filter((r) => r.url.includes("leetcode.com") && !isBlocked(r.url))
    .slice(0, 5)
    .map((r) => r.url);
  if (!urls.length) return empty;

  const fetched = await tfFetch(urls);
  const chunks: string[] = [];
  const sources: string[] = [];
  for (const page of fetched) {
    if (!page.text || page.text.length < 100) continue;
    chunks.push(`[LeetCode Discuss: ${company}]\n${page.text.slice(0, 2000)}`);
    sources.push(page.url);
  }
  log("tf-lc", `${chunks.length} chunks`);
  return trimResult({ chunks, sources }, 5);
}

// ════════════════════════════════════════════════════════════════════════════
//  JINA ENGINE
// ════════════════════════════════════════════════════════════════════════════

async function jinaGet(url: string, maxChars = 2500): Promise<string> {
  try {
    const headers: Record<string, string> = { Accept: "text/plain", "X-Return-Format": "markdown" };
    if (JINA_API_KEY) headers.Authorization = `Bearer ${JINA_API_KEY}`;
    const res = await fetchWithTimeout(`https://r.jina.ai/${url}`, { headers }, 12000);
    if (!res.ok) return "";
    return (await res.text()).slice(0, maxChars);
  } catch { return ""; }
}

// SOURCE J-1: Reddit (JSON API — most reliable way to get Reddit content)
async function fetchReddit(company: string, role: string): Promise<SrcResult> {
  const queries = [
    `${company} ${role} interview experience`,
    `${company} interview questions 2024`,
    `${company} onsite interview experience`,
  ];
  const subreddits = ["cscareerquestions", "leetcode", "developersIndia", "csMajors"];
  const chunks: string[] = [];
  const sources: string[] = [];
  const tasks: Promise<void>[] = [];

  for (const q of queries) {
    tasks.push((async () => {
      try {
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=5&t=year`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": "PrepHub/1.0" } }, 8000);
        if (!res.ok) return;
        const data = await res.json();
        for (const child of data?.data?.children ?? []) {
          const post = child?.data;
          if (!post?.title) continue;
          chunks.push(`[Reddit] ${post.title}\n${(post.selftext ?? "").slice(0, 500)}`);
          if (post.permalink) sources.push(`https://reddit.com${post.permalink}`);
        }
      } catch { /* silent */ }
    })());
  }

  for (const sub of subreddits) {
    tasks.push((async () => {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(company + " interview")}&sort=relevance&limit=4&restrict_sr=1`;
        const res = await fetchWithTimeout(url, { headers: { "User-Agent": "PrepHub/1.0" } }, 8000);
        if (!res.ok) return;
        const data = await res.json();
        for (const child of data?.data?.children ?? []) {
          const post = child?.data;
          if (!post?.title) continue;
          chunks.push(`[r/${sub}] ${post.title}\n${(post.selftext ?? "").slice(0, 400)}`);
          if (post.permalink) sources.push(`https://reddit.com${post.permalink}`);
        }
      } catch { /* silent */ }
    })());
  }

  await Promise.allSettled(tasks);
  log("reddit", `${chunks.length} chunks`);
  return trimResult({ chunks, sources });
}

// SOURCE J-2: GitHub repos with interview Q&A
async function fetchGitHub(company: string, role: string): Promise<SrcResult> {
  const chunks: string[] = [];
  const sources: string[] = [];
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    for (const q of [`${company} interview questions ${role}`, `${company} interview prep`]) {
      try {
        const res = await fetchWithTimeout(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=4`,
          { headers }, 8000
        );
        if (!res.ok) continue;
        const data = await res.json() as { items?: Array<{ full_name: string; html_url: string; stargazers_count: number }> };
        for (const repo of (data?.items ?? []).slice(0, 3)) {
          try {
            const rr = await fetchWithTimeout(
              `https://api.github.com/repos/${repo.full_name}/readme`,
              { headers: { ...headers, Accept: "application/vnd.github.raw+json" } }, 6000
            );
            if (!rr.ok) continue;
            const raw = await rr.text();
            const clean = raw.replace(/```[\s\S]*?```/g, "").replace(/[<>[\]#*`]/g, " ").replace(/\s{2,}/g, " ").slice(0, 1800);
            chunks.push(`[GitHub: ${repo.full_name} ⭐${repo.stargazers_count}]\n${clean}`);
            sources.push(repo.html_url);
          } catch { /* silent */ }
        }
      } catch { /* silent */ }
    }
  } catch { /* silent */ }

  log("github", `${chunks.length} chunks`);
  return trimResult({ chunks, sources });
}

// SOURCE J-3: Jina fallback search for any missed sites
async function fetchJinaSearch(company: string, role: string): Promise<SrcResult> {
  const queries = [
    `${company} ${role} interview questions`,
    `${company} placement interview experience`,
  ];
  const chunks: string[] = [];
  const sources: string[] = [];

  for (const q of queries) {
    try {
      const searchUrl = `https://s.jina.ai/?q=${encodeURIComponent(q)}`;
      const headers: Record<string, string> = { Accept: "application/json", "X-Return-Format": "json" };
      if (JINA_API_KEY) headers.Authorization = `Bearer ${JINA_API_KEY}`;
      const res = await fetchWithTimeout(searchUrl, { headers }, 10000);
      if (!res.ok) continue;
      const data = await res.json() as { data?: Array<{ url: string; title: string; description: string }> };
      for (const result of (data?.data ?? []).slice(0, 4)) {
        if (isBlocked(result.url)) continue;
        const text = `[Jina Search: ${result.title}]\n${result.description}`;
        if (text.length > 100) { chunks.push(text); sources.push(result.url); }
      }
    } catch { /* silent */ }
  }

  log("jina-search", `${chunks.length} chunks`);
  return trimResult({ chunks, sources }, 5);
}

// SOURCE J-4: Jina direct reads (LeetCode, InterviewBit fallback)
async function fetchJinaDirect(company: string, _role: string): Promise<SrcResult> {
  const basicS = basicSlug(company);
  const urls = [
    `https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=${encodeURIComponent(company)}`,
    `https://www.interviewbit.com/${basicS}-interview-questions/`,
    `https://www.geeksforgeeks.org/${pickSlug(company, "gfg")}-interview-questions/`,
  ];

  const chunks: string[] = [];
  const sources: string[] = [];

  await Promise.allSettled(urls.map(async (url) => {
    const text = await jinaGet(url, 2000);
    if (!text || text.length < 150) return;
    if (/page not found|404/i.test(text.slice(0, 300))) return;
    chunks.push(`[${getDomain(url)}: ${company}]\n${text}`);
    sources.push(url);
  }));

  log("jina-direct", `${chunks.length} chunks`);
  return trimResult({ chunks, sources }, 5);
}

// SOURCE: Job Descriptions (Greenhouse / Lever APIs)
async function fetchJobDescriptions(company: string, role: string): Promise<SrcResult> {
  const ghSlug = (SLUG_OVERRIDES[company.toLowerCase()]?.greenhouse) ?? compactSlug(company);
  const candidates = [
    {
      url: `https://boards-api.greenhouse.io/v1/boards/${ghSlug}/jobs?content=true`,
      parse: (d: unknown) => {
        const jobs = (d as { jobs?: Array<{ title?: string; content?: string }> })?.jobs ?? [];
        const matching = jobs.filter((j) => j.title?.toLowerCase().includes(role.toLowerCase())).slice(0, 3);
        return (matching.length ? matching : jobs.slice(0, 3))
          .map((j) => `${j.title ?? ""}: ${(j.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 500)}`)
          .join("\n\n");
      },
    },
    {
      url: `https://api.lever.co/v0/postings/${compactSlug(company)}?mode=json`,
      parse: (d: unknown) => {
        const arr = Array.isArray(d) ? d as Array<{ text?: string; description?: string }> : [];
        const matching = arr.filter((j) => (j.text ?? "").toLowerCase().includes(role.toLowerCase())).slice(0, 3);
        return (matching.length ? matching : arr.slice(0, 3))
          .map((j) => `${j.text ?? ""}: ${(j.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 500)}`)
          .join("\n\n");
      },
    },
  ];

  for (const { url, parse } of candidates) {
    try {
      const res = await fetchWithTimeout(url, {}, 6000);
      if (!res.ok) continue;
      const data = await res.json();
      const text = parse(data);
      if (text.length > 80) {
        log("jd", `hit ${getDomain(url)}`);
        return { chunks: [`[Job Descriptions: ${company}]\n${text}`], sources: [url] };
      }
    } catch { /* silent */ }
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
      new Promise<SrcResult>((_, rej) => setTimeout(() => rej(new Error(`timeout`)), PER_SOURCE_TIMEOUT)),
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
    // TinyFish sources (primary — browser-grade fetching, handles JS sites)
    ["TinyFish Search",  () => fetchTinyFishSearch(company, role)],
    ["TinyFish Direct",  () => fetchTinyFishDirect(company, role)],
    ["TinyFish LeetCode",() => fetchTinyFishLeetCode(company, role)],
    // Jina sources (structured APIs + fallback reader)
    ["Reddit",           () => fetchReddit(company, role)],
    ["GitHub",           () => fetchGitHub(company, role)],
    ["Jina Search",      () => fetchJinaSearch(company, role)],
    ["Jina Direct",      () => fetchJinaDirect(company, role)],
    ["Job Postings",     () => fetchJobDescriptions(company, role)],
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
