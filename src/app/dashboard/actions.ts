"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createBriefing } from "@/lib/briefing/pipeline";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export interface CreateBriefingState {
  error?: string;
}

export async function createBriefingAction(
  _prev: CreateBriefingState,
  formData: FormData,
): Promise<CreateBriefingState> {
  const locale = await getLocale();
  const dict = t(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return { error: dict.errors.notLoggedIn };
  }

  const formSchema = z.object({
    icalUrl: z.string().min(1, dict.errors.invalidUrl).url(dict.errors.invalidUrl),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, dict.errors.invalidDate),
  });

  const parsed = formSchema.safeParse({
    icalUrl: formData.get("icalUrl"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? dict.errors.invalidInput };
  }

  const result = await createBriefing({
    userId: session.user.id,
    userEmail: session.user.email.toLowerCase(),
    icalUrl: parsed.data.icalUrl,
    date: parsed.data.date,
    locale,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/briefings/${result.slug}`);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
