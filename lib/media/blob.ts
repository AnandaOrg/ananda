import { put, del } from "@vercel/blob";

/** Blob pathname for a managed asset's `public/`-style path — strips the leading
 *  slash ("/fl-lemon.png" -> "fl-lemon.png"); nested paths (e.g. "/hero_3/1.png")
 *  keep their prefix. */
export function blobPathFor(assetPath: string): string {
  return assetPath.replace(/^\//, "");
}

export async function uploadAsset(assetPath: string, body: Buffer | Blob, opts?: { addRandomSuffix?: boolean }) {
  return put(blobPathFor(assetPath), body, {
    access: "public",
    addRandomSuffix: opts?.addRandomSuffix ?? false,
    allowOverwrite: true,
  });
}

export async function deleteAsset(url: string) {
  await del(url);
}
