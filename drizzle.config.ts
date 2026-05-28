import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? "file:./data/dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
  verbose: true,
  strict: true,
} satisfies Config;
