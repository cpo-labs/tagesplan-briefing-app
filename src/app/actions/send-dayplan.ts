"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { briefings } from "@/lib/db/schema";
import { sendDayPlanReady } from "@/lib/email";
import { env } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

const PUBLIC_BASE = "https://tagesplan.labs.appsales-consulting.de";

export interface SendDayPlanState {
  ok?: boolean;
  error?: string;
}

/**
 * Optional delivery action: emails the permalink of a READY briefing. Only
 * exposed from the result page once status === "ready". Not a gate — purely
 * "send it to me as well".
 */
export async function sendDayPlanAction(
  _prev: SendDayPlanState,
  formData: FormData,
): Promise<SendDayPlanState> {
  const locale = await getLocale();
  const dict = t(locale);

  const schema = z.object({
    slug: z.string().min(1),
    email: z.string().trim().email(dict.errors.invalidEmail),
  });

  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? dict.errors.invalidEmail };
  }

  const rows = await db
    .select({ slug: briefings.slug, status: briefings.status })
    .from(briefings)
    .where(eq(briefings.slug, parsed.data.slug))
    .limit(1);
  const briefing = rows[0];
  if (!briefing || briefing.status !== "ready") {
    return { error: dict.errors.generic };
  }

  // Permalink aus einer vertrauenswürdigen, konfigurierten Basis bauen — NICHT
  // aus dem x-forwarded-host-Header (Header-Injection / Open-Redirect in der Mail).
  const base = (env.betterAuthUrl?.startsWith("http") ? env.betterAuthUrl : PUBLIC_BASE).replace(/\/$/, "");
  const permalink = `${base}/briefings/${briefing.slug}`;

  try {
    await sendDayPlanReady({ email: parsed.data.email, permalink, locale });
  } catch {
    return { error: dict.errors.generic };
  }

  return { ok: true };
}
