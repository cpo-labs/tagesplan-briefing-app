import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const locale = await getLocale();
  const dict = t(locale);

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
        <SiteHeader locale={locale} />

        <div className="pagehero__in">
          <p className="pagehero__tag">{dict.login.tag}</p>
          <h1 className="pagehero__title">
            {dict.login.titleBefore}
            <em>{dict.login.titleEm}</em>
            {dict.login.titleAfter}
          </h1>
          <p className="pagehero__sub">{dict.login.sub}</p>
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
            <LoginForm callback={callback} locale={locale} />
            <p
              className="mt-7"
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.55,
                color: "var(--soft)",
              }}
            >
              {dict.login.consent}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </>
  );
}
