/**
 * Thin Tavily client. We use the /search endpoint with `advanced` search
 * depth so we get clean snippets back. No SDK dep — keeps bundle small.
 *
 * If TAVILY_API_KEY is missing we return a mock that flags the response
 * as `mock: true`. The downstream synthesiser is aware and skips
 * pretend-citations.
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
  mock: boolean;
}

const TAVILY_URL = "https://api.tavily.com/search";

interface SearchOpts {
  query: string;
  maxResults?: number;
  includeAnswer?: boolean;
  topic?: "general" | "news";
  days?: number;
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

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`[tavily] HTTP ${res.status} for "${opts.query}"`);
      return mockResult(opts.query);
    }

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
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[tavily] error for "${opts.query}":`, err);
    return mockResult(opts.query);
  }
}

function mockResult(query: string): TavilyResponse {
  return {
    query,
    answer: undefined,
    results: [],
    mock: true,
  };
}
