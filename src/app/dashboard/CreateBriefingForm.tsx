"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createBriefingAction, type CreateBriefingState } from "./actions";
import { CONTACT_EMAIL } from "@/lib/constants";

type Tab = "ical" | "share" | "google";

interface Props {
  initialTab?: Tab;
}

export function CreateBriefingForm({ initialTab = "ical" }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div>
      {/* Eyebrow */}
      <p className="eyebrow">Drei Wege rein</p>
      <h2
        className="mt-4"
        style={{
          fontWeight: 600,
          fontSize: "clamp(1.6rem,3vw,2.2rem)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          maxWidth: "28ch",
        }}
      >
        Wie willst du uns deinen Kalender geben?
      </h2>

      {/* Picker-Cards (always visible, click = active) */}
      <div className="calsrc-grid" style={{ marginTop: "2rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("ical")}
          className={`calsrc accent--petrol${activeTab === "ical" ? " is-active" : ""}`}
        >
          <p className="calsrc__cap">
            Variante <b>A</b>
          </p>
          <h3 className="calsrc__title">iCal-URL einkleben</h3>
          <p className="calsrc__copy">
            Geheime read-only URL aus Google, Apple oder Outlook. Schnellster
            Weg, kein OAuth-Eiertanz.
          </p>
          <span className="calsrc__meta">
            {activeTab === "ical" ? "Ausgewaehlt" : "Auswaehlen"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("share")}
          className={`calsrc accent--sand${activeTab === "share" ? " is-active" : ""}`}
        >
          <p className="calsrc__cap">
            Variante <b>B</b>
          </p>
          <h3 className="calsrc__title">Service-Mail einladen</h3>
          <p className="calsrc__copy">
            Du teilst deinen Google-Kalender read-only mit unserer Mail-Adresse.
            Wir pollen on-demand.
          </p>
          <span className="calsrc__meta">
            {activeTab === "share" ? "Ausgewaehlt" : "Anleitung"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("google")}
          className={`calsrc accent--coral${activeTab === "google" ? " is-active" : ""}`}
        >
          <p className="calsrc__cap">
            Variante <b>C</b>
          </p>
          <h3 className="calsrc__title">Mit Google verbinden</h3>
          <p className="calsrc__copy">
            OAuth-Login mit Google. Bequemster Weg, wir lesen ausschliesslich
            deine Termine.
          </p>
          <span className="calsrc__meta">
            {activeTab === "google" ? "Ausgewaehlt" : "Verbinden"}
          </span>
        </button>
      </div>

      {/* Detail-Section pro Tab */}
      <div
        style={{
          marginTop: "clamp(2rem,3vw,3rem)",
          padding: "clamp(1.6rem,2.6vw,2.4rem)",
          background: "#fff",
          border: "1px solid rgba(24,20,16,0.1)",
          borderRadius: "var(--rl)",
          boxShadow: "0 18px 40px -28px rgba(24,20,16,0.2)",
        }}
      >
        {activeTab === "ical" && <IcalTab />}
        {activeTab === "share" && <ShareTab />}
        {activeTab === "google" && <GoogleTab />}
      </div>
    </div>
  );
}

/* ─── iCal-Tab: voll funktional ────────────────────────────────────── */

function IcalTab() {
  const [state, formAction, isPending] = useActionState<CreateBriefingState, FormData>(
    createBriefingAction,
    {},
  );

  const dateOptions = useMemo(() => buildDateOptions(), []);

  return (
    <form action={formAction} className="space-y-6">
      <p className="mono-label">Variante A &middot; iCal-URL</p>
      <h3
        style={{
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "-0.02em",
          marginTop: "0.4rem",
        }}
      >
        Klebe deinen iCal-Link ein.
      </h3>

      <div className="field">
        <label htmlFor="icalUrl" className="field__label">
          iCal-URL (read-only)
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

      {state.error && <div className="notice notice--error">{state.error}</div>}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          paddingTop: "0.4rem",
        }}
      >
        <button type="submit" disabled={isPending} className="pill pill--ink pill--arrow">
          {isPending ? "Briefing wird erzeugt..." : "Briefing erzeugen"}
        </button>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--soft)",
          }}
        >
          ~15-30s pro Termin
        </span>
      </div>
    </form>
  );
}

/* ─── Share-Tab: Anleitung + Lead-Capture ──────────────────────────── */

