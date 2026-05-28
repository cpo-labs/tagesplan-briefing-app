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
import { CreateBriefingForm } from "./CreateBriefingForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    redirect("/login");
  }

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
      <section
        className="grain min-h-svh flex flex-col"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <SiteHeader />

        <div className="gut" style={{ padding: "3rem 0 4rem" }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="eyebrow">Dein Schreibtisch</p>
              <h1 className="display text-[clamp(2.4rem,5vw,4.4rem)] mt-5 leading-none">
                Neues <em style={{ color: "var(--coral)", fontStyle: "normal" }}>Briefing</em>
              </h1>
              <p className="lead mt-4">
                Eingeloggt als <span style={{ color: "var(--ink)", fontWeight: 600 }}>{email}</span>.
                Noch <span style={{ color: "var(--coral)", fontWeight: 600 }}>{remaining}</span>{" "}
                von <span style={{ color: "var(--ink)" }}>{env.limitPerEmail}</span> Briefings frei.
              </p>
            </div>
            <form action="/api/sign-out" method="post">
              <Link
                href="/api/sign-out"
                className="font-mono text-[0.72rem] tracking-[0.1em] uppercase hover:text-coral transition"
                style={{ color: "var(--soft)" }}
              >
                Abmelden
              </Link>
            </form>
          </div>

          {remaining > 0 ? (
            <CreateBriefingForm />
          ) : (
            <RateLimitedCard />
          )}

          {past.length > 0 && (
            <section className="mt-16">
              <h2 className="h3">Frueher generiert</h2>
              <ul className="mt-6 space-y-3">
                {past.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/briefings/${b.slug}`}
                      className="surface flex items-center justify-between px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-32px_rgba(24,20,16,0.3)]"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1rem]">{b.title}</span>
                        <span className="font-mono text-[0.7rem] uppercase tracking-wider text-soft">
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

        <SiteFooter />
      </section>
    </>
  );
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
        href="mailto:c.poral@elunic.com?subject=Tagesplan-Briefing%20%C2%B7%20mehr%20Briefings"
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
