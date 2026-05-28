"use client";

import { useActionState } from "react";
import { sendDayPlanAction, type SendDayPlanState } from "@/app/actions/send-dayplan";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  slug: string;
  locale: Locale;
}

/**
 * Optional "email me this day-plan" control. Shown only when a briefing is
 * ready. Not a gate — purely a convenience delivery of the permalink.
 */
export function SendDayPlan({ slug, locale }: Props) {
  const dict = t(locale).result;
  const [state, formAction, isPending] = useActionState<SendDayPlanState, FormData>(
    sendDayPlanAction,
    {},
  );

  return (
    <div>
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "0.76rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--sand)",
        }}
      >
        {dict.sendTitle}
      </p>
      <p style={{ marginTop: "0.6rem", color: "rgba(250,247,242,0.78)", lineHeight: 1.6, maxWidth: "40ch" }}>
        {dict.sendText}
      </p>

      {state.ok ? (
        <p className="sendplan__done" style={{ marginTop: "1rem" }}>
          {dict.sendDone}
        </p>
      ) : (
        <form action={formAction} className="sendplan" style={{ marginTop: "1rem" }}>
          <input type="hidden" name="slug" value={slug} />
          <div className="sendplan__row">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={dict.sendPlaceholder}
              aria-label={dict.sendPlaceholder}
              className="sendplan__input"
              disabled={isPending}
            />
            <button type="submit" disabled={isPending} className="pill pill--coral pill--arrow">
              {isPending ? dict.sendPending : dict.sendButton}
            </button>
          </div>
          {state.error && <p className="sendplan__error">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