function ShareTab() {
  return (
    <div>
      <p className="mono-label">Variante B &middot; Service-Mail</p>
      <h3
        style={{
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "-0.02em",
          marginTop: "0.4rem",
        }}
      >
        Teile deinen Google-Kalender mit unserer Service-Adresse.
      </h3>
      <p
        style={{
          marginTop: "0.8rem",
          color: "var(--soft)",
          fontSize: "0.97rem",
          lineHeight: 1.6,
          maxWidth: "44rem",
        }}
      >
        Read-only Sharing. Wir lesen die Termine on-demand, sobald du ein
        Briefing willst — keine Hintergrund-Synchronisation, keine
        Permissions ausserhalb der Kalender-Sicht.
      </p>

      <ol className="steps">
        <li className="step">
          <span className="step__num">01</span>
          <span className="step__body">
            Oeffne Google Calendar &rsaquo; <b>Einstellungen</b> &rsaquo;
            waehle deinen Hauptkalender unter &quot;Einstellungen fuer meine
            Kalender&quot;.
          </span>
        </li>
        <li className="step">
          <span className="step__num">02</span>
          <span className="step__body">
            Scroll zu <b>&quot;Fuer bestimmte Personen oder Gruppen freigeben&quot;</b>{" "}
            &rsaquo; &quot;Person hinzufuegen&quot;.
          </span>
        </li>
        <li className="step">
          <span className="step__num">03</span>
          <span className="step__body">
            Trag <code>briefing@appsales-consulting.com</code> ein. Berechtigung:{" "}
            <b>&quot;Alle Termindetails anzeigen&quot;</b> (NICHT Aenderungen
            vornehmen).
            <small>Speichern. Fertig.</small>
          </span>
        </li>
      </ol>

      <div
        className="notice notice--warn"
        style={{ maxWidth: "44rem", marginTop: "1.4rem" }}
      >
        <b>Status:</b> Die Service-Account-Pipeline ist im Code vorbereitet,
        aber der OAuth-Setup fuer das Service-Konto ist noch offen
        (Workspace-Token noch nicht ausgerollt). Trag deine Mail oben in der
        iCal-Form als Workaround ein — oder schreib uns kurz, dann
        priorisieren wir den Sync.
      </div>

      <div style={{ marginTop: "1.4rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        <Link
          href={`mailto:${CONTACT_EMAIL}?subject=Tagesplan-Briefing%20%C2%B7%20Service-Sync%20freischalten`}
          className="pill pill--ink pill--arrow"
        >
          Sync anfordern
        </Link>
      </div>
    </div>
  );
}

/* ─── Google-Tab: OAuth-Direktverbindung ───────────────────────────── */

function GoogleTab() {
  return (
    <div>
      <p className="mono-label">Variante C &middot; Google OAuth</p>
      <h3
        style={{
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "-0.02em",
          marginTop: "0.4rem",
        }}
      >
        Direkter Login mit deinem Google-Konto.
      </h3>
      <p
        style={{
          marginTop: "0.8rem",
          color: "var(--soft)",
          fontSize: "0.97rem",
          lineHeight: 1.6,
          maxWidth: "44rem",
        }}
      >
        Du klickst &quot;Mit Google verbinden&quot;, autorisierst lesenden
        Zugriff auf deinen Kalender (Scope:{" "}
        <code
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.86em",
            background: "var(--cream-2)",
            padding: "0.06em 0.34em",
            borderRadius: "5px",
            color: "var(--coral-deep)",
          }}
        >
          calendar.readonly
        </code>
        ), und wir ziehen die Termine des gewaehlten Datums.
      </p>

      <div className="notice notice--warn" style={{ marginTop: "1.4rem", maxWidth: "44rem" }}>
        <b>Hinweis:</b> Die App ist im Google-Verifikationsprozess noch nicht
        gelistet. Beim ersten Login siehst du einen &quot;Diese App ist nicht
        verifiziert&quot;-Warnhinweis. Bis 100 Test-User koennen wir
        akzeptieren.
      </div>

      <div
        className="notice notice--info"
        style={{ marginTop: "1rem", maxWidth: "44rem" }}
      >
        <b>OAuth-Setup ausstehend:</b> Die Google-Client-ID + Secret muessen
        noch in der Vercel-Umgebung hinterlegt werden. Schreib mir, ich
        rolle das auf dein Konto frei (max. 24h).
      </div>

      <div style={{ marginTop: "1.4rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
        <button
          type="button"
          disabled
          className="pill pill--ink pill--arrow"
          style={{ opacity: 0.55 }}
          title="Wird freigeschaltet, sobald OAuth-Credentials live sind"
        >
          Mit Google verbinden
        </button>
        <Link
          href={`mailto:${CONTACT_EMAIL}?subject=Tagesplan-Briefing%20%C2%B7%20Google-OAuth%20freischalten`}
          className="pill pill--ghost"
        >
          Christian schreiben
        </Link>
      </div>
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
