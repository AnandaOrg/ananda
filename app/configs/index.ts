export const CAROUSEL_AUTOPLAY_SPEED = 5; // px/s

/** Canonical production origin — used for metadataBase, robots.ts, and sitemap.ts. */
export const SITE_URL = "https://www.anandacocktails.eu";

/**
 * Geometry of the "What we're about" gallery card (left slot), in viewport units.
 * SHARED so the `DitchTheGlass` pour image can travel to the exact same box that
 * `AboutCollage` then pins its gallery into — the two sections hand off seamlessly.
 * Keep these in sync; both components import this single source of truth.
 */
export const ABOUT_CARD = {
  left: "2vw",
  top: "4vh",
  width: "48vw",
  height: "80vh",
} as const;