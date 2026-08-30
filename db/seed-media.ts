/** One-time seed: uploads every managed image to Vercel Blob and registers it in
 *  media_assets. Safe to re-run — skips any path that already has a row, so it will
 *  never overwrite an image an admin has since replaced or toggled via the backoffice. */
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { mediaAssets } from "./schema";
import { uploadAsset } from "../lib/media/blob";

type Kind = "image" | "mask" | "video";
type Entry = { path: string; category: string; kind: Kind; link?: string; alt?: string };

const ENTRIES: Entry[] = [
  // flavors — FlavorModal.tsx scene assets
  { path: "/fl-bg-blue.svg", category: "flavors", kind: "image" },
  { path: "/fl-bg-orange.svg", category: "flavors", kind: "image" },
  { path: "/fl-bg-green.svg", category: "flavors", kind: "image" },
  { path: "/fl-bg-red.svg", category: "flavors", kind: "image" },
  { path: "/fl-lemon.png", category: "flavors", kind: "image" },
  { path: "/fl-anis.png", category: "flavors", kind: "image" },
  { path: "/fl-mint2.png", category: "flavors", kind: "image" },
  { path: "/fl-mint1.png", category: "flavors", kind: "image" },
  { path: "/fl-passion-a.png", category: "flavors", kind: "image" },
  { path: "/fl-mango.png", category: "flavors", kind: "image" },
  { path: "/fl-pineapple.png", category: "flavors", kind: "image" },
  { path: "/fl-elderflower.png", category: "flavors", kind: "image" },
  { path: "/fl-passion-g4.png", category: "flavors", kind: "image" },
  { path: "/fl-passion-g1.png", category: "flavors", kind: "image" },
  { path: "/fl-lychee.png", category: "flavors", kind: "image" },
  { path: "/fl-yuzu.png", category: "flavors", kind: "image" },
  { path: "/fl-strawberry.png", category: "flavors", kind: "image" },

  // social — "ANANDA in the wild" carousel
  { path: "/s5-wild1.png", category: "social", kind: "image" },
  { path: "/s5-wild2.png", category: "social", kind: "image" },
  { path: "/s5-wild3.png", category: "social", kind: "image" },
  { path: "/s5-wild4.png", category: "social", kind: "image" },
  { path: "/s5-wild5.png", category: "social", kind: "image" },

  // ritual — step cards
  { path: "/s5-step1.png", category: "ritual", kind: "image" },
  { path: "/s5-step2.png", category: "ritual", kind: "image" },
  { path: "/s5-step3.png", category: "ritual", kind: "image" },
  { path: "/s5-card2.svg", category: "ritual", kind: "image" },

  // hero — the hero_3 photo deck + the die-cut card mask it's clipped to
  { path: "/hero_3/1.png", category: "hero", kind: "image" },
  { path: "/hero_3/2.png", category: "hero", kind: "image" },
  { path: "/hero_3/3.png", category: "hero", kind: "image" },
  { path: "/hero_3/4.png", category: "hero", kind: "image" },
  { path: "/hero_3/5.png", category: "hero", kind: "image" },
  { path: "/m-photo-card.svg", category: "hero", kind: "mask" },
  { path: "/videos/hero.webm", category: "hero", kind: "video" },
  { path: "/videos/hero-mobile.webm", category: "hero", kind: "video" },

  // about — Kyoto liftoff scene + collage frame masks
  { path: "/kyoto/kyoto-background.png", category: "about", kind: "image" },
  { path: "/kyoto/kyoto-image.png", category: "about", kind: "image" },
  { path: "/m-pineapple.svg", category: "about", kind: "mask" },
  { path: "/m-14.svg", category: "about", kind: "mask" },

  // pathways — floating fruit chips + CTA arrow
  { path: "/s4-lemon.png", category: "pathways", kind: "image" },
  { path: "/s4-mango.png", category: "pathways", kind: "image" },
  { path: "/s4-flowers.png", category: "pathways", kind: "image" },
  { path: "/s4-raspberry.png", category: "pathways", kind: "image" },
  { path: "/s4-arrow.svg", category: "pathways", kind: "image" },

  // footer-social — the footer's LinkedIn/Facebook/Instagram icons (addable category —
  // both the icon graphic and the profile link are backoffice-managed)
  { path: "/m-linkedin.svg", category: "footer-social", kind: "image", link: "https://www.linkedin.com/company/ananda-cocktails", alt: "LinkedIn" },
  { path: "/m-facebook.svg", category: "footer-social", kind: "image", link: "https://www.facebook.com/anandacocktails.eu/", alt: "Facebook" },
  { path: "/m-instagram.svg", category: "footer-social", kind: "image", link: "https://www.instagram.com/ananda_cocktails_bg/", alt: "Instagram" },

  // misc — mandala, logo, drop-list icons, age-gate background shape
  { path: "/s5-mandala.svg", category: "misc", kind: "image" },
  { path: "/ananda-logo.svg", category: "misc", kind: "image" },
  { path: "/organic-bg-shape.svg", category: "misc", kind: "mask" },
  { path: "/m-warning.svg", category: "misc", kind: "image" },
  { path: "/m-send.svg", category: "misc", kind: "image" },
];

async function main() {
  const db = getDb();
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;

  console.log(`Seeding ${ENTRIES.length} media assets…`);

  for (const entry of ENTRIES) {
    const [existing] = await db.select().from(mediaAssets).where(eq(mediaAssets.path, entry.path)).limit(1);
    if (existing) {
      skipped++;
      continue;
    }

    const localPath = path.join(process.cwd(), "public", entry.path);
    if (!fs.existsSync(localPath)) {
      console.warn(`- SKIP (missing file in public/): ${entry.path}`);
      missing++;
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const blob = await uploadAsset(entry.path, buffer);

    await db.insert(mediaAssets).values({
      path: entry.path,
      category: entry.category,
      kind: entry.kind,
      blobUrl: blob.url,
      link: entry.link ?? null,
      alt: entry.alt ?? "",
    });
    uploaded++;
    console.log(`- uploaded ${entry.path}`);
  }

  console.log(`Done. Uploaded ${uploaded}, skipped ${skipped} (already present), ${missing} missing.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
