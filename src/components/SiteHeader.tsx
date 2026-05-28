import Link from "next/link";

interface Props {
  /**
   * `dark`: weisser Logo-Text, transparenter Hintergrund (auf pagehero
   *   gelegt, damit die Sand-Atmosphaere durchscheint).
   * `cream`: dunkler Text auf hellem Boden — fuer Cream-Sections wie das
   *   Dashboard, das ohne Pagehero auskommt.
   */
  tone?: "dark" | "cream";
  cta?: { href: string; label: string };
}

export function SiteHeader({ tone = "dark", cta }: Props) {
  return (
    <div
      role="banner"
      className={tone === "cream" ? "lnav lnav--cream" : "lnav"}
    >
      <Link href="/" className="lnav__brand" aria-label="AppSales Labs · Tagesplan-Briefing">
        <b>AppSales</b>
        <span className="lnav__sep">/</span>
        <span className="lnav__labs">Labs</span>
        <span className="lnav__sep">/</span>
        <span className="lnav__tool">Tagesplan</span>
      </Link>

      <nav className="lnav__links">
        <Link href="https://labs.appsales-consulting.de" className="lnav__hide-sm">
          Labs
        </Link>
        <Link href="/about" className="lnav__hide-sm">
          So funktioniert&apos;s
        </Link>
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
