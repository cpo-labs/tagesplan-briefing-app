import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db/client";
import { env } from "./env";

const resend = env.resendKey ? new Resend(env.resendKey) : null;

/**
 * Send a magic-link mail. Falls back to console.log so local dev works
 * without a Resend account — the link is printed so the operator can
 * paste it into the browser.
 */
async function sendMagicLink({ email, url }: { email: string; url: string }) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`\n[magic-link] for ${email}\n  ${url}\n`);
    return;
  }

  await resend.emails.send({
    from: env.resendFrom,
    to: email,
    subject: "Dein Login fuer Tagesplan-Briefing",
    html: renderMagicLinkHtml(url),
    text: `Klick zum Einloggen: ${url}\n\nDieser Link laeuft in 15 Minuten ab.`,
  });
}

function renderMagicLinkHtml(url: string): string {
  // Inline-styled mail. No tailwind here — mail clients hate it.
  return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:40px 20px;background:#FAF7F2;font-family:-apple-system,Segoe UI,sans-serif;color:#181410;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:22px;padding:32px;border:1px solid #EFE8DC;">
    <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#E65042;margin:0 0 16px 0;">Tagesplan-Briefing</p>
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px 0;letter-spacing:-0.02em;">Dein Login</h1>
    <p style="font-size:15px;line-height:1.6;color:#5C544B;margin:0 0 24px 0;">Klick auf den Button, um dich einzuloggen. Der Link laeuft in 15 Minuten ab.</p>
    <a href="${url}" style="display:inline-block;background:#181410;color:#FAF7F2;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:600;font-size:14px;">Einloggen</a>
    <p style="font-size:12px;color:#5C544B;margin:32px 0 0 0;line-height:1.5;">Wenn der Button nicht funktioniert, kopier diesen Link in deinen Browser:<br/><span style="word-break:break-all;font-family:'JetBrains Mono',monospace;font-size:11px;">${url}</span></p>
    <p style="font-size:11px;color:#5C544B;margin:24px 0 0 0;border-top:1px solid #EFE8DC;padding-top:16px;">AppSales Labs &middot; labs.appsales-consulting.de</p>
  </div>
</body>
</html>`;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink({ email, url });
      },
      expiresIn: 60 * 15, // 15 minutes
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
