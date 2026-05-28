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
import { BriefingAutoRefresh } from "./BriefingAutoRefresh";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function BriefingDetailPage({ params }: Props) {
  const { slug } = await params;
  const rows = await db.select().from(briefings).where(eq(briefings.slug, slug)).limit(1);
  const briefing = rows[0];
  if (!briefing) notFound();

  if (briefing.status === "processing") {
    return <ProcessingView title={briefing.title} />;
  }

  if (briefing.status === "failed") {
    return <FailedView title={briefing.title} message={briefing.errorMessage} />;
  }

  if (!briefing.payload) {
    return <FailedView title={briefing.title} message="Payload fehlt." />;
  }

  let payload: BriefingPayload;
  try {
    payload = briefingPayloadSchema.parse(JSON.parse(briefing.payload));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[briefings/[slug]] payload validation failed:", err);
    return (
      <FailedView
        title={briefing.title}
        message="Briefing ist beschaedigt oder hat ein veraltetes Format. Bitte neu erzeugen."
      />
    );
  }

  return <ReadyView title={briefing.title} payload={payload} createdAt={briefing.createdAt} />;
}

/* ─── Views ─────────────────────────────────────────────────────────── */

function ProcessingView({ title }: { title: string }) {
  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader />
        <BriefingAutoRefresh />
        <div className="pagehero__in">
          <p className="pagehero__tag">In Arbeit</p>
          <h1 className="pagehero__title">{title}</h1>
          <p className="pagehero__sub">
            Wir holen Recherche pro Termin und lassen Claude Sonnet 4.6
            synthetisieren. Das dauert etwa 15-30 Sekunden pro Termin.
          </p>
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
            Aktualisiert sich automatisch
          </div>
        </div>
      </header>
      <section className="toolpage">
        <div className="toolpage__in">
          <p style={{ color: "var(--soft)", maxWidth: "44rem" }}>
            Sobald wir fertig sind, springt die Seite automatisch in den
            Briefing-Modus. Du kannst auch jederzeit den Tab schliessen — der
            Link bleibt in deinem Dashboard.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

function FailedView({ title, message }: { title: string; message: string | null }) {
  return (
    <>
      <header className="pagehero accent--coral">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader />
        <div className="pagehero__in">
          <p className="pagehero__tag">Etwas ist schiefgegangen</p>
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
              Fehlermeldung
            </p>
            <p className="mt-3" style={{ color: "var(--ink)", lineHeight: 1.6 }}>
              {message ??
                "Wir konnten das Briefing nicht erzeugen. Versuche es nochmal, oder schreib uns."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="pill pill--ink pill--arrow">
                Zurueck zum Dashboard
              </Link>
              <Link href={`mailto:${CONTACT_EMAIL}`} className="pill pill--ghost">
                Schreib uns
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

function ReadyView({
  title: _title,
  payload,
  createdAt,
}: {
  title: string;
  payload: BriefingPayload;
  createdAt: Date | string;
}) {
  const dateLabel = formatDateHuman(payload.date);
  const generated = formatStamp(createdAt);

  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/dashboard", label: "Neues Briefing" }} />

        <div className="pagehero__in">
          <p className="pagehero__tag">Tagesbriefing</p>
          <h1 className="pagehero__title">
            <em>{dateLabel.weekday}</em>
            <br />
            {dateLabel.dayMonth}
          </h1>
          <p className="pagehero__sub">
            {payload.meetings.length === 1
              ? "Ein Termin am Tag — und alles, was du dazu wissen solltest."
              : `${payload.meetings.length} Termine am Tag, jeder mit eigener Karte. Scrollen, oben durchklicken oder Permalink teilen.`}
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
            <span>Erstellt {generated}</span>
            {payload.isMock && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: "var(--sand)" }}>Teilweise Mock-Modus</span>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          {payload.meetings.length > 1 && (
            <nav style={{ marginBottom: "clamp(2rem,3.5vw,3rem)" }}>
              <p className="mono-label">Sprung zu Termin</p>
              <ul
                className="mt-3"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
              >
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
                      {formatTime(m.startsAt)} &middot; {truncateSummary(m.summary)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(2rem,3vw,3rem)" }}>
            {payload.meetings.map((m, i) => (
              <MeetingBriefCard key={m.uid} meeting={m} index={i} />
            ))}
          </div>

          {/* Lead CTA */}
          <div
            className="grid items-center gap-6 md:grid-cols-[1.6fr_1fr]"
            style={{
              marginTop: "clamp(3rem,5vw,5rem)",
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
                Hilft das?
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
                Wenn ja: schreib uns.
              </h2>
              <p
                style={{
                  marginTop: "0.9rem",
                  color: "rgba(250,247,242,0.78)",
                  lineHeight: 1.6,
                  maxWidth: "44ch",
                }}
              >
                Wir koennen dein Limit hochsetzen, das Tool an dein Setup
                anpassen, oder ueberlegen, ob daraus eine richtige Loesung
                wird. Lab-Tools sind ein Lead-Magnet, kein SaaS.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <Link href={CONTACT_MAILTO_TAGESPLAN} className="pill pill--coral pill--arrow">
                {CONTACT_EMAIL}
              </Link>
              <Link
                href="https://labs.appsales-consulting.de"
                className="pill pill--ghost-dark"
              >
                Mehr aus den Labs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function MeetingBriefCard({ meeting, index }: { meeting: BriefingMeeting; index: number }) {
  const accent = ["coral", "petrol", "sand", "sage"][index % 4];
  const accentVar = `var(--${accent})`;
  const time = `${formatTime(meeting.startsAt)} – ${formatTime(meeting.endsAt)}`;
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
        <span
          className="font-mono text-[0.78rem] tracking-[0.12em] uppercase"
          style={{ color: accentVar }}
        >
          {time}
        </span>
        {meeting.location && (
          <span
            className="font-mono text-[0.72rem] tracking-wider uppercase"
            style={{ color: "var(--soft)" }}
          >
            {meeting.location}
          </span>
        )}
        {meeting.hints.companyGuess && (
          <span
            className="font-mono text-[0.72rem] tracking-wider uppercase"
            style={{ color: "var(--soft)" }}
          >
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
            <Block label="Wo stehen wir">
              <p className="leading-relaxed">{meeting.brief.status}</p>
            </Block>
          )}
          {meeting.brief.companyContext && (
            <Block label="Firma">
              <p className="leading-relaxed">{meeting.brief.companyContext}</p>
            </Block>
          )}
          {meeting.brief.personContext && (
            <Block label="Person">
              <p className="leading-relaxed">{meeting.brief.personContext}</p>
            </Block>
          )}
          {meeting.brief.conceptProposal && (
            <Block label="Konzept-Vorschlag" accent={accentVar}>
              <p className="leading-relaxed">{meeting.brief.conceptProposal}</p>
            </Block>
          )}
        </div>

        <aside className="space-y-7">
          {meeting.brief.talkingPoints.length > 0 && (
            <Block label="Talking Points">
              <ul className="space-y-2.5">
                {meeting.brief.talkingPoints.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 block h-2 w-2 rounded-sm flex-none"
                      style={{ background: accentVar }}
                    />
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {meeting.brief.recentNews.length > 0 && (
            <Block label="Juengste News">
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
            <Block label="Offene Fragen">
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
            <Block label="Quellen">
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

function formatDateHuman(iso: string): { weekday: string; dayMonth: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("de-DE", { weekday: "long" }),
    dayMonth: date.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function formatStamp(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("de-DE", {
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
