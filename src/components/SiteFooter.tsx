import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = t(locale);
  return (
    <footer className="lfooter">
      <div className="lfooter__row">
        <span className="lfooter__brand">
          AppSales <span>Labs</span>
        </span>
        <span className="lfooter__meta">
          <Link href="https://labs.appsales-consulting.de/impressum.html">{dict.footer.impressum}</Link>
          <span aria-hidden>&middot;</span>
          <Link href="https://labs.appsales-consulting.de/datenschutz.html">{dict.footer.datenschutz}</Link>
          <span aria-hidden>&middot;</span>
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
          <span aria-hidden>&middot;</span>
          <span>labs.appsales-consulting.de</span>
        </span>
      </div>
    </footer>
  );
}
