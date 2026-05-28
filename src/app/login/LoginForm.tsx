"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  callback?: string;
  locale: Locale;
}

export function LoginForm({ callback = "/dashboard", locale }: Props) {
  const dict = t(locale).login;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const { error: err } = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL: callback,
      });

      if (err) {
        setStatus("error");
        setError(err.message || dict.failed);
        return;
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : dict.failed);
    }
  }

  if (status === "sent") {
    return (
      <div>
        <p
          className="font-mono text-[0.72rem] tracking-[0.12em] uppercase"
          style={{ color: "var(--petrol)" }}
        >
          {dict.sentLabel}
        </p>
        <h3 className="h3 mt-3">{dict.sentTitle}</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: "var(--soft)" }}>
          <b>{email}</b> — {dict.sentBody}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-[0.85rem] underline decoration-2 underline-offset-4"
          style={{ color: "var(--coral)" }}
        >
          {dict.otherAddress}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="field">
        <label htmlFor="email" className="field__label">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.emailPlaceholder}
          className="field__input"
          disabled={status === "sending"}
        />
        {error && <p className="field__error">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={status === "sending" || !email.trim()}
        className="pill pill--ink pill--arrow w-full justify-center"
      >
        {status === "sending" ? dict.submitPending : dict.submit}
      </button>
    </form>
  );
}
