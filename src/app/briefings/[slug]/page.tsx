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

  // Processing → render polling shell
  if (briefing.status === "processing") {
    return <ProcessingView title={briefing.title} />;
  }

  if (briefing.status === "failed") {
    return <FailedView title={briefing.title} message={briefing.errorMessage} />;
  }

  if (!briefing.payload) {
    return <FailedView title={briefing.title} message="Payload fehlt." />;
  }

  // Defensive parse: ein beschaedigter / migrierter Payload soll keine
  // Server-Render-Exception ausloesen — wir zeigen einen Fallback.
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
      <section
        className="grain min-h-svh flex flex-col"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader />
        <BriefingAutoRefresh />
        <div className="flex-1 flex items-center justify-center gut" style={{ padding: "5rem 0" }}>
          <div className="max-w-[36rem] text-center">
            <p className="eyebrow justify-center">In Arbeit</p>
            <h1 className="display mt-6 text-[clamp(2rem,4vw,3.6rem)]">
              {title}
            </h1>
            <p className="lead mt-5 mx-auto">
              Wir holen Recherche pro Termin und lassen Claude Sonnet 4.6 synthetisieren.
              Das dauert etwa 15-30 Sekunden pro Termin.
            </p>
            <div className="mt-9 inline-flex items-center gap-3 px-5 py-3 rounded-full font-mono text-[0.8rem] uppercase tracking-[0.1em]" style={{ background: "rgba(230,80,66,0.12)", color: "var(--coral-deep)" }}>
              <span className="dot-pulse" />
              Seite aktualisiert sich automatisch
            </div>
          </div>
        </div>
        <SiteFooter />
      </section>
    </>
  );
}

function FailedView({ title, message }: { title: string; message: string | null }) {
  return (
    <>
      <section
        className="grain min-h-svh flex flex-col"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center gut" style={{ padding: "5rem 0" }}>
          <div className="surface p-9 max-w-[40rem]">
            <p className="eyebrow" style={{ color: "var(--coral-deep)" }}>
              Etwas ist schiefgegangen
            </p>
            <h1 className="h3 mt-3">{title}</h1>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--soft)" }}>
              {message ?? "Wir konnten das Briefing nicht erzeugen. Versuche es nochmal, oder schreib Christian."}
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard" className="pill pill--ink">
                Zurueck zum Dashboard
              </Link>
              <Link href={`mailto:${CONTACT_EMAIL}`} className="pill pill--ghost">
                Christian schreiben
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </section>
    </>
  );
}

function ReadyView({
  title,
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
      <section
        className="grain"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader cta={{ href: "/dashboard", label: "Neues Briefing" }} />

        <header className="gut" style={{ padding: "4rem 0 2.5rem", maxWidth: "78rem", margin: "0 auto" }}>
          <p className="eyebrow">Tagesbriefing</p>
          <h1 className="display mt-6 text-[clamp(2.6rem,5.4vw,4.8rem)] leading-[0.95]">
            <span style={{ color: "var(--coral)" }}>{dateLabel.weekday}</span>
            <br />
            {dateLabel.dayMonth}
          </h1>
          <p className="lead mt-5">
            {payload.meetings.length === 1
              ? "Ein Termin am Tag — und alles, was du dazu wissen solltest."
              : `${payload.meetings.length} Termine am Tag, jeder mit eigener Karte. Scrollen, oben durchklicken, oder Permalink teilen.`}
          </p>
          <div
            className="mt-6 inline-flex items-center gap-3 font-mono text-[0.72rem] uppercase tracking-[0.1em]"
            style={{ color: "var(--soft)" }}
          >
            <span>Erstellt {generated}</span>
            {payload.isMock && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: "var(--sand)" }}>Teilweise Mock-Modus</span>
              </>
            )}
          </div>
        </header>

        {payload.meetings.length > 1 && (
          <nav
            className="gut"
            style={{ padding: "0 0 2rem", maxWidth: "78rem", margin: "0 auto" }}
          >
            <ul className="flex flex-wrap gap-2">
              {payload.meetings.map((m, i) => (
                <li key={m.uid}>
                  <a
                    href={`#m-${i}`}
                    className="font-mono text-[0.7rem] uppercase tracking-[0.06em] px-3.5 py-2 rounded-full transition hover:bg-ink hover:text-cream"
                    style={{
                      border: "1.5px solid rgba(24,20,16,0.18)",
                      color: "var(--ink)",
                    }}
                  >
                    {formatTime(m.startsAt)} · {truncateSummary(m.summary)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="gut" style={{ padding: "0 0 5rem", maxWidth: "78rem", margin: "0 auto" }}>
          <div className="space-y-12">
            {payload.meetings.map((m, i) => (
              <MeetingBriefCard key={m.uid} meeting={m} index={i} />
            ))}
          </div>

          {/* Lead CTA */}
          <div
            className="mt-16 p-8 md:p-10 grid gap-6 md:grid-cols-[1.6fr_1fr] items-center"
            style={{
              background: "var(--ink)",
              color: "var(--cream)",
              borderRadius: "var(--rl)",
            }}
          >
            <div>
              <p className="eyebrow" style={{ color: "var(--coral)" }}>
                Hilft das?
              </p>
              <h2 className="h2 mt-4 text-[clamp(1.6rem,3vw,2.4rem)]">
                Wenn ja: schreib mir.
              </h2>
              <p className="mt-3 text-cream/80 leading-relaxed">
                Wir koennen dein Limit hochsetzen, das Tool an dein Setup anpassen,
                oder ueberlegen ob daraus eine richtige Loesung wird. Lab-Tools
                sind ein Lead-Magnet, kein SaaS.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={CONTACT_MAILTO_TAGESPLAN}
                className="pill pill--coral pill--arrow"
              >
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

        <SiteFooter />
      </section>
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
        // override left bar color via inline style for sage/petrol/sand variants
        // (CSS classes cover the rest)
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
