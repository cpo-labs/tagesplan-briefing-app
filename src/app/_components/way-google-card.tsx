import Link from "next/link";
import { CONTACT_MAILTO_TAGESPLAN } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";

/**
 * Card C — Google OAuth. NOT wired yet, so it's presented honestly with an
 * "Auf Anfrage" badge and a contact mailto (no fake /login?from=google link).
 * Hand-built visual: two nodes (Google ⟷ day-plan) whose link draws itself idle
 * and locks into a "connected" status on hover.
 */
export function WayGoogleCard({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const c = dict.ways.cards;

  return (
    <article className="calway accent--coral">
      <span className="calway__soon">{c.onRequest}</span>
      <p className="calway__cap">
        <CapLabel cap={dict.ways.c.cap} />
      </p>
      <h3 className="calway__title">{dict.ways.c.title}</h3>
      <p className="calway__copy">{dict.ways.c.copy}</p>

      {/* Hand-built visual: Google node ⟷ day-plan node, self-drawing link */}
      <div className="calviz" aria-hidden>
        <span className="calviz__orb" />
        <div className="calviz__connect">
          <span className="calviz__token calviz__token--g">{c.c.vizGoogle}</span>
          <span className="calviz__link">
            <i />
          </span>
          <span className="calviz__token calviz__token--t">{c.c.vizTool}</span>
          <span className="calviz__status">{c.c.vizStatus}</span>
        </div>
      </div>

      <div className="calway__body">
        <ul className="calway__bullets">
          {c.c.bullets.map((b, i) => (
            <li key={i}>
              <span className="calway__tick" aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <Link href={CONTACT_MAILTO_TAGESPLAN} className="pill pill--ghost calway__cta">
          {c.c.requestCta}
        </Link>
      </div>
    </article>
  );
}

function CapLabel({ cap }: { cap: string }) {
  const idx = cap.lastIndexOf(" ");
  if (idx < 0) return <>{cap}</>;
  return (
    <>
      {cap.slice(0, idx)} <b>{cap.slice(idx + 1)}</b>
    </>
  );
}
