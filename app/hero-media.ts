/** Every pre-existing "hero" category path, across both DitchTheGlass (which uses
 *  only 4 of the 5) and MobileIntro (which uses all 5), plus the die-cut mask. Used
 *  as the `knownPaths` exclusion set when pulling backoffice-added "extra" hero
 *  photos — without the full union, a path one component omits by design (or the
 *  mask) would be mistaken for an admin-added extra and rendered as a bogus photo. */
export const HERO_KNOWN_PATHS = [
  "/hero_3/1.png",
  "/hero_3/2.png",
  "/hero_3/3.png",
  "/hero_3/4.png",
  "/hero_3/5.png",
  "/m-photo-card.svg",
];
