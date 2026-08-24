import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const [entries, values] = await Promise.all([db.select().from(contentEntries), db.select().from(contentValues)]);

  const byEntry = new Map<number, { en?: string; bg?: string }>();
  for (const v of values) {
    const cur = byEntry.get(v.entryId) ?? {};
    cur[v.locale as "en" | "bg"] = v.value;
    byEntry.set(v.entryId, cur);
  }

  const result = entries
    .map((e) => ({ id: e.id, namespace: e.namespace, key: e.key, format: e.format, ...byEntry.get(e.id) }))
    .sort((a, b) => (a.namespace + a.key).localeCompare(b.namespace + b.key));

  return NextResponse.json({ entries: result });
}
