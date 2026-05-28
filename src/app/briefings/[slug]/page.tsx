import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { briefings } from "@/lib/db/schema";
import {
  briefingPayloadSchema,
  type BriefingPayload,
  type BriefingMeeting,
} from "@/lib/briefing/pipeline";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL, CONTACT_MAILTO_TAGESPLAN } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { t, type Locale } from "@/lib/i18n";
import { BriefingAutoRefresh } from "./BriefingAutoRefresh";
import { SendDayPlan } from "./SendDayPlan";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
// The polling/render itself is light, but this segment also re-reads the
// briefing while the background pipeline finishes — keep headroom on free tier.
export const maxDuration = 60;

export default async function BriefingDetailPage({ params }: Props) {
  const locale = await getLocale();
  const { slug } = await params;
  const rows = await db.select().from(briefings).where(eq(briefings.slug, slug)).limit(1);
  const briefing = rows[0];
  if (!briefing) notFound();

  if (briefing.status === "processing") {
    return <ProcessingView title={briefing.title} locale={locale} />;
  }

  if (briefing.status === "failed") {
    return <FailedView title={briefing.title} message={briefing.errorMessage} locale={locale} />;
  }

  if (!briefing.payload) {
    return <FailedView title={briefing.title} message={null} locale={locale} />;
  }

  let payload: BriefingPayload;
  try {
    payload = briefingPayloadSchema.parse(JSON.parse(briefing.payload));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[briefings/[slug]] payload validation failed:", err);
    return <FailedView title={briefing.title} message={null} locale={locale} />;
  }

  return (
    <ReadyView
      slug={briefing.slug}
      payload={payload}
      createdAt={briefing.createdAt}
      locale={locale}
    />
  );
}

/* ─── Views ─────────────────────────────────────────────────────────── */

function ProcessingView({ title, locale }: { title: string; locale: Locale }) {
  const dict = t(locale).result;
  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader locale={locale} />
        <BriefingAutoRefresh timeoutLabel={dict.pollTimeoutLabel} timeoutBody={dict.pollTimeoutBody} />
        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.processingTag}</p>
          <h1 className="pagehero__title">{dict.processingTitle}</h1>
          <p className="pagehero__sub">{dict.processingSub}</p>
          <div
            style={{
              marginTop: "1.6rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.7rem",
              padding: "0.6rem 1.1rem",
              borderRadius: "100px",
              background: "rgba(230,80,66,0.18)",
              color: "var(--cream)",
              fontFamily: "var(--mono)",
              fontSize: "0.74rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "1.5px solid rgba(230,80,66,0.36)",
            }}
          >
            <span className="dot-pulse" />
            {dict.autoRefresh}
          </div>
        </div>
      </header>
      <section className="toolpage">
        <div className="toolpage__in">
          <p style={{ color: "var(--soft)", maxWidth: "44rem" }}>{dict.processingHint}</p>
        </div>
      </section>
      <SiteFooter locale={locale} />
    </>
  );
}

function FailedView({
  title,
  message,
  locale,
}: {
  title: string;
  message: string | null;
  locale: Locale;
}) {
  const dict = t(locale).result;
  return (
    <>
      <header className="pagehero accent--coral">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader locale={locale} />
        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.failedTag}</p>
          <h1 className="pagehero__title">{title}</h1>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          <div
            style={{
              maxWidth: "48rem",
              padding: "clamp(1.8rem,3vw,2.4rem)",
              background: "#fff",
              border: "1px solid rgba(24,20,16,0.1)",
              borderRadius: "var(--rl)",
              boxShadow: "0 18px 40px -28px rgba(24,20,16,0.2)",
            }}
          >
            <p className="mono-label" style={{ color: "var(--coral-deep)" }}>
              {dict.failedLabel}
            </p>
            <p className="mt-3" style={{ color: "var(--ink)", lineHeight: 1.6 }}>
              {message ?? dict.failedFallback}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="pill pill--ink pill--arrow">
                {dict.backHome}
              </Link>
              <Link href={`mailto:${CONTACT_EMAIL}`} className="pill pill--ghost">
                {dict.writeUs}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter locale={locale} />
    </>
  );
}

