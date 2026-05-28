import Link from "next/link";

interface Props {
  dark?: boolean;
  cta?: { href: string; label: string };
}

export function SiteHeader({ dark = false, cta }: Props) {
  const linkClass = dark
    ? "text-cream/70 hover:text-coral transition"
    : "text-ink/65 hover:text-coral transition";
  const sepClass = dark ? "text-cream/35" : "text-ink/30";

  return (
    <header
      className="flex items-center justify-between"
      style={{
        padding: "1.5rem var(--gut)",
        color: dark ? "var(--cream)" : "var(--ink)",
      }}
    >
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="text-[1.05rem]">AppSales</span>
        <span className={`text-[1.2rem] font-light ${sepClass}`}>/</span>
        <span className="text-coral text-[1.05rem]">Labs</span>
        <span className={`text-[1.2rem] font-light ${sepClass}`}>/</span>
        <span className="text-[1.05rem]">Tagesplan</span>
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="https://labs.appsales-consulting.de"
          className={`font-mono text-[0.72rem] tracking-[0.06em] uppercase ${linkClass}`}
        >
          Labs
        </Link>
        <Link
          href="/about"
          className={`font-mono text-[0.72rem] tracking-[0.06em] uppercase ${linkClass}`}
        >
          So funktioniert&apos;s
        </Link>
        {cta && (
          <Link
            href={cta.href}
            className={dark ? "pill pill--ghost-dark pill--arrow" : "pill pill--ink pill--arrow"}
          >
            {cta.label}
          </Link>
        )}
      </nav>
    </header>
  );
}
