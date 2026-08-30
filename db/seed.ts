/** One-time seed: admin user, all next-intl message strings (from messages/*.json),
 *  the flavor name/ingredient text (currently hardcoded, English-only, in
 *  FlavorModal.tsx), and the manifesto body. Safe to re-run — uses onConflictDoNothing
 *  throughout, so it will never overwrite content already edited via the backoffice. */
import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { backofficeUsers, contentEntries, contentValues } from "./schema";
import { flattenMessages } from "../lib/content/flatten";
import { parasToHtml } from "../lib/content/manifesto-html";
import { MANIFESTO } from "../app/manifesto-copy";
import { hashPassword } from "../lib/auth/password";

const SEED_ADMIN_EMAIL = "martin.y.kiriloff@gmail.com";
const SEED_ADMIN_PASSWORD = "Marto!2345";

type SeedEntry = { namespace: string; key: string; format: "plain" | "rich" | "emphasis"; en: string; bg: string };

function readMessages(locale: "en" | "bg"): Record<string, string> {
  const raw = fs.readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8");
  return flattenMessages(JSON.parse(raw));
}

// Gets the bold/italic/underline/strike/link WYSIWYG. Everything else stays a plain
// input — either because it's rendered inside an HTML attribute (aria-label,
// placeholder) where markup can't be parsed, split into per-word spans for an
// animation (markup would be torn apart or shown literally), duplicated into both
// an attribute and visible children on the same element, or carries an ICU
// interpolation placeholder (`{year}`) that `t.raw()` would skip entirely. See the
// content-field usage audit for the full per-key reasoning.
const RICH_MESSAGE_KEYS = new Set([
  "about.p1",
  "about.p2",
  "about.p3",
  "ritual.step1.body",
  "ritual.step2.body",
  "ritual.step3.body",
  "hero.eyebrow",
  "about.eyebrow",
  "flavors.eyebrow",
  "flavors.cta",
  "ritual.eyebrow",
  "ritual.title",
  "ritual.step1.label",
  "ritual.step2.label",
  "ritual.step3.label",
  "ritual.step1.title",
  "ritual.step2.title",
  "ritual.step3.title",
  "wild.eyebrow",
  "wild.title1",
  "wild.title2",
  "wild.tag1",
  "wild.tag2",
  "dropList.eyebrow",
  "dropList.title",
  "dropList.headingIdle",
  "dropList.headingSuccess",
  "dropList.headingError",
  "dropList.successMsg",
  "dropList.errorMsg",
  "ageGate.title",
  "ageGate.subtitle",
  "ageGate.out",
  "ageGate.in",
  "ageGate.warning",
  "noEntry.eyebrow",
  "noEntry.title",
  "noEntry.body",
  "modal.ingredients",
  "splash.scrollDown",
]);

function buildMessageEntries(): SeedEntry[] {
  const en = readMessages("en");
  const bg = readMessages("bg");
  return Object.entries(en).map(([path, value]) => {
    const [namespace, ...rest] = path.split(".");
    const format = RICH_MESSAGE_KEYS.has(path) ? "rich" : "plain";
    return { namespace, key: rest.join("."), format, en: value, bg: bg[path] ?? "" };
  });
}

const FLAVOR_TEXT: Record<string, { name: string; ingredients: [string, string] }> = {
  santorini: { name: "Santorini", ingredients: ["Anise, Mint and Lemon.", "Mediterranean freshness."] },
  aloha: { name: "Aloha", ingredients: ["Mango, Pineapple and Passion fruit.", "A sweet tropical breeze."] },
  gaia: { name: "Gaia", ingredients: ["Passion fruit, Lemongrass and Elderflower.", "The power of wild nature."] },
  kyoto: { name: "Kyoto", ingredients: ["Strawberry, Lychee and Yuzu.", "Precise Japanese elegance."] },
};

function buildFlavorEntries(): SeedEntry[] {
  const entries: SeedEntry[] = [];
  for (const [key, { name, ingredients }] of Object.entries(FLAVOR_TEXT)) {
    entries.push({ namespace: "flavorItems", key: `${key}.name`, format: "rich", en: name, bg: "" });
    entries.push({ namespace: "flavorItems", key: `${key}.ingredients.0`, format: "rich", en: ingredients[0], bg: "" });
    entries.push({ namespace: "flavorItems", key: `${key}.ingredients.1`, format: "rich", en: ingredients[1], bg: "" });
  }
  return entries;
}

function buildManifestoEntry(): SeedEntry {
  return {
    namespace: "manifesto",
    key: "body",
    format: "emphasis",
    en: parasToHtml(MANIFESTO.en),
    bg: parasToHtml(MANIFESTO.bg),
  };
}

async function seedUser(db: ReturnType<typeof getDb>) {
  const [existing] = await db.select().from(backofficeUsers).where(eq(backofficeUsers.email, SEED_ADMIN_EMAIL)).limit(1);
  if (existing) {
    console.log(`- admin user ${SEED_ADMIN_EMAIL} already exists, skipping`);
    return;
  }
  const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);
  await db.insert(backofficeUsers).values({ email: SEED_ADMIN_EMAIL, passwordHash });
  console.log(`- created admin user ${SEED_ADMIN_EMAIL}`);
}

async function seedContent(db: ReturnType<typeof getDb>, entries: SeedEntry[]) {
  let created = 0;
  for (const entry of entries) {
    const [row] = await db
      .insert(contentEntries)
      .values({ namespace: entry.namespace, key: entry.key, format: entry.format })
      .onConflictDoNothing({ target: [contentEntries.namespace, contentEntries.key] })
      .returning();

    const [entryRow] =
      row !== undefined
        ? [row]
        : await db
            .select()
            .from(contentEntries)
            .where(and(eq(contentEntries.namespace, entry.namespace), eq(contentEntries.key, entry.key)))
            .limit(1);
    if (!entryRow) continue;

    for (const [locale, value] of [["en", entry.en], ["bg", entry.bg]] as const) {
      await db
        .insert(contentValues)
        .values({ entryId: entryRow.id, locale, value })
        .onConflictDoNothing({ target: [contentValues.entryId, contentValues.locale] });
    }
    if (row) created++;
  }
  console.log(`- ${created} new content entries seeded (${entries.length} total checked)`);
}

async function main() {
  const db = getDb();
  console.log("Seeding ananda backoffice database…");
  await seedUser(db);
  await seedContent(db, [...buildMessageEntries(), ...buildFlavorEntries(), buildManifestoEntry()]);
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
