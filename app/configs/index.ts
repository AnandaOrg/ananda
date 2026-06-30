export const CAROUSEL_AUTOPLAY_SPEED = 10; // px/s

/**
 * "What we're about" pinned gallery: scroll distance per image, as a fraction of
 * viewport height. Total pinned scroll = count × this × 100vh. Higher = slower,
 * more deliberate stepping through the photos.
 */
export const ABOUT_REVEAL_STEP_VH = 0.7;

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