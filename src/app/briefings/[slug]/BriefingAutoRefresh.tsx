"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * While a briefing is in `processing`, refresh the page every 5s so the
 * server component re-fetches and (eventually) swaps to the ready view.
 *
 * Max 24 polls = 2 Minuten. Danach Stop, weil Vercel-Function-Timeout den
 * Background-Job laengst gekillt hat — endloses Polling waere sinnlos und
 * traffic-belastend.
 */
const MAX_POLLS = 24;
const POLL_INTERVAL_MS = 5000;

export function BriefingAutoRefresh() {
  const router = useRouter();
  const [pollsExceeded, setPollsExceeded] = useState(false);

  useEffect(() => {
    let count = 0;
    const t = setInterval(() => {
      count += 1;
      if (count >= MAX_POLLS) {
        clearInterval(t);
        setPollsExceeded(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(t);
  }, [router]);

  if (pollsExceeded) {
    return (
      <div
        role="alert"
        className="mt-9 mx-auto max-w-[36rem] gut"
        style={{ padding: "1.25rem 1.5rem" }}
      >
        <div
          className="surface p-6"
          style={{
            background: "rgba(230,80,66,0.08)",
            border: "1.5px solid rgba(230,80,66,0.25)",
          }}
        >
          <p
            className="font-mono text-[0.72rem] uppercase tracking-[0.1em] mb-2"
            style={{ color: "var(--coral-deep)" }}
          >
            Dauert laenger als erwartet
          </p>
          <p className="leading-relaxed">
            Die Generierung ist noch nicht fertig oder ein Hintergrund-Job ist
            haengen geblieben. Bitte Seite manuell neu laden — oder schreib uns,
            wenn es nicht weitergeht.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
