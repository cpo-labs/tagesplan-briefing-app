import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { briefings, briefingRuns } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/constants";
import { CreateBriefingForm } from "./CreateBriefingForm";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    redirect("/login");
  }

  const sp = await searchParams;
  const initialTab = parseTab(sp.from);

  const email = session.user.email.toLowerCase();
  const past = await db
    .select()
    .from(briefings)
    .where(eq(briefings.userEmail, email))
    .orderBy(desc(briefings.createdAt))
    .limit(20);

  const runs = await db.select().from(briefingRuns).where(eq(briefingRuns.userEmail, email));
  const used = runs.filter((r) => r.succeeded).length;
  const remaining = Math.max(0, env.limitPerEmail - used);

  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader cta={{ href: "/api/sign-out", label: "Abmelden" }} />

        <div className="pagehero__in">
          <p className="pagehero__tag">Dein Schreibtisch</p>
          <h1 className="pagehero__title">
            Neues <em>Briefing</em>
          </h1>
          <p className="pagehero__sub">
            Eingeloggt als{" "}
            <b style={{ color: "var(--cream)" }}>{email}</b>. Noch{" "}
            <b style={{ color: "var(--sand)" }}>{remaining}</b> von{" "}
            <b>{env.limitPerEmail}</b> Briefings frei.
          </p>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          {remaining > 0 ? (
            <CreateBriefingForm initialTab={initialTab} />
          ) : (
            <RateLimitedCard />
          )}

          {past.length > 0 && (
            <section style={{ marginTop: "clamp(3rem, 6vw, 5rem)" }}>
              <p className="eyebrow">Frueher generiert</p>
              <h2
                className="mt-4"
                style={{
                  fontWeight: 600,
                  fontSize: "clamp(1.4rem,2.4vw,1.8rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                Deine Briefings
              </h2>
              <ul className="mt-7 space-y-3">
                {past.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/briefings/${b.slug}`}
                      className="surface flex items-center justify-between px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-32px_rgba(24,20,16,0.3)]"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1rem]">{b.title}</span>
                        <span
                          className="font-mono text-[0.7rem] uppercase tracking-wider"
                          style={{ color: "var(--soft)" }}
                        >
                          {formatDate(b.createdAt)} &middot; Status: {b.status}
                        </span>
                      </div>
                      <span
                        className="font-mono text-[0.65rem] uppercase tracking-wider px-3 py-1 rounded-full"
                        style={statusStyle(b.status)}
                      >
                        {b.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function parseTab(raw: string | undefined): "ical" | "share" | "google" {
  if (raw === "share" || raw === "google") return raw;
  return "ical";
}

function RateLimitedCard() {
  return (
    <div className="surface p-9 max-w-[44rem]">
      <p className="eyebrow">Limit erreicht</p>
      <h2 className="h3 mt-4">Du hast deine drei Briefings verbraucht.</h2>
      <p className="mt-4 leading-relaxed" style={{ color: "var(--soft)" }}>
        Wenn du das Tool oefter brauchst, schreib mir kurz. Wir koennen entweder dein
        Limit hochsetzen oder ueberlegen, ob daraus eine richtige Loesung wird.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=Tagesplan-Briefing%20%C2%B7%20mehr%20Briefings`}
        className="pill pill--coral pill--arrow mt-7"
      >
        Christian schreiben
      </a>
    </div>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "ready") return { background: "rgba(31,110,104,0.14)", color: "var(--petrol)" };
  if (status === "failed") return { background: "rgba(193,59,46,0.14)", color: "var(--coral-deep)" };
  return { background: "rgba(221,161,59,0.14)", color: "var(--sand)" };
}
