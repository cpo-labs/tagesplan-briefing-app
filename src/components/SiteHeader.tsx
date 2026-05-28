import Link from "next/link";
import { LangToggle } from "@/components/LangToggle";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  /**
   * `dark`: weisser Logo-Text, transparenter Hintergrund (auf pagehero
   *   gelegt, damit die Sand-Atmosphaere durchscheint).
   * `cream`: dunkler Text auf hellem Boden — fuer Cream-Sections wie das
   *   Dashboard, das ohne Pagehero auskommt.
   */
  tone?: "dark" | "cream";
  cta?: { href: string; label: string };
  locale: Locale;
}

export function SiteHeader({ tone = "dark", cta, locale }: Props) {
  const dict = t(locale);
  return (
    <div role="banner" className={tone === "cream" ? "lnav lnav--cream" : "lnav"}>
      <Link href="/" className="lnav__brand" aria-label="AppSales Labs · Tagesplan-Briefing">
        <b>AppSales</b>
        <span className="lnav__sep">/</span>
        <span className="lnav__labs">Labs</span>
        <span className="lnav__sep">/</span>
        <span className="lnav__tool">Tagesplan</span>
      </Link>

      <nav className="lnav__links" aria-label={dict.nav.labs}>
        <Link href="https://labs.appsales-consulting.de" className="lnav__hide-sm">
          {dict.nav.labs}
        </Link>
        <Link href="/about" className="lnav__hide-sm">
          {dict.nav.how}
        </Link>
        <LangToggle locale={locale} />
        {cta && (
          <Link
            href={cta.href}
            className={tone === "cream" ? "pill pill--ink pill--arrow" : "pill pill--coral pill--arrow"}
          >
            {cta.label}
          </Link>
        )}
      </nav>
    </div>
  );
}
