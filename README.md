# Tagesplan-Briefing

Calendar in, briefing out. Auto-research per meeting via web + LinkedIn + news. Lead-magnet tool by [AppSales Labs](https://labs.appsales-consulting.de).

> Klebe deinen iCal-Link ein, waehle einen Tag, bekomme pro Termin ein Briefing: Firma, Person, juengste News, Talking Points, Konzept-Idee.

## Stack

- **Next.js 15** (App Router) + **React 19** + TypeScript
- **better-auth** mit Magic-Link-Plugin (Resend fuer Mails)
- **Turso** (libsql) + **Drizzle ORM** — lokal SQLite, produktiv Turso
- **Anthropic Claude Sonnet 4.6** fuer die Briefing-Synthese
- **Tavily** fuer Web-Recherche (Mock-Fallback wenn kein Key)
- **Tailwind 3** + handgebaute CSS-Tokens im Lab-Brand
- **pnpm** als Package Manager

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY at minimum
mkdir -p data
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000.

### Required env vars

- `ANTHROPIC_API_KEY` — sonst laeuft die Synthese im Mock-Modus
- `BETTER_AUTH_SECRET` — generieren mit `openssl rand -base64 32`

### Optional env vars (graceful fallback)

- `TAVILY_API_KEY` — ohne diesen Key wird keine Web-Recherche durchgefuehrt; das LLM bekommt nur die Kalender-Daten
- `RESEND_API_KEY` — ohne diesen Key wird der Magic-Link in die Server-Konsole gedruckt statt per Mail verschickt
- `DATABASE_URL` + `DATABASE_AUTH_TOKEN` — fuer Turso-Production. Default ist `file:./data/dev.db`

### Local-dev tip

Wenn lokal Port 3000 belegt ist (z.B. weil die Brand-Voice-App parallel laeuft), startet Next.js auf 3001. Setze dann `BETTER_AUTH_URL=http://localhost:3001` in `.env.local`, sonst zeigen die Magic-Link-URLs auf den falschen Port.

## Wie es laeuft

1. **Login** — User gibt Mail-Adresse ein, bekommt Magic Link (oder sieht ihn lokal in der Server-Konsole)
2. **iCal-URL paste** — User kopiert seine geheime iCal-URL aus Google/Apple/Outlook ins Formular und waehlt ein Datum
3. **Pipeline** — Server-Action fetched die `.ics`, parsed VEVENTs via `ical.js`, filtert auf das Datum
4. **Pro Termin (parallel, concurrency 3):**
   - Extrahiere Firma/Person/Domain-Hint aus Titel + Attendees
   - Tavily-Search: Firma allgemein, Firma News (90d), Person+Firma
   - Claude Sonnet 4.6 synthetisiert nach striktem JSON-Schema
5. **Render** — Permalink-Seite `/briefings/[slug]` mit einer Karte pro Termin

Briefings sind unter `processing` waehrend die Pipeline laeuft. Die Detail-Seite refreshed sich alle 5s, bis der Status `ready` ist.

## Architektur

```
src/
├── app/
│   ├── page.tsx              ← Landing (anti-AI-slop hero)
│   ├── login/                ← Magic-Link form
│   ├── dashboard/            ← Briefing creation + history
│   ├── briefings/[slug]/     ← Public permalink page (polls while processing)
│   ├── about/                ← How it works
│   └── api/auth/[...all]/    ← better-auth handler
├── components/
│   ├── SiteHeader.tsx
│   └── SiteFooter.tsx
└── lib/
    ├── env.ts                ← Lazy env access (Proxy)
    ├── auth.ts               ← better-auth server config
    ├── auth-client.ts        ← better-auth client (magic-link plugin)
    ├── db/
    │   ├── schema.ts         ← user/session/account/verification + briefings/runs/counters
    │   └── client.ts
    ├── calendar/
    │   └── ical.ts           ← .ics fetcher + parser, date filter
    ├── research/
    │   ├── extract.ts        ← Company/person heuristic from event
    │   ├── tavily.ts         ← Tavily API wrapper with mock fallback
    │   └── research.ts       ← Per-event research orchestration
    ├── llm/
    │   ├── anthropic.ts      ← SDK client + system prompt (anti-slop)
    │   └── synthesize.ts     ← Per-meeting brief synthesis (JSON schema)
    └── briefing/
        └── pipeline.ts       ← End-to-end: rate-limit → fetch → research → LLM → persist
```

## Rate Limits

- **3 Briefings pro Mail-Adresse** — Counter in `briefing_runs`
- **50 Briefings pro Tag global** — Counter in `daily_counters`

Beide Limits sind in `.env.local` ueber `BRIEFING_LIMIT_PER_EMAIL` und `BRIEFING_LIMIT_GLOBAL_DAILY` konfigurierbar.

## Anti-AI-Slop

Der System-Prompt fuer Claude filtert die ueblichen Tells (kein "Lass uns eintauchen", keine Em-Dash-Inflation, keine Floskeln). Zusaetzlich gibt es einen Post-Processing-Filter in `scrubSlop()`, der durchgerutschte Em-Dashes nachtraeglich ersetzt.

## Smoke-Test

```bash
# 1) Start a local .ics server
echo 'BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//
BEGIN:VEVENT
UID:e1@test
DTSTAMP:20260528T120000Z
DTSTART:20260529T080000Z
DTEND:20260529T090000Z
SUMMARY:Test Firma | Anna Schmidt
DESCRIPTION:Test-Meeting
END:VEVENT
END:VCALENDAR' > /tmp/test.ics
cd /tmp && python3 -m http.server 8765 &

# 2) Run the pipeline directly
SMOKE_ICAL_URL="http://localhost:8765/test.ics" SMOKE_DATE="2026-05-29" pnpm tsx scripts/smoke-pipeline.ts
```

## Deploy

Designed fuer Vercel. Subdomain `tagesplan.labs.appsales-consulting.de` (CNAME-Setup vom Operator). Auf der Coming-Soon-Seite unter `labs.appsales-consulting.de/tools/tagesplan-briefing/` einen Meta-Refresh-Redirect setzen, sobald das Vercel-Deployment live ist.

Production benoetigt:
- Turso DB (`DATABASE_URL=libsql://...turso.io` + `DATABASE_AUTH_TOKEN`)
- Resend (verified domain, `RESEND_API_KEY`)
- Anthropic API Key
- Tavily API Key
- Frischer `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://tagesplan.labs.appsales-consulting.de`

## Lab-Brand-Konvention

- Keine Default-Tailwind-Looks. Eigene Typo (Montserrat + JetBrains Mono), eigene Farben (Cream + Coral + Petrol + Sand + Sage).
- Keine Stock-Hero-Images — die Hero-Composition ist aus handgebauten Karten zusammengesetzt.
- Texte sind direkt und ohne Floskeln. Was nicht gesagt werden muss, wird weggelassen.

## License

MIT — see [LICENSE](LICENSE).

Built by [Christian Poral](mailto:c.poral@elunic.com) at AppSales Labs.
