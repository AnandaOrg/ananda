import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle({ client: sql, schema });
}

let _db: ReturnType<typeof createDb> | null = null;

/** Lazy singleton — avoids evaluating `DATABASE_URL` at module load, which would
 *  crash `next build` before env vars are configured. Do not wrap in a Proxy. */
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
