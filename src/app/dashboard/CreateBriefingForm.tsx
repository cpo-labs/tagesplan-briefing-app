"use client";

import { useActionState, useMemo, useState } from "react";
import { createBriefingAction, type CreateBriefingState } from "./actions";

export function CreateBriefingForm() {
  const [activeTab, setActiveTab] = useState<"ical" | "share" | "google">("ical");
  const [state, formAction, isPending] = useActionState<CreateBriefingState, FormData>(
    createBriefingAction,
    {},
  );

  const dateOptions = useMemo(() => buildDateOptions(), []);

  return (
    <div className="surface p-7 md:p-10">
      <div className="flex flex-wrap gap-2 mb-7">
        <TabPill active={activeTab === "ical"} onClick={() => setActiveTab("ical")}>
          iCal-URL
        </TabPill>
        <TabPill active={activeTab === "share"} onClick={() => setActiveTab("share")}>
          Kalender teilen
        </TabPill>
        <TabPill active={activeTab === "google"} onClick={() => setActiveTab("google")}>
          Google OAuth
        </TabPill>
      </div>

      {activeTab === "ical" && (
        <form action={formAction} className="space-y-6">
          <div className="field">
            <label htmlFor="icalUrl" className="field__label">
              iCal-URL (geheime Adresse im iCal-Format)
            </label>
            <input
              id="icalUrl"
              name="icalUrl"
              type="url"
              required
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              className="field__input"
              disabled={isPending}
            />
            <p className="field__hint">
              Google: Kalender-Einstellungen{" "}
              <span style={{ color: "var(--ink)" }}>&rsaquo;</span> Kalender integrieren{" "}
              <span style={{ color: "var(--ink)" }}>&rsaquo;</span> Geheime Adresse im
              iCal-Format. Apple und Outlook bieten das gleiche unter
              &quot;Kalender freigeben (Read-only)&quot;.
            </p>
          </div>

          <div className="field">
            <label htmlFor="date" className="field__label">
              Datum
            </label>
            <select
              id="date"
              name="date"
              required
              className="field__select"
              disabled={isPending}
              defaultValue={dateOptions[1]?.value}
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <div
              className="rounded-xl px-4 py-3 text-[0.9rem]"
              style={{
                background: "rgba(193,59,46,0.1)",
                color: "var(--coral-deep)",
                border: "1px solid rgba(193,59,46,0.25)",
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="pill pill--ink pill--arrow"
          >
            {isPending ? "Briefing wird erzeugt..." : "Briefing erzeugen"}
          </button>

          <p className="field__hint">
            Wir holen den Kalender einmalig ab, parsen die Termine fuers gewaehlte
            Datum und starten dann Recherche und Synthese. Pro Termin etwa 15-30
            Sekunden.
          </p>
        </form>
      )}

      {activeTab === "share" && <ShareTab />}
      {activeTab === "google" && <GoogleTab />}
    </div>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[0.72rem] tracking-[0.06em] uppercase px-4 py-2 rounded-full transition"
      style={{
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--cream)" : "var(--ink)",
        border: active ? "1.5px solid var(--ink)" : "1.5px solid rgba(24,20,16,0.18)",
      }}
    >
      {children}
    </button>
  );
}

function ShareTab() {
  return (
    <div>
      <p className="eyebrow">Phase 2</p>
      <h3 className="h3 mt-3">Teile deinen Google-Kalender an unsere Adresse.</h3>
      <p className="mt-4 leading-relaxed text-[0.95rem]" style={{ color: "var(--soft)" }}>
        Du kannst dein Google-Kalender mit{" "}
        <code
          className="font-mono px-1.5 py-0.5 rounded"
          style={{ background: "var(--cream-2)", color: "var(--ink)" }}
        >
          briefing@appsales-consulting.com
        </code>{" "}
        teilen (Read-only). Wir registrieren dann deinen Kalender und pollen ihn,
        wenn du ein Briefing anforderst.
      </p>
      <p className="mt-4 text-[0.88rem]" style={{ color: "var(--soft)" }}>
        Aktuell nicht im MVP — wir benachrichtigen dich, sobald das laeuft.
      </p>
    </div>
  );
}

function GoogleTab() {
  return (
    <div>
      <p className="eyebrow">Phase 2</p>
      <h3 className="h3 mt-3">Google OAuth (unverified).</h3>
      <p className="mt-4 leading-relaxed text-[0.95rem]" style={{ color: "var(--soft)" }}>
        Wir koennen dich direkt mit Google verbinden. Da unsere App nicht im
        Google-Verifikationsprozess steht, siehst du beim Login einen Warnhinweis
        und wir koennen maximal 100 Test-User aufnehmen.
      </p>
      <p className="mt-4 text-[0.88rem]" style={{ color: "var(--soft)" }}>
        Nutze fuers MVP bitte den iCal-URL-Weg.
      </p>
    </div>
  );
}

function buildDateOptions(): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label = formatLabel(d, i);
    out.push({ value, label });
  }
  return out;
}

function formatLabel(d: Date, offset: number): string {
  const human = d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  if (offset === 0) return `Heute · ${human}`;
  if (offset === 1) return `Morgen · ${human}`;
  return human;
}
