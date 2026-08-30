import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { backofficeUsers } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const MIN_PASSWORD_LENGTH = 8;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const users = await db
    .select({ id: backofficeUsers.id, email: backofficeUsers.email, createdAt: backofficeUsers.createdAt })
    .from(backofficeUsers)
    .orderBy(backofficeUsers.createdAt);

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select({ id: backofficeUsers.id }).from(backofficeUsers).where(eq(backofficeUsers.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(backofficeUsers)
    .values({ email, passwordHash })
    .returning({ id: backofficeUsers.id, email: backofficeUsers.email, createdAt: backofficeUsers.createdAt });

  return NextResponse.json({ ok: true, user });
}
