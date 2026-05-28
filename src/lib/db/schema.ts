import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";

/* ─── better-auth core tables ─────────────────────────────────────────────
 * better-auth manages users + sessions itself. We keep app-owned tables
 * (briefings, runs) referenced by user-id but don't redefine auth tables —
 * better-auth's adapter generates them via `pnpm db:push` once schema gen
 * runs. To stay explicit, we mirror its expected schema here so Drizzle Kit
 * sees them too.
 * ──────────────────────────────────────────────────────────────────────── */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/* ─── App-owned tables ────────────────────────────────────────────────── */

/**
 * One row per generated briefing.
 * - `slug` is the public permalink identifier.
 * - `payload` holds the synthesised report (events + research + LLM output)
 *   serialised as JSON. Keeping this denormalised avoids a join cascade for
 *   the public view.
 */
export const briefings = sqliteTable(
  "briefings",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userEmail: text("user_email").notNull(),
    date: text("date").notNull(), // ISO date (YYYY-MM-DD)
    calendarSource: text("calendar_source").notNull(), // "ical-url" | "share" | "google-oauth"
    calendarUrl: text("calendar_url"),
    title: text("title").notNull(),
    status: text("status").notNull().default("processing"), // processing | ready | failed
    errorMessage: text("error_message"),
    payload: text("payload"), // JSON-encoded briefing report
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    bySlug: index("briefings_slug_idx").on(table.slug),
    byUser: index("briefings_user_idx").on(table.userId),
    byEmail: index("briefings_email_idx").on(table.userEmail),
  }),
);

/**
 * Lifecycle log for one briefing run. We keep this separately so the
 * briefings table stays a clean public surface and we can audit how often
 * an email touched the system regardless of failures.
 */
export const briefingRuns = sqliteTable(
  "briefing_runs",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    briefingId: text("briefing_id").references(() => briefings.id, {
      onDelete: "set null",
    }),
    succeeded: integer("succeeded", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    byEmail: index("runs_email_idx").on(table.userEmail),
  }),
);

/**
 * Global daily counter for rate-limiting. One row per (date) — simple
 * UPSERT pattern lets us cap total burn per day without external KV.
 */
export const dailyCounters = sqliteTable("daily_counters", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  count: integer("count").notNull().default(0),
});

export type Briefing = typeof briefings.$inferSelect;
export type NewBriefing = typeof briefings.$inferInsert;
export type BriefingRun = typeof briefingRuns.$inferSelect;
