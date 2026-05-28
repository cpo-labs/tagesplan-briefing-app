/**
 * Transactional mail for the day-plan delivery. Reuses the same Resend
 * wiring pattern as the magic-link mail in auth.ts. Console-log fallback in
 * dev so the flow works without a RESEND_API_KEY.
 */

import { Resend } from "resend";
import { env } from "./env";
import { t, type Locale } from "./i18n";

const resend = env.resendKey ? new Resend(env.resendKey) : null;

export interface SendDayPlanArgs {
  email: string;
  permalink: string;
  locale: Locale;
}

export async function sendDayPlanReady({ email, permalink, locale }: SendDayPlanArgs): Promise<void> {
  const dict = t(locale).mail;

  if (!resend) {
    // Dev-only: E-Mail-Adresse ist PII und gehört nicht in Prod-Logs.
    if (!env.isProd) {
      // eslint-disable-next-line no-console
      console.log(`\n[day-plan mail] for ${email}\n  ${permalink}\n`);
    }
    return;
  }

  await resend.emails.send({
    from: env.resendFrom,
    to: email,
    subject: dict.subject,
    html: renderHtml(permalink, locale),
    text: `${dict.intro}\n\n${permalink}`,
  });
}

function renderHtml(permalink: string, locale: Locale): string {
  const dict = t(locale).mail;
  const lang = locale === "en" ? "en" : "de";
  // Inline-styled mail. No tailwind here — mail clients hate it.
  return `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:40px 20px;background:#FAF7F2;font-family:-apple-system,Segoe UI,sans-serif;color:#181410;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:22px;padding:32px;border:1px solid #EFE8DC;">
    <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#E65042;margin:0 0 16px 0;">Tagesplan-Briefing</p>
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px 0;letter-spacing:-0.02em;">${dict.heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#5C544B;margin:0 0 24px 0;">${dict.intro}</p>
    <a href="${permalink}" style="display:inline-block;background:#181410;color:#FAF7F2;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:600;font-size:14px;">${dict.button}</a>
    <p style="font-size:12px;color:#5C544B;margin:32px 0 0 0;line-height:1.5;">${dict.fallback}<br/><span style="word-break:break-all;font-family:'JetBrains Mono',monospace;font-size:11px;">${permalink}</span></p>
    <p style="font-size:11px;color:#5C544B;margin:24px 0 0 0;border-top:1px solid #EFE8DC;padding-top:16px;">${dict.footer}</p>
  </div>
</body>
</html>`;
}
