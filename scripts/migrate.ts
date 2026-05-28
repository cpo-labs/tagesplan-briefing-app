/**
 * Local migration runner. Reads every .sql file in /drizzle, splits on
 * statement-breakpoints, and executes each statement against the
 * configured Turso/libsql database. Sufficient for MVP — we'll move to
 * drizzle-kit's interactive flow once we have a proper CI.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? "file:./data/dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

async function main() {
  const dir = join(process.cwd(), "drizzle");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(join(dir, file), "utf8");
    const stmts = sql
      .split(/--\s*>\s*statement-breakpoint/)
      .map((s) => s.trim())
      .filter(Boolean);

    process.stdout.write(`-> ${file} (${stmts.length} stmts)\n`);
    for (const stmt of stmts) {
      try {
        await client.execute(stmt);
      } catch (err) {
        // Idempotent: ignore "already exists"
        const msg = err instanceof Error ? err.message : String(err);
        if (/already exists/i.test(msg)) {
          continue;
        }
        // eslint-disable-next-line no-console
        console.error(`  failed: ${msg.slice(0, 200)}`);
        throw err;
      }
    }
  }

  process.stdout.write("done\n");
}

main().then(
  () => process.exit(0),
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  },
);
