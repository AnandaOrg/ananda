import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

const PLAIN_OPTIONS = { allowedTags: [], allowedAttributes: {} };
/** Only `<p>`/`<u>` are allowed — the manifesto field's only consumer,
 *  RevealStatement, understands paragraphs and an "emphasis" run, nothing else. */
const RICH_OPTIONS = { allowedTags: ["p", "u"], allowedAttributes: {} };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const en = typeof body?.en === "string" ? body.en : undefined;
  const bg = typeof body?.bg === "string" ? body.bg : undefined;
  if (en === undefined && bg === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const db = getDb();
  const [entry] = await db.select().from(contentEntries).where(eq(contentEntries.id, entryId)).limit(1);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clean = (value: string) => sanitizeHtml(value, entry.format === "rich" ? RICH_OPTIONS : PLAIN_OPTIONS);

  for (const [locale, value] of [["en", en] as const, ["bg", bg] as const]) {
    if (value === undefined) continue;
    const sanitized = clean(value);
    await db
      .insert(contentValues)
      .values({ entryId, locale, value: sanitized, updatedBy: session.userId })
      .onConflictDoUpdate({
        target: [contentValues.entryId, contentValues.locale],
        set: { value: sanitized, updatedAt: new Date(), updatedBy: session.userId },
      });
  }

  return NextResponse.json({ ok: true });
}
