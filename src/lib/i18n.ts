// Client-safe Modul: KEINE next/headers-Imports (sonst landet `cookies` im
// Client-Bundle). Der Server-Reader lebt in i18n-server.ts.
export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "site_lang";

type Dict = {
  nav: {
    labs: string;
    how: string;
    login: string;
    newBriefing: string;
    signOut: string;
    back: string;
  };
  hero: {
    tag: string;
    titleBefore: string;
    titleEm: string;
    titleAfter: string;
    sub: string;
    note: string;
  };
  form: {
    eyebrow: string;
    heading: string;
    icalLabel: string;
    icalPlaceholder: string;
    icalHint: string;
    dateLabel: string;
    today: string;
    tomorrow: string;
    emailLabel: string;
    emailHint: string;
    emailPlaceholder: string;
    advancedToggle: string;
    crmLabel: string;
    crmPlaceholder: string;
    crmHint: string;
    contactMailLabel: string;
    contactMailPlaceholder: string;
    contactMailHint: string;
    submit: string;
    submitPending: string;
    timeNote: string;
  };
  ways: {
    eyebrow: string;
    heading: string;
    intro: string;
    a: { cap: string; title: string; copy: string; cta: string };
    b: { cap: string; title: string; copy: string; badge: string; cta: string };
    c: { cap: string; title: string; copy: string; cta: string };
    /** Strings unique to the new side-by-side card layout. */
    cards: {
      recommended: string;
      onRequest: string;
      copy: string;
      copied: string;
      copyFail: string;
      a: { vizCap: string; vizSettings: string; vizSecret: string; vizCopy: string };
      b: {
        addrLabel: string;
        steps: string[];
        vizCap: string;
        vizFrom: string;
        vizTo: string;
        vizInbox: string;
      };
      c: {
        bullets: string[];
        requestCta: string;
        vizCap: string;
        vizGoogle: string;
        vizTool: string;
        vizStatus: string;
      };
    };
  };
  benefits: {
    eyebrow: string;
    title: string;
    intro: string;
    items: string[];
    mock: {
      cap: string;
      tag: string;
      title: string;
      body: string;
      pointsLabel: string;
      points: string[];
    };
  };
  pipeline: {
    eyebrow: string;
    title: string;
    steps: { num: string; title: string; body: string }[];
  };
  bottomCta: {
    eyebrow: string;
    title: string;
    text: string;
    primary: string;
    secondary: string;
  };
  footer: { impressum: string; datenschutz: string };
  result: {
    processingTag: string;
    processingTitle: string;
    processingSub: string;
    autoRefresh: string;
    processingHint: string;
    pollTimeoutLabel: string;
    pollTimeoutBody: string;
    failedTag: string;
    failedLabel: string;
    failedFallback: string;
    backHome: string;
    writeUs: string;
    readyTag: string;
    summaryOne: string;
    summaryMany: (n: number) => string;
    createdAt: (stamp: string) => string;
    mockNote: string;
    jumpTo: string;
    blockStatus: string;
    blockCompany: string;
    blockPerson: string;
    blockConcept: string;
    blockTalkingPoints: string;
    blockNews: string;
    blockQuestions: string;
    blockSources: string;
    sendTitle: string;
    sendText: string;
    sendButton: string;
    sendPending: string;
    sendDone: string;
    sendPlaceholder: string;
    leadEyebrow: string;
    leadTitle: string;
    leadText: string;
    leadMore: string;
  };
  login: {
    tag: string;
    titleBefore: string;
    titleEm: string;
    titleAfter: string;
    sub: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    submitPending: string;
    sentLabel: string;
    sentTitle: string;
    sentBody: string;
    otherAddress: string;
    consent: string;
    failed: string;
  };
  errors: {
    notLoggedIn: string;
    invalidUrl: string;
    invalidDate: string;
    invalidInput: string;
    invalidEmail: string;
    generic: string;
  };
  mail: {
    subject: string;
    heading: string;
    intro: string;
    button: string;
    fallback: string;
    footer: string;
  };
};