function ReadyView({
  slug,
  payload,
  createdAt,
  locale,
}: {
  slug: string;
  payload: BriefingPayload;
  createdAt: Date | string;
  locale: Locale;
}) {
  const dict = t(locale).result;
  const dateLabel = formatDateHuman(payload.date, locale);
  const generated = formatStamp(createdAt, locale);

  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/#calendar-form", label: dict.readyTag }} locale={locale} />

        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.readyTag}</p>
          <h1 className="pagehero__title">
            <em>{dateLabel.weekday}</em>
            <br />
            {dateLabel.dayMonth}
          </h1>
          <p className="pagehero__sub">
            {payload.meetings.length === 1 ? dict.summaryOne : dict.summaryMany(payload.meetings.length)}
          </p>
          <div
            style={{
              marginTop: "1.4rem",
              fontFamily: "var(--mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(250,247,242,0.62)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.7rem",
              flexWrap: "wrap",
            }}
          >
            <span>{dict.createdAt(generated)}</span>
            {payload.isMock && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: "var(--sand)" }}>{dict.mockNote}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          {payload.meetings.length > 1 && (
            <nav style={{ marginBottom: "clamp(2rem,3.5vw,3rem)" }} aria-label={dict.jumpTo}>
              <p className="mono-label">{dict.jumpTo}</p>
              <ul className="mt-3" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {payload.meetings.map((m, i) => (
                  <li key={m.uid}>
                    <a
                      href={`#m-${i}`}
                      className="font-mono text-[0.72rem] uppercase tracking-[0.06em] px-3.5 py-2 rounded-full transition"
                      style={{
                        border: "1.5px solid rgba(24,20,16,0.18)",
                        color: "var(--ink)",
                        background: "#fff",
                      }}
                    >
                      {formatTime(m.startsAt, locale)} &middot; {truncateSummary(m.summary)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(2rem,3vw,3rem)" }}>
            {payload.meetings.map((m, i) => (
              <MeetingBriefCard key={m.uid} meeting={m} index={i} locale={locale} />
            ))}
          </div>

          {/* Optional: email me this day-plan */}
          <div
            style={{
              marginTop: "clamp(2.5rem,4vw,4rem)",
              padding: "clamp(1.8rem,3vw,2.4rem)",
              background: "var(--ink-deep)",
              color: "var(--cream)",
              borderRadius: "var(--rl)",
            }}
          >
            <SendDayPlan slug={slug} locale={locale} />
          </div>

          {/* Lead CTA */}
          <div
            className="grid items-center gap-6 md:grid-cols-[1.6fr_1fr]"
            style={{
              marginTop: "clamp(2rem,3.5vw,3rem)",
              padding: "clamp(2rem,3.5vw,2.8rem)",
              background: "var(--ink)",
              color: "var(--cream)",
              borderRadius: "var(--rl)",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.76rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--sand)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span style={{ width: "1.6rem", height: "2px", background: "var(--sand)" }} />
                {dict.leadEyebrow}
              </p>
              <h2
                style={{
                  marginTop: "1rem",
                  fontWeight: 600,
                  fontSize: "clamp(1.6rem,3vw,2.4rem)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.08,
                }}
              >
                {dict.leadTitle}
              </h2>
              <p
                style={{
                  marginTop: "0.9rem",
                  color: "rgba(250,247,242,0.78)",
                  lineHeight: 1.6,
                  maxWidth: "44ch",
                }}
              >
                {dict.leadText}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <Link href={CONTACT_MAILTO_TAGESPLAN} className="pill pill--coral pill--arrow">
                {CONTACT_EMAIL}
              </Link>
              <Link href="https://labs.appsales-consulting.de" className="pill pill--ghost-dark">
                {dict.leadMore}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}

const ACCENTS = ["coral", "petrol", "sand"] as const;

function MeetingBriefCard({
  meeting,
  index,
  locale,
}: {
  meeting: BriefingMeeting;
  index: number;
  locale: Locale;
}) {
  const dict = t(locale).result;
  // Per-meeting accent rotation: sand / petrol / coral cycling.
  const accent = ACCENTS[index % ACCENTS.length];
  const accentVar = `var(--${accent})`;
  const time = `${formatTime(meeting.startsAt, locale)} – ${formatTime(meeting.endsAt, locale)}`;
  const allCitations = [
    ...(meeting.brief.citations ?? []),
    ...(meeting.citationsExtra ?? []),
  ].filter((c, i, arr) => arr.findIndex((x) => x.url === c.url) === i);

  return (
    <article
      id={`m-${index}`}
      className={`brief-card brief-card--accent-${accent}`}
      style={{
        ["--accent" as string]: accentVar,
      }}
    >
      <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 mb-5">
        <span className="font-mono text-[0.78rem] tracking-[0.12em] uppercase" style={{ color: accentVar }}>
          {time}
        </span>
        {meeting.location && (
          <span className="font-mono text-[0.72rem] tracking-wider uppercase" style={{ color: "var(--soft)" }}>
            {meeting.location}
          </span>
        )}
        {meeting.hints.companyGuess && (
          <span className="font-mono text-[0.72rem] tracking-wider uppercase" style={{ color: "var(--soft)" }}>
            {meeting.hints.companyGuess}
          </span>
        )}
      </header>

      <h2 className="h2 text-[clamp(1.5rem,2.5vw,2.1rem)] leading-tight">
        {meeting.brief.headline || meeting.summary}
      </h2>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          {meeting.brief.status && (
            <Block label={dict.blockStatus}>
              <p className="leading-relaxed">{meeting.brief.status}</p>
            </Block>
          )}
          {meeting.brief.companyContext && (
            <Block label={dict.blockCompany}>
              <p className="leading-relaxed">{meeting.brief.companyContext}</p>
            </Block>
          )}
          {meeting.brief.personContext && (
            <Block label={dict.blockPerson}>
              <p className="leading-relaxed">{meeting.brief.personContext}</p>
            </Block>
          )}
          {meeting.brief.conceptProposal && (
            <Block label={dict.blockConcept} accent={accentVar}>
              <p className="leading-relaxed">{meeting.brief.conceptProposal}</p>
            </Block>
          )}
        </div>

        <aside className="space-y-7">
          {meeting.brief.talkingPoints.length > 0 && (
            <Block label={dict.blockTalkingPoints}>
              <ul className="space-y-2.5">
                {meeting.brief.talkingPoints.map((tp, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 block h-2 w-2 rounded-sm flex-none"
                      style={{ background: accentVar }}
                    />
                    <span className="leading-relaxed">{tp}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {meeting.brief.recentNews.length > 0 && (
            <Block label={dict.blockNews}>
              <ul className="space-y-2 text-[0.92rem]">
                {meeting.brief.recentNews.map((n, i) => (
                  <li key={i} className="leading-relaxed" style={{ color: "var(--soft)" }}>
                    {n}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {meeting.brief.openQuestions.length > 0 && (
            <Block label={dict.blockQuestions}>
              <ul className="space-y-2 text-[0.92rem]">
                {meeting.brief.openQuestions.map((q, i) => (
                  <li key={i} className="leading-relaxed">
                    {q}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {allCitations.length > 0 && (
            <Block label={dict.blockSources}>
              <ul className="space-y-1.5 text-[0.84rem]">
                {allCitations.slice(0, 6).map((c, i) => (
                  <li key={i}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-2 underline-offset-4 hover:text-coral transition"
                      style={{ color: "var(--soft)" }}
                    >
                      {c.label || c.url}
                    </a>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </aside>
      </div>
    </article>
  );
}

function Block({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <p
        className="font-mono text-[0.7rem] tracking-[0.12em] uppercase mb-2"
        style={{ color: accent ?? "var(--soft)" }}
      >
        {label}
      </p>
      <div className="text-[0.96rem]">{children}</div>
    </section>
  );
}

function formatDateHuman(iso: string, locale: Locale): { weekday: string; dayMonth: string } {
  const intl = locale === "en" ? "en-GB" : "de-DE";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString(intl, { weekday: "long" }),
    dayMonth: date.toLocaleDateString(intl, { day: "2-digit", month: "long", year: "numeric" }),
  };
}

function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(locale === "en" ? "en-GB" : "de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function formatStamp(d: Date | string, locale: Locale): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateSummary(s: string): string {
  if (s.length <= 28) return s;
  return s.slice(0, 27) + "…";
}
