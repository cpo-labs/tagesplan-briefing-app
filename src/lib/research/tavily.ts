/**
 * Thin Tavily client. We use the /search endpoint with `advanced` search
 * depth so we get clean snippets back. No SDK dep — keeps bundle small.
 *
 * Fehler-Modell (bewusst getrennt):
 *  - Kein TAVILY_API_KEY    -> mock: true  (ehrlicher Demo-Modus, keine Recherche)
 *  - HTTP-/Netzfehler trotz Retry -> failed: true mit Fehlertext (sichtbare Luecke,
 *    KEIN stiller Mock — der Downstream signalisiert die Luecke im Brief)
 *
 * Transiente Fehler (429, 5xx, Netz-Timeout) werden mit exponentiellem
 * Backoff bis zu MAX_RETRIES wiederholt; ein 429 mit `Retry-After` wird
 * geehrt. Permanente Fehler (4xx ausser 429) brechen sofort ab.
 */

import { env } from "../env";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

export interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilyResult[];
  /** Kein API-Key gesetzt: bewusster Demo-Modus ohne Recherche. */
  mock: boolean;
  /** Recherche wurde versucht, ist aber (trotz Retry) fehlgeschlagen. */
  failed: boolean;
  /** Menschlich lesbarer Grund, wenn failed. */
  failReason?: string;
}

const TAVILY_URL = "https://api.tavily.com/search";

const MAX_RETRIES = 2; // also up to 3 attempts total
const BASE_BACKOFF_MS = 600;
const MAX_BACKOFF_MS = 8_000;
const REQUEST_TIMEOUT_MS = 15_000;

interface SearchOpts {
  query: string;
  maxResults?: number;
  includeAnswer?: boolean;
  topic?: "general" | "news";
  days?: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Transiente HTTP-Stati, die ein Retry rechtfertigen. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599);
}

/** Backoff in ms fuer Versuch `attempt` (0-basiert), respektiert Retry-After. */
function backoffMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_BACKOFF_MS);
    }
  }
  const exp = BASE_BACKOFF_MS * 2 ** attempt;
  const jitter = Math.random() * BASE_BACKOFF_MS;
  return Math.min(exp + jitter, MAX_BACKOFF_MS);
}

export async function tavilySearch(opts: SearchOpts): Promise<TavilyResponse> {
  if (!env.tavilyKey) {
    return mockResult(opts.query);
  }

  const body = {
    api_key: env.tavilyKey,
    query: opts.query,
    search_depth: "advanced",
    max_results: opts.maxResults ?? 5,
    include_answer: opts.includeAnswer ?? true,
    topic: opts.topic ?? "general",
    ...(opts.days ? { days: opts.days } : {}),
  };

  let lastReason = "unbekannter Fehler";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(TAVILY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          query?: string;
          answer?: string;
          results?: Array<{
            title: string;
            url: string;
            content: string;
            score?: number;
            published_date?: string;
          }>;
        };

        return {
          query: json.query ?? opts.query,
          answer: json.answer,
          results: (json.results ?? []).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
            publishedDate: r.published_date,
          })),
          mock: false,
          failed: false,
        };
      }

      lastReason = `HTTP ${res.status}`;

      if (!isRetryableStatus(res.status) || attempt === MAX_RETRIES) {
        // eslint-disable-next-line no-console
        console.error(`[tavily] HTTP ${res.status} for "${opts.query}" (attempt ${attempt + 1})`);
        return failedResult(opts.query, lastReason);
      }

      const wait = backoffMs(attempt, res.headers.get("retry-after"));
      // eslint-disable-next-line no-console
      console.warn(`[tavily] HTTP ${res.status} for "${opts.query}", retry in ${wait}ms`);
      await sleep(wait);
    } catch (err) {
      lastReason = err instanceof Error ? err.message : "Netzwerkfehler";
      if (attempt === MAX_RETRIES) {
        // eslint-disable-next-line no-console
        console.error(`[tavily] error for "${opts.query}" (attempt ${attempt + 1}):`, err);
        return failedResult(opts.query, lastReason);
      }
      const wait = backoffMs(attempt, null);
      // eslint-disable-next-line no-console
      console.warn(`[tavily] error for "${opts.query}", retry in ${wait}ms:`, lastReason);
      await sleep(wait);
    }
  }

  return failedResult(opts.query, lastReason);
}

function mockResult(query: string): TavilyResponse {
  return {
    query,
    answer: undefined,
    results: [],
    mock: true,
    failed: false,
  };
}

function failedResult(query: string, reason: string): TavilyResponse {
  return {
    query,
    answer: undefined,
    results: [],
    mock: false,
    failed: true,
    failReason: reason,
  };
}