const de: Dict = {
  nav: {
    labs: "Labs",
    how: "So funktioniert's",
    login: "Login",
    newBriefing: "Neues Briefing",
    signOut: "Abmelden",
    back: "Zurück zu Labs",
  },
  hero: {
    tag: "Werkzeug · AppSales Labs",
    titleBefore: "Wach auf, ",
    titleEm: "jeder Termin",
    titleAfter: " ist schon gebrieft.",
    sub: "Klebe deinen iCal-Link ein und du bekommst ein 1-Pager-Briefing pro Termin: Firma, Person, jüngste News, Talking Points, Konzept-Idee. Kein Login nötig — Recherche von Tavily, Synthese von Claude.",
    note: "Kostenlos · kalenderbasiert · kein Login für den iCal-Weg",
  },
  form: {
    eyebrow: "Schritt 1 · Kalender verbinden",
    heading: "Klebe deinen iCal-Link ein.",
    icalLabel: "iCal-URL (read-only)",
    icalPlaceholder: "https://calendar.google.com/calendar/ical/.../basic.ics",
    icalHint:
      "Google: Kalender-Einstellungen › Kalender integrieren › Geheime Adresse im iCal-Format. Apple und Outlook bieten das gleiche unter „Kalender freigeben (Read-only)“.",
    dateLabel: "Datum",
    today: "Heute",
    tomorrow: "Morgen",
    emailLabel: "Ergebnis per Mail (optional)",
    emailHint:
      "Nur für die Zustellung des Permalinks. Kein Newsletter, kein Tracking. Ohne Mail landest du direkt auf der Briefing-Seite.",
    emailPlaceholder: "du@firma.de",
    advancedToggle: "Optionale Felder (CRM, Kontakt-Mail)",
    crmLabel: "CRM-API-Key (optional)",
    crmPlaceholder: "z. B. HubSpot Private App Token",
    crmHint: "Wird nur gespeichert, noch nicht angebunden. Für eine spätere Integration.",
    contactMailLabel: "Kontakt-Mail pro Termin (optional)",
    contactMailPlaceholder: "kontakt@kunde.de",
    contactMailHint: "Falls du pro Termin einen festen Ansprechpartner hinterlegen willst.",
    submit: "Tagesplan erzeugen",
    submitPending: "Tagesplan wird erzeugt…",
    timeNote: "~15-30s pro Termin",
  },
  ways: {
    eyebrow: "Drei Wege rein",
    heading: "Such dir aus, wie du uns deinen Kalender gibst.",
    intro:
      "Der iCal-Link ist am schnellsten und braucht keinen Login. Service-Mail ist am sichersten, Google-OAuth am bequemsten. Alle drei landen am selben Briefing.",
    a: {
      cap: "Variante A",
      title: "iCal-URL einkleben",
      copy: "Google, Apple, Outlook — alle können eine geheime, read-only iCal-Adresse exportieren. Schnellster Weg, ohne Login.",
      cta: "Zum Formular",
    },
    b: {
      cap: "Variante B",
      title: "Service-Mail einladen",
      copy: "Du teilst deinen Google-Kalender read-only mit briefing@appsales-consulting.com. Wir verarbeiten den Posteingang regelmäßig — kein Login nötig.",
      badge: "Wir verarbeiten regelmäßig",
      cta: "Anleitung sehen",
    },
    c: {
      cap: "Variante C",
      title: "Mit Google verbinden",
      copy: "OAuth-Login mit Google. Bequemster Weg für Workspace-Nutzer. Wir lesen ausschließlich deine Termine — sonst nichts.",
      cta: "Verbinden",
    },
    cards: {
      recommended: "Empfohlen",
      onRequest: "Auf Anfrage",
      copy: "Kopieren",
      copied: "Kopiert",
      copyFail: "Manuell kopieren",
      a: {
        vizCap: "Kalender-Einstellungen",
        vizSettings: "Kalender integrieren",
        vizSecret: "Geheime Adresse im iCal-Format",
        vizCopy: "Link kopiert",
      },
      b: {
        addrLabel: "Service-Adresse",
        steps: [
          "Google-Kalender öffnen › Einstellungen › „Für bestimmte Personen freigeben“.",
          "Service-Adresse hinzufügen, Berechtigung „Alle Termindetails sehen“.",
          "Wir verarbeiten den Posteingang regelmäßig — kein Login nötig.",
        ],
        vizCap: "Kalender freigeben",
        vizFrom: "Dein Kalender",
        vizTo: "briefing@",
        vizInbox: "Eingeladen",
      },
      c: {
        bullets: [
          "OAuth-Login mit Google Workspace",
          "Wir lesen ausschließlich deine Termine",
          "Kein Schreibzugriff, kein Mail-Zugriff",
        ],
        requestCta: "Zugang anfragen",
        vizCap: "Google verbinden",
        vizGoogle: "Google Kalender",
        vizTool: "Tagesplan",
        vizStatus: "Verbunden",
      },
    },
  },
  benefits: {
    eyebrow: "Pro Termin",
    title: "Eine Karte, die du wirklich lesen willst.",
    intro:
      "Keine generischen „Hier sind 7 Punkte über das Unternehmen“-Texte. Direkte Lage-Einschätzung, drei bis fünf Anker fürs Gespräch, ein konkreter Vorschlag fürs Konzept.",
    items: [
      "Firmenkontext (Branche, Standort, Produkt)",
      "Jüngste News der letzten 90 Tage",
      "Personen-Hinweise (Rolle, Hintergrund)",
      "Konkretes Konzept für den Termin",
      "Offene Fragen vor dem Gespräch",
      "Verlinkte Quellen",
    ],
    mock: {
      cap: "10:30 · Industriehersteller",
      tag: "DACH-Service",
      title: "Wo stehen wir?",
      body: "Erstgespräch mit dem Leiter Aftermarket. Bereich wurde 2024 in eigene GmbH überführt, suchen jetzt einen Service-Daten-Layer.",
      pointsLabel: "Talking Points",
      points: [
        "Wer eigentlich hat die Service-Daten-Hoheit?",
        "Wie liefert ihr heute Wartungspakete an Kunden?",
        "SAP-Migration: blockiert oder Chance?",
      ],
    },
  },
  pipeline: {
    eyebrow: "Pipeline",
    title: "Drei Schritte zwischen Kalender und Briefing.",
    steps: [
      {
        num: "01",
        title: "Kalender holen",
        body: "iCal-Link, Service-Mail-Share oder OAuth. Wir holen die Termine für den gewählten Tag, parsen Titel und Attendees, leiten Firma und Person ab.",
      },
      {
        num: "02",
        title: "Recherche",
        body: "Tavily liefert pro Termin saubere Snippets zu Firma, jüngsten News und Person. Kein Scraping, keine Bullshit-Quellen — was reinkommt, ist verlinkbar.",
      },
      {
        num: "03",
        title: "Synthese",
        body: "Claude Sonnet 4.6 verdichtet zu einem Briefing: Status, Talking Points, Konzept-Vorschlag, offene Fragen. AI-Slop wird gefiltert.",
      },
    ],
  },
  bottomCta: {
    eyebrow: "Probier's aus",
    title: "Kalender rein, Tagesplan raus, kein Bullshit.",
    text: "Klebe deinen iCal-Link ein und erzeuge dein erstes Briefing. Kein Passwort, kein Tracking, keine Newsletter. Mail nur, wenn du das Ergebnis zugeschickt haben willst.",
    primary: "Tagesplan erzeugen",
    secondary: "Schreib uns",
  },
  footer: { impressum: "Impressum", datenschutz: "Datenschutz" },
  result: {
    processingTag: "In Arbeit",
    processingTitle: "Dein Tagesplan wird erzeugt",
    processingSub:
      "Wir holen Recherche pro Termin und lassen Claude Sonnet 4.6 synthetisieren. Das dauert etwa 15-30 Sekunden pro Termin.",
    autoRefresh: "Aktualisiert sich automatisch",
    processingHint:
      "Sobald wir fertig sind, springt die Seite automatisch in den Briefing-Modus. Du kannst auch jederzeit den Tab schließen — der Permalink bleibt erreichbar.",
    pollTimeoutLabel: "Dauert länger als erwartet",
    pollTimeoutBody:
      "Die Generierung ist noch nicht fertig oder ein Hintergrund-Job ist hängen geblieben. Bitte Seite manuell neu laden — oder schreib uns, wenn es nicht weitergeht.",
    failedTag: "Etwas ist schiefgegangen",
    failedLabel: "Fehlermeldung",
    failedFallback:
      "Wir konnten das Briefing nicht erzeugen. Versuche es nochmal, oder schreib uns.",
    backHome: "Zurück zur Startseite",
    writeUs: "Schreib uns",
    readyTag: "Tagesbriefing",
    summaryOne: "Ein Termin am Tag — und alles, was du dazu wissen solltest.",
    summaryMany: (n) =>
      `${n} Termine am Tag, jeder mit eigener Karte. Scrollen, oben durchklicken oder Permalink teilen.`,
    createdAt: (stamp) => `Erstellt ${stamp}`,
    mockNote: "Teilweise Mock-Modus",
    jumpTo: "Sprung zu Termin",
    blockStatus: "Wo stehen wir",
    blockCompany: "Firma",
    blockPerson: "Person",
    blockConcept: "Konzept-Vorschlag",
    blockTalkingPoints: "Talking Points",
    blockNews: "Jüngste News",
    blockQuestions: "Offene Fragen",
    blockSources: "Quellen",
    sendTitle: "Tagesplan per Mail",
    sendText: "Schick dir den Permalink zu, damit du ihn unterwegs parat hast.",
    sendButton: "Mail mir den Tagesplan",
    sendPending: "Schicke…",
    sendDone: "Gesendet. Schau in deine Mailbox.",
    sendPlaceholder: "du@firma.de",
    leadEyebrow: "Hilft das?",
    leadTitle: "Wenn ja: schreib uns.",
    leadText:
      "Wir können dein Limit hochsetzen, das Tool an dein Setup anpassen, oder überlegen, ob daraus eine richtige Lösung wird. Lab-Tools sind ein Lead-Magnet, kein SaaS.",
    leadMore: "Mehr aus den Labs",
  },
  login: {
    tag: "Login per Magic Link",
    titleBefore: "Deine ",
    titleEm: "Mail",
    titleAfter: ", dein Link, fertig.",
    sub: "Login ist nur für den Google-Weg und dein Dashboard nötig. Den iCal-Tagesplan bekommst du ohne Account. Wir schicken dir einen Login-Link, keine Passwörter — der Link läuft nach 15 Minuten ab.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "du@firma.de",
    submit: "Magic Link senden",
    submitPending: "Schicke Link…",
    sentLabel: "Check deine Mailbox",
    sentTitle: "Wir haben dir den Link geschickt.",
    sentBody:
      "Klick rein, du landest direkt im Dashboard. Falls er nicht in 1-2 Minuten ankommt: schau im Spam-Ordner, oder versuch's nochmal.",
    otherAddress: "Andere Adresse benutzen",
    consent:
      "Mit dem Login akzeptierst du, dass wir deine Mail-Adresse speichern. Wir nutzen sie ausschließlich für den Login und das Rate-Limit.",
    failed: "Login fehlgeschlagen.",
  },
  errors: {
    notLoggedIn: "Du bist nicht eingeloggt.",
    invalidUrl: "Das ist keine gültige iCal-URL.",
    invalidDate: "Datum ungültig.",
    invalidInput: "Eingabe ungültig.",
    invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    generic: "Etwas ist schiefgelaufen. Probier es nochmal.",
  },
  mail: {
    subject: "Dein Tagesplan-Briefing",
    heading: "Dein Tagesplan ist fertig",
    intro: "Hier ist dein Permalink. Er bleibt erreichbar, du kannst ihn teilen.",
    button: "Tagesplan öffnen",
    fallback: "Wenn der Button nicht funktioniert, kopier diesen Link in deinen Browser:",
    footer: "AppSales Labs · labs.appsales-consulting.de",
  },
};

