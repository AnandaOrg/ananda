/** Categories where a backoffice admin can add a brand-new image, not just replace
 *  an existing one. Everywhere else (flavors, ritual, misc, about, pathways) the
 *  images are hand-placed with per-image layout data (crop/rotation/position) or are
 *  tied to a fixed physical layout — a new image there needs a design change, not
 *  just an upload. See the Social/Hero carousels, which already render however many
 *  images are in their list, and the footer's social icon row, which is now fully
 *  data-driven (icon + link) rather than hardcoded per-platform JSX. */
export const ADDABLE_CATEGORIES = ["social", "hero", "footer-social"] as const;
export type AddableCategory = (typeof ADDABLE_CATEGORIES)[number];

export function isAddableCategory(category: string): category is AddableCategory {
  return (ADDABLE_CATEGORIES as readonly string[]).includes(category);
}

/** Where backoffice-added images live (`/media/<category>/<uuid>.<ext>`, see
 *  app/api/backoffice/media/route.ts). Unlike the seeded assets they have no
 *  original in `public/` to fall back to. */
export const UPLOAD_PATH_PREFIX = "/media/";
