import { and, count, eq, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export async function isLockedOut(email: string): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const [row] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false), gt(loginAttempts.attemptedAt, since)));
  return (row?.n ?? 0) >= MAX_FAILURES;
}

export async function recordAttempt(email: string, success: boolean): Promise<void> {
  const db = getDb();
  await db.insert(loginAttempts).values({ email, success });
}