const en: Dict = {
  nav: {
    labs: "Labs",
    how: "How it works",
    login: "Login",
    newBriefing: "New briefing",
    signOut: "Sign out",
    back: "Back to Labs",
  },
  hero: {
    tag: "Tool · AppSales Labs",
    titleBefore: "Wake up — ",
    titleEm: "every meeting",
    titleAfter: " is already briefed.",
    sub: "Paste your iCal link and get a one-pager briefing per meeting: company, person, recent news, talking points, concept idea. No login needed — research by Tavily, synthesis by Claude.",
    note: "Free · calendar-first · no login for the iCal path",
  },
  form: {
    eyebrow: "Step 1 · Connect calendar",
    heading: "Paste your iCal link.",
    icalLabel: "iCal URL (read-only)",
    icalPlaceholder: "https://calendar.google.com/calendar/ical/.../basic.ics",
    icalHint:
      "Google: Calendar settings › Integrate calendar › Secret address in iCal format. Apple and Outlook offer the same under “Share calendar (read-only)”.",
    dateLabel: "Date",
    today: "Today",
    tomorrow: "Tomorrow",
    emailLabel: "Email me the result (optional)",
    emailHint:
      "Only for delivering the permalink. No newsletter, no tracking. Without an email you land straight on the briefing page.",
    emailPlaceholder: "you@company.com",
    advancedToggle: "Optional fields (CRM, contact mail)",
    crmLabel: "CRM API key (optional)",
    crmPlaceholder: "e.g. HubSpot Private App token",
    crmHint: "Stored only, not connected yet. For a later integration.",
    contactMailLabel: "Contact mail per meeting (optional)",
    contactMailPlaceholder: "contact@client.com",
    contactMailHint: "If you want a fixed point of contact stored per meeting.",
    submit: "Generate day-plan",
    submitPending: "Generating day-plan…",
    timeNote: "~15-30s per meeting",
  },
  ways: {
    eyebrow: "Three ways in",
    heading: "Pick how you hand us your calendar.",
    intro:
      "The iCal link is fastest and needs no login. The service mail is most secure, Google OAuth most convenient. All three land at the same briefing.",
    a: {
      cap: "Option A",
      title: "Paste an iCal URL",
      copy: "Google, Apple, Outlook — all can export a secret, read-only iCal address. Fastest way, no login.",
      cta: "Go to form",
    },
    b: {
      cap: "Option B",
      title: "Invite the service mail",
      copy: "Share your Google calendar read-only with briefing@appsales-consulting.com. We process the inbox regularly — no login needed.",
      badge: "We process regularly",
      cta: "See instructions",
    },
    c: {
      cap: "Option C",
      title: "Connect with Google",
      copy: "OAuth login with Google. Most convenient for Workspace users. We read only your events — nothing else.",
      cta: "Connect",
    },
    cards: {
      recommended: "Recommended",
      onRequest: "On request",
      copy: "Copy",
      copied: "Copied",
      copyFail: "Copy manually",
      a: {
        vizCap: "Calendar settings",
        vizSettings: "Integrate calendar",
        vizSecret: "Secret address in iCal format",
        vizCopy: "Link copied",
      },
      b: {
        addrLabel: "Service address",
        steps: [
          "Open Google Calendar › Settings › “Share with specific people”.",
          "Add the service address, permission “See all event details”.",
          "We process the inbox regularly — no login needed.",
        ],
        vizCap: "Share calendar",
        vizFrom: "Your calendar",
        vizTo: "briefing@",
        vizInbox: "Invited",
      },
      c: {
        bullets: [
          "OAuth login with Google Workspace",
          "We read only your events",
          "No write access, no mail access",
        ],
        requestCta: "Request access",
        vizCap: "Connect Google",
        vizGoogle: "Google Calendar",
        vizTool: "Day-plan",
        vizStatus: "Connected",
      },
    },
  },
  benefits: {
    eyebrow: "Per meeting",
    title: "A card you actually want to read.",
    intro:
      "No generic “here are 7 points about the company” filler. A direct read on where things stand, three to five anchors for the conversation, one concrete concept proposal.",
    items: [
      "Company context (industry, location, product)",
      "Recent news from the last 90 days",
      "Person hints (role, background)",
      "A concrete concept for the meeting",
      "Open questions before the conversation",
      "Linked sources",
    ],
    mock: {
      cap: "10:30 · Industrial manufacturer",
      tag: "DACH service",
      title: "Where do we stand?",
      body: "First call with the head of aftermarket. The unit was spun into its own entity in 2024 and is now looking for a service-data layer.",
      pointsLabel: "Talking points",
      points: [
        "Who actually owns the service data?",
        "How do you deliver maintenance packages to customers today?",
        "SAP migration: blocker or opportunity?",
      ],
    },
  },
  pipeline: {
    eyebrow: "Pipeline",
    title: "Three steps between calendar and briefing.",
    steps: [
      {
        num: "01",
        title: "Fetch calendar",
        body: "iCal link, service-mail share or OAuth. We fetch the events for the chosen day, parse titles and attendees, infer company and person.",
      },
      {
        num: "02",
        title: "Research",
        body: "Tavily returns clean snippets per meeting on company, recent news and person. No scraping, no junk sources — what comes in is linkable.",
      },
      {
        num: "03",
        title: "Synthesis",
        body: "Claude Sonnet 4.6 condenses it into a briefing: status, talking points, concept proposal, open questions. AI slop gets filtered out.",
      },
    ],
  },
  bottomCta: {
    eyebrow: "Try it",
    title: "Calendar in, day-plan out, no bullshit.",
    text: "Paste your iCal link and generate your first briefing. No password, no tracking, no newsletter. Email only if you want the result sent to you.",
    primary: "Generate day-plan",
    secondary: "Get in touch",
  },
  footer: { impressum: "Imprint", datenschutz: "Privacy" },
  result: {
    processingTag: "In progress",
    processingTitle: "Generating your day-plan",
    processingSub:
      "We're fetching research per meeting and letting Claude Sonnet 4.6 synthesize. That takes about 15-30 seconds per meeting.",
    autoRefresh: "Refreshes automatically",
    processingHint:
      "As soon as we're done, the page flips into briefing mode automatically. You can close the tab anytime — the permalink stays reachable.",
    pollTimeoutLabel: "Taking longer than expected",
    pollTimeoutBody:
      "Generation isn't finished yet or a background job got stuck. Please reload the page manually — or drop us a line if it won't move.",
    failedTag: "Something went wrong",
    failedLabel: "Error message",
    failedFallback: "We couldn't generate the briefing. Try again, or drop us a line.",
    backHome: "Back to home",
    writeUs: "Get in touch",
    readyTag: "Day briefing",
    summaryOne: "One meeting today — and everything you should know about it.",
    summaryMany: (n) =>
      `${n} meetings today, each with its own card. Scroll, jump from the top, or share the permalink.`,
    createdAt: (stamp) => `Created ${stamp}`,
    mockNote: "Partial mock mode",
    jumpTo: "Jump to meeting",
    blockStatus: "Where we stand",
    blockCompany: "Company",
    blockPerson: "Person",
    blockConcept: "Concept proposal",
    blockTalkingPoints: "Talking points",
    blockNews: "Recent news",
    blockQuestions: "Open questions",
    blockSources: "Sources",
    sendTitle: "Day-plan by email",
    sendText: "Send yourself the permalink so you have it handy on the go.",
    sendButton: "Email me the day-plan",
    sendPending: "Sending…",
    sendDone: "Sent. Check your mailbox.",
    sendPlaceholder: "you@company.com",
    leadEyebrow: "Does this help?",
    leadTitle: "If so: get in touch.",
    leadText:
      "We can raise your limit, adapt the tool to your setup, or think about whether it should become a real solution. Lab tools are a lead magnet, not a SaaS.",
    leadMore: "More from the Labs",
  },
  login: {
    tag: "Login via magic link",
    titleBefore: "Your ",
    titleEm: "email",
    titleAfter: ", your link, done.",
    sub: "Login is only needed for the Google path and your dashboard. You get the iCal day-plan without an account. We send you a login link, no passwords — the link expires after 15 minutes.",
    emailLabel: "Email address",
    emailPlaceholder: "you@company.com",
    submit: "Send magic link",
    submitPending: "Sending link…",
    sentLabel: "Check your mailbox",
    sentTitle: "We've sent you the link.",
    sentBody:
      "Click it and you land straight in the dashboard. If it doesn't arrive within 1-2 minutes: check spam, or try again.",
    otherAddress: "Use a different address",
    consent:
      "By logging in you accept that we store your email address. We use it only for login and the rate limit.",
    failed: "Login failed.",
  },
  errors: {
    notLoggedIn: "You're not logged in.",
    invalidUrl: "That's not a valid iCal URL.",
    invalidDate: "Invalid date.",
    invalidInput: "Invalid input.",
    invalidEmail: "Please enter a valid email address.",
    generic: "Something went wrong. Please try again.",
  },
  mail: {
    subject: "Your day-plan briefing",
    heading: "Your day-plan is ready",
    intro: "Here's your permalink. It stays reachable and you can share it.",
    button: "Open day-plan",
    fallback: "If the button doesn't work, copy this link into your browser:",
    footer: "AppSales Labs · labs.appsales-consulting.de",
  },
};

const dictionaries: Record<Locale, Dict> = { de, en };

export function t(locale: Locale): Dict {
  return dictionaries[locale];
}
