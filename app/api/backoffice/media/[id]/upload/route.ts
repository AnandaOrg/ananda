import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { deleteAsset, uploadAsset } from "@/lib/media/blob";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isInteger(assetId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const db = getDb();
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  // A fresh, uniquely-suffixed URL avoids serving stale CDN-cached content at the
  // old URL — replacing in place can lag behind an edit for a while.
  const blob = await uploadAsset(asset.path, buffer, { addRandomSuffix: true });

  const previousUrl = asset.blobUrl;
  await db.update(mediaAssets).set({ blobUrl: blob.url, updatedAt: new Date(), updatedBy: session.userId }).where(eq(mediaAssets.id, assetId));

  deleteAsset(previousUrl).catch(() => {});

  return NextResponse.json({ ok: true, url: blob.url });
}
