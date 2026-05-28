import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sp = await searchParams;
  const fromTab = sp.from && ["ical", "share", "google"].includes(sp.from) ? sp.from : null;
  const callback = fromTab ? `/dashboard?from=${fromTab}` : "/dashboard";

  if (session?.user) {
    redirect(callback);
  }

  return (
    <>
      <header className="pagehero accent--sand">
        <span className="pagehero__blob" aria-hidden />
        <SiteHeader />

        <div className="pagehero__in">
          <p className="pagehero__tag">Login per Magic Link</p>
          <h1 className="pagehero__title">
            Deine <em>Mail</em>, dein Link, fertig.
          </h1>
          <p className="pagehero__sub">
            Wir schicken dir einen Login-Link. Keine Passwoerter. Der Link
            laeuft nach 15 Minuten ab.
          </p>
        </div>
      </header>

      <section className="toolpage">
        <div className="toolpage__in">
          <div
            style={{
              maxWidth: "32rem",
              padding: "clamp(1.6rem,2.4vw,2rem) clamp(1.6rem,2.4vw,2.2rem)",
              background: "#fff",
              border: "1px solid rgba(24,20,16,0.1)",
              borderRadius: "var(--rl)",
              boxShadow: "0 18px 40px -28px rgba(24,20,16,0.2)",
            }}
          >
            <LoginForm callback={callback} />
            <p
              className="mt-7"
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.55,
                color: "var(--soft)",
              }}
            >
              Mit dem Login akzeptierst du, dass wir deine Mail-Adresse
              speichern. Wir nutzen sie ausschliesslich fuer den Login und das
              Rate-Limit (3 Briefings pro Mail).
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
