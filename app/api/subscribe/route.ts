import { NextResponse } from "next/server";
import { parse } from "tldts";

// local@domain shape (no spaces, single @) — the domain is then validated by
// tldts against its bundled Public Suffix List snapshot: only domains ending
// in a real ICANN TLD pass (rejects `user@localhost`, `a@b.notarealtld`).
const EMAIL_SHAPE = /^[^\s@]+@([^\s@]+)$/;

const isValidEmail = (email: string): boolean => {
  const match = EMAIL_SHAPE.exec(email);
  if (!match) return false;
  const { isIcann, domain } = parse(match[1]);
  return isIcann === true && domain !== null;
};

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !isValidEmail(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
