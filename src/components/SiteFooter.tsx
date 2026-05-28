import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "3rem var(--gut) 2.4rem",
        background: "var(--ink-deep)",
        color: "var(--cream)",
      }}
      className="text-[0.9rem]"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <p className="mono-label" style={{ color: "var(--coral)" }}>
            Tagesplan-Briefing
          </p>
          <p className="mt-3 text-cream/70 leading-relaxed">
            Ein freies Tool aus den AppSales Labs. Aufgebaut von Christian Poral.
            Quellcode auf GitHub.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-cream/60 font-mono text-[0.72rem] tracking-[0.08em] uppercase">
          <Link href="https://labs.appsales-consulting.de" className="hover:text-coral transition">
            Labs
          </Link>
          <Link href="https://github.com/cpo-labs/tagesplan-briefing-app" className="hover:text-coral transition">
            GitHub
          </Link>
          <Link href="https://appsales-consulting.de" className="hover:text-coral transition">
            AppSales
          </Link>
          <Link href={`mailto:${CONTACT_EMAIL}`} className="hover:text-coral transition">
            Kontakt
          </Link>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-cream/12 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-cream/45 font-mono text-[0.7rem] tracking-[0.06em]">
        <span>{new Date().getFullYear()} AppSales Consulting GmbH</span>
        <span>labs.appsales-consulting.de</span>
      </div>
    </footer>
  );
}
