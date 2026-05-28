import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton: der Client wird erst bei der ersten echten Nutzung erzeugt,
// NICHT beim Modul-Import. Sonst kann `next build` schon beim "collect page
// data" fuer dynamische Routen stolpern, wenn z.B. native libsql-Bindings
// oder fehlende Env auffallen. DATABASE_URL hat einen Dev-Fallback.
let cached: DB | undefined;

function getDb(): DB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL ?? "file:./data/dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  cached = drizzle(client, { schema });
  return cached;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(real)
      : value;
  },
  set(_target, prop, value) {
    (getDb() as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  },
  has(_target, prop) {
    return prop in (getDb() as unknown as object);
  },
});

export { schema };
