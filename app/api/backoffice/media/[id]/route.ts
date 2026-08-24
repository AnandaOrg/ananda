import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isInteger(assetId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const active = typeof body?.active === "boolean" ? body.active : undefined;
  const link = body?.link === null || typeof body?.link === "string" ? body.link : undefined;
  if (active === undefined && link === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(mediaAssets)
    .set({
      ...(active !== undefined ? { active } : {}),
      ...(link !== undefined ? { link: link || null } : {}),
      updatedAt: new Date(),
      updatedBy: session.userId,
    })
    .where(eq(mediaAssets.id, assetId));

  return NextResponse.json({ ok: true });
}
