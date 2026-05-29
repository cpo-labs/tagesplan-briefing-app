import { CalendarForm } from "./calendar-form";
import { t, type Locale } from "@/lib/i18n";

/**
 * Card A — the working iCal path. Carries the real {@link CalendarForm}
 * (which posts to the public action, untouched) plus a hand-built, hover-reactive
 * illustration of "how to get the iCal link": a mock calendar-settings panel
 * whose secret-address row pulses idle and snaps into a "copied" state on hover.
 */
export function WayIcalCard({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const c = dict.ways.cards;

  return (
    <article className="calway calway--primary accent--petrol" id="calendar-form">
      <span className="calway__badge">{c.recommended}</span>
      <p className="calway__cap">
        <CapLabel cap={dict.ways.a.cap} />
      </p>
      <h3 className="calway__title">{dict.ways.a.title}</h3>
      <p className="calway__copy">{dict.ways.a.copy}</p>

      {/* Hand-built visual: calendar-settings → highlighted secret iCal row */}
      <div className="calviz" aria-hidden>
        <span className="calviz__orb" />
        <div className="calviz__panel calviz__panel--ical">
          <div className="calviz__cap">
            <span className="calviz__dot" />
            {c.a.vizCap}
          </div>
          <div className="calviz__line">
            <span className="calviz__ico" />
            <span className="calviz__txt calviz__txt--mute">{c.a.vizSettings}</span>
          </div>
          <div className="calviz__line calviz__line--secret">
            <span className="calviz__ico calviz__ico--key" />
            <span className="calviz__txt">{c.a.vizSecret}</span>
            <span className="calviz__chip">{c.a.vizCopy}</span>
          </div>
          <div className="calviz__url">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>

      <div className="calway__body">
        <CalendarForm locale={locale} />
      </div>
    </article>
  );
}

/** Renders "Variante A" / "Option A" with the trailing letter bolded. */
function CapLabel({ cap }: { cap: string }) {
  const idx = cap.lastIndexOf(" ");
  if (idx < 0) return <>{cap}</>;
  return (
    <>
      {cap.slice(0, idx)} <b>{cap.slice(idx + 1)}</b>
    </>
  );
}
