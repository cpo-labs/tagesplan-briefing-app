"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createBriefing } from "@/lib/briefing/pipeline";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export interface PublicBriefingState {
  error?: string;
}

/**
 * PUBLIC briefing action — NO session requirement. This is the barrier-free
 * iCal path: paste a calendar URL, optionally an email for delivery, done.
 * The email is for delivery only, never a gate.
 */
export async function createBriefingPublicAction(
  _prev: PublicBriefingState,
  formData: FormData,
): Promise<PublicBriefingState> {
  const locale = await getLocale();
  const dict = t(locale);

  // Honeypot: bots fill hidden fields. If present, pretend success but no-op.
  const honeypot = formData.get("company_website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { error: dict.errors.generic };
  }

  const schema = z.object({
    icalUrl: z.string().min(1, dict.errors.invalidUrl).url(dict.errors.invalidUrl),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, dict.errors.invalidDate),
    email: z
      .string()
      .trim()
      .email(dict.errors.invalidEmail)
      .optional()
      .or(z.literal("")),
  });

  const parsed = schema.safeParse({
    icalUrl: formData.get("icalUrl"),
    date: formData.get("date"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? dict.errors.invalidInput };
  }

  const email = parsed.data.email && parsed.data.email.length > 0 ? parsed.data.email : null;

  const result = await createBriefing({
    userId: null,
    userEmail: email,
    icalUrl: parsed.data.icalUrl,
    date: parsed.data.date,
    locale,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/briefings/${result.slug}`);
}
