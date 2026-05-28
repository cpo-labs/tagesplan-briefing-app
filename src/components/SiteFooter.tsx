import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="lfooter">
      <div className="lfooter__row">
        <span className="lfooter__brand">
          AppSales <span>Labs</span>
        </span>
        <span className="lfooter__meta">
          <Link href="https://labs.appsales-consulting.de/impressum.html">Impressum</Link>
          <span aria-hidden>&middot;</span>
          <Link href="https://labs.appsales-consulting.de/datenschutz.html">Datenschutz</Link>
          <span aria-hidden>&middot;</span>
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
          <span aria-hidden>&middot;</span>
          <span>labs.appsales-consulting.de</span>
        </span>
      </div>
    </footer>
  );
}
