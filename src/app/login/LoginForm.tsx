"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface Props {
  callback?: string;
}

export function LoginForm({ callback = "/dashboard" }: Props) {
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
        setError(err.message || "Login fehlgeschlagen.");
        return;
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen.");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <p
          className="font-mono text-[0.72rem] tracking-[0.12em] uppercase"
          style={{ color: "var(--petrol)" }}
        >
          Check deine Mailbox
        </p>
        <h3 className="h3 mt-3">Wir haben dir den Link geschickt.</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: "var(--soft)" }}>
          An <b>{email}</b>. Klick rein, du landest direkt im Dashboard. Falls
          er nicht in 1-2 Minuten ankommt: schau im Spam-Ordner, oder
          versuch&apos;s nochmal.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-[0.85rem] underline decoration-2 underline-offset-4"
          style={{ color: "var(--coral)" }}
        >
          Andere Adresse benutzen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="field">
        <label htmlFor="email" className="field__label">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@firma.de"
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
        {status === "sending" ? "Schicke Link..." : "Magic Link senden"}
      </button>
    </form>
  );
}
