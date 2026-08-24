import { pgTable, serial, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";

export const backofficeUsers = pgTable("backoffice_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per translatable string, keyed by its next-intl `namespace` + dot-path `key`
 *  (e.g. namespace "ritual", key "step1.label"). `format` picks the editor: a plain
 *  input, or the restricted-toolbar WYSIWYG in the backoffice. */
export const contentEntries = pgTable(
  "content_entries",
  {
    id: serial("id").primaryKey(),
    namespace: text("namespace").notNull(),
    key: text("key").notNull(),
    format: text("format", { enum: ["plain", "rich"] }).notNull().default("plain"),
  },
  (t) => [unique("content_entries_namespace_key").on(t.namespace, t.key)]
);

export const contentValues = pgTable(
  "content_values",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id")
      .notNull()
      .references(() => contentEntries.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: ["en", "bg"] }).notNull(),
    value: text("value").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: integer("updated_by").references(() => backofficeUsers.id),
  },
  (t) => [unique("content_values_entry_locale").on(t.entryId, t.locale)]
);

/** Backs the login lockout — counts recent failures per email. */
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  success: boolean("success").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per managed image, keyed by its original `public/` path (the stable
 *  identifier every render call-site looks up by) for the site's existing images, or
 *  a generated `/media/<category>/<uuid>` path for images added via the backoffice
 *  (in the categories that support adding new items — see lib/media/addable.ts).
 *  `kind: "mask"` rows are CSS mask-image sources, not clickable content — the
 *  backoffice UI skips the link field for those. `blobUrl` is swappable independently
 *  of `path` so replacing the file doesn't require touching any component. `alt` is
 *  only used for backoffice-added images — existing ones keep their curated alt text
 *  hardcoded at the call site. */
export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  category: text("category").notNull(),
  kind: text("kind", { enum: ["image", "mask"] }).notNull().default("image"),
  blobUrl: text("blob_url").notNull(),
  active: boolean("active").notNull().default(true),
  link: text("link"),
  alt: text("alt").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => backofficeUsers.id),
});
