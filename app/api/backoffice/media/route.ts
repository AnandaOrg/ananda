import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { MEDIA_CACHE_TAG, EXPIRE_NOW } from "@/lib/cache-tags";
import { isAddableCategory, UPLOAD_PATH_PREFIX } from "@/lib/media/addable";
import { uploadAsset } from "@/lib/media/blob";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db.select().from(mediaAssets);
  const assets = rows.sort((a, b) => (a.category + a.path).localeCompare(b.category + b.path));

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const category = formData?.get("category");
  const alt = formData?.get("alt");
  const file = formData?.get("file");

  if (typeof category !== "string" || !isAddableCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `${UPLOAD_PATH_PREFIX}${category}/${randomUUID()}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await uploadAsset(path, buffer);

  const db = getDb();
  const [row] = await db
    .insert(mediaAssets)
    .values({
      path,
      category,
      kind: "image",
      blobUrl: blob.url,
      active: true,
      alt: typeof alt === "string" ? alt : "",
      updatedBy: session.userId,
    })
    .returning();

  revalidateTag(MEDIA_CACHE_TAG, EXPIRE_NOW);
  return NextResponse.json({ asset: row });
}
