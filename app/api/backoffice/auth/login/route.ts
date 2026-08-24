import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { backofficeUsers } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { isLockedOut, recordAttempt } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (await isLockedOut(email)) {
    return NextResponse.json({ error: "Too many failed attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const db = getDb();
  const [user] = await db.select().from(backofficeUsers).where(eq(backofficeUsers.email, email)).limit(1);
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  await recordAttempt(email, valid);

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
