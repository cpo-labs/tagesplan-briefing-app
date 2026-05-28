"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * While a briefing is in `processing`, refresh the page every 5s so the
 * server component re-fetches and (eventually) swaps to the ready view.
 * Simple, no need for SSE for an MVP.
 */
export function BriefingAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
