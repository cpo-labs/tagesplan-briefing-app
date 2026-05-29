"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

const SERVICE_ADDRESS = "briefing@appsales-consulting.com";

/**
 * Card B — the honest, no-login share path. Shows the service address with a
 * copy button plus the real steps. Hand-built visual: a calendar tile that
 * sends an "invite" packet across to the service inbox, idle-pulsing the inbox
 * and accelerating the packet on hover.
 */
export function WayForwardCard({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const c = dict.ways.cards;
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(SERVICE_ADDRESS);
      setCopyState("ok");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("fail");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  const copyLabel = copyState === "ok" ? c.copied : copyState === "fail" ? c.copyFail : c.copy;

  return (
    <article className="calway accent--sand">
      <p className="calway__cap">
        <CapLabel cap={dict.ways.b.cap} />
      </p>
      <h3 className="calway__title">{dict.ways.b.title}</h3>
      <p className="calway__copy">{dict.ways.b.copy.replace(SERVICE_ADDRESS, "").trim()}</p>

      {/* Hand-built visual: calendar tile → invite packet → service inbox */}
      <div className="calviz" aria-hidden>
        <span className="calviz__orb" />
        <div className="calviz__flow">
          <div className="calviz__node calviz__node--cal">
            <span className="calviz__nodecap">{c.b.vizFrom}</span>
            <span className="calviz__grid">
              <i /><i /><i /><i /><i /><i />
            </span>
          </div>
          <div className="calviz__wire">
            <span className="calviz__packet" />
          </div>
          <div className="calviz__node calviz__node--inbox">
            <span className="calviz__nodecap">{c.b.vizTo}</span>
            <span className="calviz__inboxbar">{c.b.vizInbox}</span>
          </div>
        </div>
      </div>

      <div className="calway__body">
        <div className="calway__addr">
          <div className="calway__addr-text">
            <p className="field__label">{c.b.addrLabel}</p>
            <p className="calway__addr-mono">{SERVICE_ADDRESS}</p>
          </div>
          <button type="button" onClick={copy} className="calway__copybtn">
            {copyLabel}
          </button>
        </div>

        <ol className="calway__steps">
          {c.b.steps.map((s, i) => (
            <li key={i}>
              <span className="calway__steps-num">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <span className="calway__softbadge">{dict.ways.b.badge}</span>
      </div>
    </article>
  );
}

function CapLabel({ cap }: { cap: string }) {
  const idx = cap.lastIndexOf(" ");
  if (idx < 0) return <>{cap}</>;
  return (
    <>
      {cap.slice(0, idx)} <b>{cap.slice(idx + 1)}</b>
    </>
  );
}
