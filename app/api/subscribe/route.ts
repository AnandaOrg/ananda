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

const MAILERLITE_SUBSCRIBERS_URL = "https://connect.mailerlite.com/api/subscribers";

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

  const apiKey = process.env.MAILERLITE_API_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMzNiMDcwMDkxN2JmZjFkZjQ1OWYzZTlhNWE2ODM3Y2YyNWEzNTg4YjdlODJlZDYzYThlM2MxYmRmYTM2NzI0ZmY2ZTIzNDI2MTIyN2VmYzUiLCJpYXQiOjE3ODI2NTMxOTIuODIwMjYsIm5iZiI6MTc4MjY1MzE5Mi44MjAyNjMsImV4cCI6NDkzODMyNjc5Mi44MTQ5NTEsInN1YiI6IjI0OTE0NzAiLCJzY29wZXMiOltdfQ.OceKKxcm6IFvd1Krg3S8SFhLAaeCxZJKMaaWW8H5RONgX4RaCoennHR2VM4wdhTXPdDI_eQiN6qKIqZeHmCBWAg78MFl_NnpgSXO3GtVJLJfXj8nZX9Q9kpOIOBYEgejboJknDch5m8B6DywgJFCi7MJpIQPfHey3olLC0z4oByr-p0DztJm3nOHq3gm8Kzjye1FemYS9aOgC1z0I7qHoGSt2qn5XFxj5va9oayav4rcaXDF1PrAEeemFnJW2w3MX5QQ5vfe1XpfOfB8symX3zkfgIDaVhleMcLKH-XmFjpmZ9gpczqlEhmn9_pjTICKYmK9319Uc4RpbdW-bRKW-lMc4EObrrpVwkOdmrkaI4nIZSubZkL9ZrVgLFz6b_Qbx2e38J-O3z0g7WZlsQVsCkqpg6TSm-rzdnLopbz2hPt-11c_z2U4AcoQcugQ758DzxxNZGtSn9XsJQLbBI_7N5RSSTMW2CxNar75-qas30zjFU9mcyf6seheNYLJj-3h5XLeiLT05uA7RELReaJBwTHgc9jvVGz4r-TV7AURAtWXXdhCXJh2KerkBPElrXH1uvkgee_ZIgH6V8FmSc7inCeVlsvl-5e36zWGe9QFrzVRgz5nJRziproG4YmwNLspwaHcuIXIRYjeifcSnDg9JGF3e6mgBqunZpVKVBbi3QE";
  if (!apiKey) {
    console.error("MAILERLITE_API_KEY is not set.");
    return NextResponse.json({ error: "Subscription is not configured." }, { status: 500 });
  }

  const groupId = process.env.MAILERLITE_GROUP_ID;

  try {
    const res = await fetch(MAILERLITE_SUBSCRIBERS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        ...(groupId ? { groups: [groupId] } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`MailerLite subscribe failed (${res.status}): ${body}`);
      return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
    }
  } catch (err) {
    console.error("MailerLite subscribe request failed:", err);
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
