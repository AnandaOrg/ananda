import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

const PLAIN_OPTIONS = { allowedTags: [], allowedAttributes: {} };

/** Server-side mirror of what the RichTextEditor toolbar offers — enforced here
 *  too, since the toolbar UI alone isn't a security/consistency boundary against
 *  a direct API call. Colors: any hex/rgb(a) value (open picker, per product
 *  choice). Font size: `em` only, so it stays relative to the field's own
 *  responsive computed size instead of freezing to a fixed px. Font family:
 *  restricted to the site's own loaded font tokens — nothing else is loaded, so
 *  any other value would silently fall back anyway, and this keeps arbitrary
 *  fonts from drifting the site off its type system. */
const HEX_OR_RGB = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\))$/;
const FONT_SIZE_EM = /^\d+(\.\d+)?em$/;
const FONT_FAMILY_TOKEN = /^var\(--font-(display|body|mono-label|geist-sans|geist-mono)\)$/;

/** Bold/italic/underline/strikethrough/link/font family/font size/color/highlight
 *  body copy, rendered via dangerouslySetInnerHTML on the site (already
 *  sanitized here, so that's safe). */
const RICH_OPTIONS = {
  allowedTags: ["strong", "em", "u", "s", "a", "span", "mark"],
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"], mark: ["style"] },
  allowedStyles: {
    span: {
      color: [HEX_OR_RGB],
      "font-size": [FONT_SIZE_EM],
      "font-family": [FONT_FAMILY_TOKEN],
    },
    mark: {
      "background-color": [HEX_OR_RGB],
    },
  },
  transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }, true) },
};
/** Only `<p>`/`<u>` are allowed — the manifesto field's only consumer,
 *  RevealStatement, understands paragraphs and an "emphasis" run, nothing else. */
const EMPHASIS_OPTIONS = { allowedTags: ["p", "u"], allowedAttributes: {} };

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

  const options = entry.format === "rich" ? RICH_OPTIONS : entry.format === "emphasis" ? EMPHASIS_OPTIONS : PLAIN_OPTIONS;
  const clean = (value: string) => sanitizeHtml(value, options);

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
