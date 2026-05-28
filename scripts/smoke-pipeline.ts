/**
 * Smoke test for the briefing pipeline. Runs the iCal-fetch + research +
 * synthesise path against a local .ics URL without going through better-auth.
 * Usage: pnpm tsx scripts/smoke-pipeline.ts
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { nanoid } from "nanoid";
import { db } from "../src/lib/db/client";
import { user as userTable } from "../src/lib/db/schema";
import { createBriefing } from "../src/lib/briefing/pipeline";

async function main() {
  const id = nanoid();
  const email = `smoke-${Date.now()}@example.com`;
  await db.insert(userTable).values({
    id,
    email,
    name: "Smoke Test",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const icalUrl = process.env.SMOKE_ICAL_URL ?? "http://localhost:8765/test.ics";
  const date = process.env.SMOKE_DATE ?? new Date(Date.now() + 86400_000).toISOString().slice(0, 10);

  process.stdout.write(`-> creating briefing for ${email} on ${date}\n`);
  const res = await createBriefing({
    userId: id,
    userEmail: email,
    icalUrl,
    date,
  });

  if (!res.ok) {
    process.stdout.write(`FAILED: ${res.error} (${res.code})\n`);
    process.exit(1);
  }

  process.stdout.write(`OK: ${res.briefingId} (/briefings/${res.slug})\n`);

  // Poll for completion
  const { eq } = await import("drizzle-orm");
  const { briefings } = await import("../src/lib/db/schema");
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const rows = await db.select().from(briefings).where(eq(briefings.id, res.briefingId));
    const row = rows[0];
    process.stdout.write(`   [${i}] status=${row?.status}\n`);
    if (row?.status === "ready") {
      process.stdout.write("DONE\n");
      const payload = JSON.parse(row.payload!);
      process.stdout.write(`meetings: ${payload.meetings.length}\n`);
      process.stdout.write(`first headline: ${payload.meetings[0]?.brief?.headline}\n`);
      process.stdout.write(`isMock: ${payload.isMock}\n`);
      process.exit(0);
    }
    if (row?.status === "failed") {
      process.stdout.write(`PIPELINE FAILED: ${row.errorMessage}\n`);
      process.exit(1);
    }
  }
  process.stdout.write("TIMEOUT waiting for ready\n");
  process.exit(1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
