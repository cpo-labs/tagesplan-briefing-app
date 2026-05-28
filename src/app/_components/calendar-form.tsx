"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createBriefingPublicAction,
  type PublicBriefingState,
} from "@/app/actions/create-briefing";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  locale: Locale;
}

/**
 * Barrier-free calendar entry. iCal URL + date + optional delivery email +
 * optional CRM/contact fields. Posts to the PUBLIC action — no login. The
 * email is for delivery only, never a gate.
 */
export function CalendarForm({ locale }: Props) {
  const dict = t(locale).form;
  const [state, formAction, isPending] = useActionState<PublicBriefingState, FormData>(
    createBriefingPublicAction,
    {},
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(locale, dict.today, dict.tomorrow), [
    locale,
    dict.today,
    dict.tomorrow,
  ]);

  return (
    <form action={formAction} className="calform" id="calendar-form">
      <p className="eyebrow">{dict.eyebrow}</p>
      <h2 className="calform__heading">{dict.heading}</h2>

      {/* Honeypot — kept off-screen, real users never fill it. */}
      <div aria-hidden className="calform__honeypot">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="icalUrl" className="field__label">
          {dict.icalLabel}
        </label>
        <input
          id="icalUrl"
          name="icalUrl"
          type="url"
          required
          inputMode="url"
          placeholder={dict.icalPlaceholder}
          className="field__input"
          disabled={isPending}
        />
        <p className="field__hint">{dict.icalHint}</p>
      </div>

      <div className="field">
        <label htmlFor="date" className="field__label">
          {dict.dateLabel}
        </label>
        <select
          id="date"
          name="date"
          required
          className="field__select"
          disabled={isPending}
          defaultValue={dateOptions[0]?.value}
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="email" className="field__label">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={dict.emailPlaceholder}
          className="field__input"
          disabled={isPending}
        />
        <p className="field__hint">{dict.emailHint}</p>
      </div>

      <button
        type="button"
        className="calform__advanced-toggle"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced((v) => !v)}
      >
        <span aria-hidden>{showAdvanced ? "–" : "+"}</span> {dict.advancedToggle}
      </button>

      {showAdvanced && (
        <div className="calform__advanced">
          <div className="field">
            <label htmlFor="crmApiKey" className="field__label">
              {dict.crmLabel}
            </label>
            <input
              id="crmApiKey"
              name="crmApiKey"
              type="text"
              autoComplete="off"
              placeholder={dict.crmPlaceholder}
              className="field__input"
              disabled={isPending}
            />
            <p className="field__hint">{dict.crmHint}</p>
          </div>
          <div className="field">
            <label htmlFor="contactMail" className="field__label">
              {dict.contactMailLabel}
            </label>
            <input
              id="contactMail"
              name="contactMail"
              type="email"
              autoComplete="off"
              placeholder={dict.contactMailPlaceholder}
              className="field__input"
              disabled={isPending}
            />
            <p className="field__hint">{dict.contactMailHint}</p>
          </div>
        </div>
      )}

      {state.error && (
        <div className="notice notice--error" role="alert">
          {state.error}
        </div>
      )}

      <div className="calform__submit-row">
        <button type="submit" disabled={isPending} className="pill pill--coral pill--arrow">
          {isPending ? dict.submitPending : dict.submit}
        </button>
        <span className="calform__time-note">{dict.timeNote}</span>
      </div>
    </form>
  );
}

function buildDateOptions(
  locale: Locale,
  todayLabel: string,
  tomorrowLabel: string,
): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  const intlLocale = locale === "en" ? "en-GB" : "de-DE";
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const human = d.toLocaleDateString(intlLocale, {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    let label = human;
    if (i === 0) label = `${todayLabel} · ${human}`;
    else if (i === 1) label = `${tomorrowLabel} · ${human}`;
    out.push({ value, label });
  }
  return out;
}
