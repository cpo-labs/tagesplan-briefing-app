import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL, CONTACT_MAILTO_TAGESPLAN } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { CalendarForm } from "./_components/calendar-form";

export const dynamic = "force-dynamic";
// Free-tier: the public briefing action runs the pipeline kickoff + DB writes
// and schedules background work via `after()`. Give the route segment headroom.
export const maxDuration = 60;

export default async function LandingPage() {
  const locale = await getLocale();
  const dict = t(locale);

  return (
    <>
      {/* ─── Pagehero (Sand-Accent, asymmetrisch) ────────────────── */}
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/login", label: dict.nav.login }} locale={locale} />

        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.hero.tag}</p>
          <h1 className="pagehero__title">
            {dict.hero.titleBefore}
            <em>{dict.hero.titleEm}</em>
            {dict.hero.titleAfter}
          </h1>
          <p className="pagehero__sub">{dict.hero.sub}</p>

          <div style={{ marginTop: "2.4rem", maxWidth: "38rem" }}>
            <CalendarForm locale={locale} />
          </div>

          <p
            style={{
              marginTop: "1.4rem",
              fontFamily: "var(--mono)",
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(250,247,242,0.62)",
            }}
          >
            {dict.hero.note}
          </p>
        </div>
      </header>

      {/* ─── Toolpage: drei Wege ─────────────────────────────────── */}
      <section className="toolpage" id="how">
        <div className="toolpage__in">
          <div className="toolpage__intro">
            <div>
              <p className="eyebrow">{dict.ways.eyebrow}</p>
              <h2 className="toolpage__heading">{dict.ways.heading}</h2>
            </div>
            <p className="toolpage__copy">{dict.ways.intro}</p>
          </div>

          <div className="calsrc-grid">
            <article className="calsrc accent--petrol">
              <p className="calsrc__cap">
                <CapLabel cap={dict.ways.a.cap} />
              </p>
              <h3 className="calsrc__title">{dict.ways.a.title}</h3>
              <p className="calsrc__copy">{dict.ways.a.copy}</p>
              <Link href="/#calendar-form" className="calsrc__meta">
                {dict.ways.a.cta}
              </Link>
            </article>

            <article className="calsrc accent--sand">
              <p className="calsrc__cap">
                <CapLabel cap={dict.ways.b.cap} />
              </p>
              <h3 className="calsrc__title">{dict.ways.b.title}</h3>
              <p className="calsrc__copy">
                {dict.ways.b.copy.split("briefing@appsales-consulting.com").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <code
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "0.88em",
                          background: "var(--cream-2)",
                          padding: "0.06em 0.34em",
                          borderRadius: "5px",
                          color: "var(--coral-deep)",
                        }}
                      >
                        briefing@appsales-consulting.com
                      </code>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </p>
              <span className="calsrc__badge">{dict.ways.b.badge}</span>
              <Link href="/about" className="calsrc__meta">
                {dict.ways.b.cta}
              </Link>
            </article>

            <article className="calsrc accent--coral">
              <p className="calsrc__cap">
                <CapLabel cap={dict.ways.c.cap} />
              </p>
              <h3 className="calsrc__title">{dict.ways.c.title}</h3>
              <p className="calsrc__copy">{dict.ways.c.copy}</p>
              <Link href="/login?from=google" className="calsrc__meta">
                {dict.ways.c.cta}
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Was du bekommst ─────────────────────────────────────── */}
      <section
        style={{
          background: "var(--cream-2)",
          padding: "clamp(4rem,8vw,7rem) 0",
        }}
      >
        <div
          className="grid items-start gap-[clamp(2rem,4vw,4rem)] mx-auto md:grid-cols-[1.1fr_1fr]"
          style={{
            maxWidth: "78rem",
            paddingLeft: "var(--gut)",
            paddingRight: "var(--gut)",
          }}
        >
          <div>
            <p className="eyebrow">{dict.benefits.eyebrow}</p>
            <h2
              className="mt-4"
              style={{
                fontWeight: 600,
                fontSize: "clamp(1.7rem,3.2vw,2.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                maxWidth: "24ch",
              }}
            >
              {dict.benefits.title}
            </h2>
            <p className="mt-5" style={{ color: "var(--soft)", lineHeight: 1.65, maxWidth: "44ch" }}>
              {dict.benefits.intro}
            </p>
            <ul className="mt-7 space-y-3" style={{ color: "var(--ink)", fontSize: "0.97rem", lineHeight: 1.55 }}>
              {dict.benefits.items.map((item) => (
                <Feature key={item}>{item}</Feature>
              ))}
            </ul>
          </div>

          <MockBriefCard
            cap={dict.benefits.mock.cap}
            tag={dict.benefits.mock.tag}
            title={dict.benefits.mock.title}
            body={dict.benefits.mock.body}
            pointsLabel={dict.benefits.mock.pointsLabel}
            points={dict.benefits.mock.points}
          />
        </div>
      </section>

      {/* ─── Pipeline-Erklaerung ─────────────────────────────────── */}
      <section style={{ background: "var(--cream)", padding: "clamp(4rem,8vw,7rem) 0" }}>
        <div
          style={{
            maxWidth: "78rem",
            margin: "0 auto",
            paddingLeft: "var(--gut)",
            paddingRight: "var(--gut)",
          }}
        >
          <p className="eyebrow">{dict.pipeline.eyebrow}</p>
          <h2
            className="mt-4"
            style={{
              fontWeight: 600,
              fontSize: "clamp(1.7rem,3.2vw,2.4rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              maxWidth: "32ch",
            }}
          >
            {dict.pipeline.title}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {dict.pipeline.steps.map((step, i) => (
              <StepNum
                key={step.num}
                num={step.num}
                title={step.title}
                body={step.body}
                tone={(["petrol", "sand", "coral"] as const)[i] ?? "petrol"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom-CTA (dunkel) ─────────────────────────────────── */}
      <section
        className="grain grain--dark"
        style={{
          background: "var(--ink-deep)",
          color: "var(--cream)",
          padding: "clamp(4rem,8vw,7rem) var(--gut)",
        }}
      >
        <div style={{ maxWidth: "78rem", margin: "0 auto" }}>
          <div className="grid items-end gap-[2.4rem] md:grid-cols-[1.4fr_1fr]">
            <div>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--coral)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span style={{ width: "1.6rem", height: "2px", background: "var(--coral)" }} />
                {dict.bottomCta.eyebrow}
              </p>
              <h2
                style={{
                  marginTop: "1.2rem",
                  fontWeight: 600,
                  fontSize: "clamp(2rem,4vw,3.2rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.025em",
                  maxWidth: "20ch",
                }}
              >
                {dict.bottomCta.title}
              </h2>
              <p
                style={{
                  marginTop: "1.4rem",
                  color: "rgba(250,247,242,0.78)",
                  lineHeight: 1.6,
                  maxWidth: "42ch",
                }}
              >
                {dict.bottomCta.text}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <Link href="/#calendar-form" className="pill pill--coral pill--arrow">
                {dict.bottomCta.primary}
              </Link>
              <Link href={CONTACT_MAILTO_TAGESPLAN} className="pill pill--ghost-dark">
                {dict.bottomCta.secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Renders "Variante A" / "Option A" with the trailing letter bolded. */
function CapLabel({ cap }: { cap: string }) {
  const idx = cap.lastIndexOf(" ");
  if (idx < 0) return <>{cap}</>;
  return (
    <>
      {cap.slice(0, idx)} <b>{cap.slice(idx + 1)}</b>
    </>
  );
}

function StepNum({
  num,
  title,
  body,
  tone,
}: {
  num: string;
  title: string;
  body: string;
  tone: "coral" | "petrol" | "sand";
}) {
  const accent = { coral: "var(--coral)", petrol: "var(--petrol)", sand: "var(--sand)" }[tone];
  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid rgba(24,20,16,0.08)",
        borderRadius: "var(--rm)",
        padding: "1.8rem 1.9rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.78rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {num}
        </span>
        <span style={{ display: "block", width: "0.6rem", height: "0.6rem", borderRadius: "100px", background: accent }} />
      </div>
      <h3 style={{ fontWeight: 600, fontSize: "1.2rem", letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--soft)" }}>{body}</p>
    </article>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-2 block h-2.5 w-2.5 rounded-sm flex-none"
        style={{ background: "var(--sand)" }}
      />
      <span>{children}</span>
    </li>
  );
}

function MockBriefCard({
  cap,
  tag,
  title,
  body,
  pointsLabel,
  points,
}: {
  cap: string;
  tag: string;
  title: string;
  body: string;
  pointsLabel: string;
  points: string[];
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid rgba(24,20,16,0.08)",
        borderRadius: "var(--rl)",
        padding: "1.8rem",
        boxShadow: "0 26px 60px -34px rgba(24,20,16,0.32)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: "var(--coral)",
          borderTopLeftRadius: "var(--rl)",
          borderBottomLeftRadius: "var(--rl)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--coral)",
          }}
        >
          {cap}
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.66rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--soft)",
          }}
        >
          {tag}
        </span>
      </div>
      <h3 className="h3 mt-3">{title}</h3>
      <p className="mt-3" style={{ color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        {body}
      </p>
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(24,20,16,0.08)" }}>
        <p className="mono-label">{pointsLabel}</p>
        <ul className="mt-3 space-y-2" style={{ fontSize: "0.92rem", lineHeight: 1.55 }}>
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <span
                className="mt-2 block h-1.5 w-1.5 rounded-full flex-none"
                style={{ background: "var(--coral)" }}
              />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
