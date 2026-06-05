import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { buildDemoPayload } from "@/lib/briefing/demo";
import { MeetingBriefCard } from "@/app/briefings/[slug]/page";

export const dynamic = "force-dynamic";

/**
 * "Beispiel ansehen": ein fertiger Demo-Tagesplan OHNE Eingabe und OHNE
 * Kalender-Link. Erfundene Firmen, damit der erste Aha-Moment vor jeder
 * Trust-Wall kommt.
 */
export default async function BeispielPage() {
  const locale = await getLocale();
  const dict = t(locale).result;
  const payload = buildDemoPayload(locale);

  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/#calendar-form", label: dict.demoCtaButton }} locale={locale} />

        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.demoTag}</p>
          <h1 className="pagehero__title">
            <em>{locale === "en" ? "A normal day" : "Ein normaler Tag"}</em>
            <br />
            {locale === "en" ? "two meetings, both briefed" : "zwei Termine, beide gebrieft"}
          </h1>
          <p className="pagehero__sub">{dict.demoNote}</p>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(2rem,3vw,3rem)" }}>
            {payload.meetings.map((m, i) => (
              <MeetingBriefCard key={m.uid} meeting={m} index={i} locale={locale} />
            ))}
          </div>

          <div
            className="grid items-center gap-6 md:grid-cols-[1.6fr_1fr]"
            style={{
              marginTop: "clamp(2.5rem,4vw,4rem)",
              padding: "clamp(2rem,3.5vw,2.8rem)",
              background: "var(--ink-deep)",
              color: "var(--cream)",
              borderRadius: "var(--rl)",
            }}
          >
            <h2
              style={{
                fontWeight: 600,
                fontSize: "clamp(1.5rem,2.8vw,2.2rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                maxWidth: "26ch",
              }}
            >
              {dict.demoCtaTitle}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <Link href="/#calendar-form" className="pill pill--coral pill--arrow">
                {dict.demoCtaButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
