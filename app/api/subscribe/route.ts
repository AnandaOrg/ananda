import { NextResponse } from "next/server";

/**
 * POST /api/subscribe — adds an email to the MailerLite list.
 *
 * Proxies to the MailerLite API server-side so the API token never reaches the
 * client. Configure via env (see `.env.example`):
 *   - MAILERLITE_API_KEY   (required) — token from MailerLite → Integrations → API.
 *   - MAILERLITE_GROUP_ID  (optional) — group to add subscribers to.
 */

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/subscribers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error("MAILERLITE_API_KEY is not set");
    return NextResponse.json(
      { error: "Subscriptions are not configured." },
      { status: 500 },
    );
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const groupId = process.env.MAILERLITE_GROUP_ID;

  try {
    const res = await fetch(MAILERLITE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: email.trim(),
        status: "active",
        ...(groupId ? { groups: [groupId] } : {}),
      }),
    });

    // 200 = existing subscriber updated, 201 = newly created — both are success.
    if (res.ok) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const body = await res.json().catch(() => null);
    console.error("MailerLite error", res.status, body);

    if (res.status === 422) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 502 },
    );
  } catch (err) {
    console.error("MailerLite request failed", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 502 },
    );
  }
}
