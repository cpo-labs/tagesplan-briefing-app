"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Email-Gate in der Hero-Section: kurzer Flow ohne extra Login-Seite.
 * Submit → schickt Magic-Link → confirmation inline. Erfahrene Nutzer
 * koennen ueber die Calendar-Cards darunter direkt zu /login springen.
 */
export function LandingEmailGate() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setError("");

    try {
      const { error: err } = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL: "/dashboard",
      });
      if (err) {
        setStatus("error");
        setError(err.message || "Konnten Link nicht schicken.");
        return;
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Konnten Link nicht schicken.");
    }
  }

  if (status === "sent") {
    return (
      <div
        style={{
          background: "rgba(250,247,242,0.08)",
          border: "1.5px solid rgba(250,247,242,0.24)",
          borderRadius: "var(--rm)",
          padding: "1.2rem 1.4rem",
          color: "var(--cream)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--sand)",
            marginBottom: "0.4rem",
          }}
        >
          Check deine Mailbox
        </p>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.55 }}>
          Wir haben dir einen Login-Link an{" "}
          <b>{email}</b> geschickt. Klick rein, und du bist im Dashboard.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
          style={{
            marginTop: "0.7rem",
            fontFamily: "var(--mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "transparent",
            border: "none",
            color: "var(--sand)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Andere Adresse
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "0.5rem",
          background: "rgba(250,247,242,0.06)",
          border: "1.5px solid rgba(250,247,242,0.22)",
          borderRadius: "100px",
          padding: "0.32rem 0.4rem 0.32rem 1.2rem",
          alignItems: "center",
          transition: "border-color 0.2s var(--ease), background 0.2s var(--ease)",
        }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="deine@firma.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sending"}
          aria-label="E-Mail-Adresse"
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--cream)",
            fontFamily: "var(--font)",
            fontSize: "1rem",
            padding: "0.6rem 0",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "sending" || !email.trim()}
          className="pill pill--coral pill--arrow"
          style={{ padding: "0.7rem 1.3rem", fontSize: "0.9rem" }}
        >
          {status === "sending" ? "Schicke..." : "Briefing starten"}
        </button>
      </div>
      {error && (
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.74rem",
            color: "#F19E94",
            marginTop: "0.2rem",
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
