# Figma spec — ANANDA landing (desktop + mobile)

**Source:** Figma file `SSEnXLE4AXrypFoHJLHbtz` (desktop node `198-5924`, mobile node `184-3238`)
**Extraction basis:** Full-page screenshots supplied by user (Figma MCP was rate-limited on a View seat — exact hex/px/type tokens could NOT be machine-read; values below marked `≈` are eyeballed from the screenshots and must be confirmed against Figma).
**Library in file:** Uniqui Colors (team)
**Frame widths:** Desktop **1440px** (`u = 100cqw/1440`), Mobile **390px** (`mu = 100cqw/390`, container capped 430px — `app/mobile/scale.ts`)
**Breakpoint:** Tailwind `md:` = 768px. Desktop and mobile are **separate component trees** toggled with `hidden md:block` / `md:hidden`.

---

## Section order (identical desktop ↔ mobile, confirmed against code)

| # | Section | Desktop component | Mobile component | Animation |
|---|---------|-------------------|------------------|-----------|
| 1 | Hero — logo over ocean video | `page.tsx` `<video>` | shared `<video>` | **hero.mp4** autoplay/muted/loop/playsInline, object-cover |
| 2 | "LIQUID BLISS, MIXED TO MOVE." statement | `DitchTheGlass.tsx` | `mobile/MobileIntro.tsx` | scroll-scrubbed diamond crop (desktop) / simplified diamond (mobile) |
| 3 | Photo collage — beach / strawberries / popsicle | `AboutCollage.tsx` + `VerticalSlider.tsx` | `mobile/MobileCollage.tsx` | **ScrollVideoCanvas** frame seqs: ananas(120), kyoto-strawberries(120), kyoto(78 autoLoop) |
| 4 | "THE PATHWAYS TO BLISS" + SANTORINI/ALOHA/GAIA/KYOTO | `Pathways.tsx` | `mobile/MobilePathways.tsx` | **GLB carousel** (desktop) / **color bands, no 3D** (mobile) |
| 5 | "THE RITUAL" + CHILL card | `Ritual.tsx` + `RitualCards.tsx` | `mobile/MobileRitual.tsx` + `mobile/MobileAbout.tsx` | 3-card auto-cycle + letter-fill (desktop) / single card + flat letter-fill (mobile) |
| 6 | "ANANDA IN THE WILD" photo carousel | `WildCarousel.tsx` | `WildCarousel.tsx` (shared) | swipeable carousel |
| 7 | "JOIN THE DROP LIST" email capture | `DropList.tsx` / `DropForm.tsx` | shared (dual layout) | Framer Motion form feedback |
| 8 | Footer (logo on deep teal) | shared | shared | — |

The four flavor names map 1:1 to the GLB assets: `santorini.glb`, `aloha.glb`, `gaia.glb`, `kyoto.glb`.

---

## Tokens (≈ approximate — confirm in Figma; MCP `get_variable_defs` was blocked)

| Kind | Role | Value (≈) |
|------|------|-----------|
| Color | Hero / footer deep teal | `≈ #143A3C` |
| Color | Cream / off-white text & bg | `≈ #F2E9D8` |
| Color | Warm sand / tan band | `≈ #C9A06A` |
| Color | Coral / orange accent | `≈ #E8702A` |
| Color | Tomato red (strawberry + KYOTO) | `≈ #C7402A` |
| Color | SANTORINI blue | `≈ #2E6FB0` |
| Color | ALOHA green | `≈ #5B8C3E` |
| Color | GAIA orange | `≈ #E08A1E` |
| Type | Display headline (all-caps, heavy condensed) | family/size/weight **unknown — confirm** |
| Type | Body copy | family/size/weight **unknown — confirm** |

> ⚠ All values above are read off compressed full-page PNGs. None are verified tokens. Re-run `get_variable_defs` on each frame (or read the file's color/text style panel) before hard-coding.

---

## Breakpoints
- **Mobile:** 390 (design), container capped at 430, `md:hidden`
- **Desktop:** 1440 (design), `hidden md:block`
- **Switch point:** 768px (Tailwind `md:`)

---

## Animations to PRESERVE exactly as-is (user requirement)

| System | Component | Driver | Assets |
|--------|-----------|--------|--------|
| GLB 3D transitions | `app/GlbViewer.tsx` | Three.js 0.184 + GSAP ScrollTrigger; cross-fade at `transitionAt` 0.247 / 0.504 / 0.762; GPU `compileAsync` warm-up | `public/glb/{santorini,aloha,gaia,kyoto}.glb` (+ `-draco` variants) |
| Hero MP4 | `app/page.tsx:20–28` | HTML5 video autoplay/muted/loop/playsInline | `public/videos/hero.mp4` |
| Scroll frame canvas | `app/ScrollVideoCanvas.tsx` | GSAP ScrollTrigger scrub **or** RAF autoLoop; IntersectionObserver lazy-load | `public/frames/{ananas,kyoto,kyoto-strawberries}/*.jpg` |
| Letter-fill reveal | `app/RevealStatement.tsx` | RAF, scroll-linked opacity | — |
| Ritual card stack | `app/RitualCards.tsx` | GSAP ScrollTrigger + 3s auto-cycle | — |
| Modal transitions | `app/FlavorModal.tsx` | Framer Motion `AnimatePresence`; GLB upright, `spinOnMount` 360° | GLB models |

**Libraries:** `gsap@3.15.0`, `framer-motion@12.40.0`, `three@0.184.0`. No Lenis (vanilla RAF + passive listeners). Scale helpers: desktop `u=100cqw/1440`, mobile `mu=100cqw/390`.

---

## Mobile parity gaps — the "fix them on mobile" work (DECIDED)

User decision: **full animation parity with desktop on mobile.** Each gap below now has a resolution.

| # | Desktop | Mobile now | ✅ Decision | Implementation note |
|---|---------|-----------|------------|---------------------|
| 1 | GLB 3D bottles in Pathways (`Pathways.tsx`) | Color bands only, **no `GlbViewer`** (`mobile/MobilePathways.tsx`) | **PORT GLB to mobile** | Mount `GlbViewer` in `mobile/MobilePathways.tsx` with the same `models`/`transitionAt` config; size via `mu()`. Prefer the `-draco` GLBs on mobile for the 34MB→ smaller payload; keep IntersectionObserver lazy-mount so it doesn't load until scrolled into view. Verify scroll-scrub still maps to the shorter mobile section height. |
| 2 | 3-card auto-cycling Ritual (`RitualCards.tsx`) | Single static CHILL card (`mobile/MobileRitual.tsx`) | **PORT card cycling** | Bring the 3-card stack + 3s auto-cycle + GSAP entrance into `mobile/MobileRitual.tsx`; re-scale card/photo-window geometry with `mu()`. |
| 3 | `PouchScroll.tsx` 360° scroll rotation | Not imported on mobile | **PORT rotation** | Import/adapt `PouchScroll.tsx` into the mobile tree; confirm the scroll-linked rotation range works against mobile section height. |
| 4 | Multi-line letter-fill | Flattened (`STATEMENT_FLAT`) | **KEEP multi-line** | Switch mobile `RevealStatement` to `STATEMENT_PARAS`; check the 18% overlap window + line wrapping at 390px so letters still fill smoothly. |
| 5 | Canvas frame anims full-size | Same scrub, smaller dims | Verify dims | Likely fine — confirm mobile canvas dims against the mobile frame. |

**FlavorModal already works on mobile** (full-screen layout, GLB `42vh×84vh`, Framer Motion) — no gap there.

### Cross-cutting risks when porting heavy animation to mobile
- **Payload / memory:** four GLBs (~34MB each uncompressed) + frame sequences on a phone is heavy. Use `-draco` variants, lazy-mount, and consider disposing GLB contexts when scrolled away.
- **Scroll-scrub mapping:** every ScrollTrigger that assumed desktop section heights must be re-checked against the 390px layout, or scrub timing drifts.
- **`prefers-reduced-motion`:** porting more motion to mobile widens the reduced-motion surface — ensure the existing reduced-motion guards cover the newly-ported pieces.

---

## Assets (already in repo — do NOT re-export)
- `public/glb/{santorini,aloha,gaia,kyoto}.glb` + `-draco` variants
- `public/videos/{hero,kyoto,kyoto-strawberries,ananas}.mp4`
- `public/frames/ananas/*` (120), `public/frames/kyoto/*` (78), `public/frames/kyoto-strawberries/*` (120)

> No new assets identified from the screenshots. If the Figma frames introduce new imagery/icons, list + export them after a proper MCP pull.

---

## Component instances → code map
- Hero video → `app/page.tsx` (inline `<video>`)
- Statement block → `DitchTheGlass.tsx` / `mobile/MobileIntro.tsx`
- Photo collage → `AboutCollage.tsx` + `VerticalSlider.tsx` / `mobile/MobileCollage.tsx`
- Pathways/flavors → `Pathways.tsx` + `GlbViewer.tsx` / `mobile/MobilePathways.tsx`
- Flavor detail modal → `FlavorModal.tsx` (shared, dual layout)
- Ritual → `Ritual.tsx` + `RitualCards.tsx` + `RevealStatement.tsx` / `mobile/MobileRitual.tsx` + `mobile/MobileAbout.tsx`
- Wild carousel → `WildCarousel.tsx` (shared)
- Drop list form → `DropList.tsx` / `DropForm.tsx` (shared)

---

## Open items remaining
1. **Exact tokens:** still need a clean Figma MCP pull (or style-panel screenshots) to replace the `≈` color values and fill in typography (family/size/weight/line-height). Re-run `get_variable_defs` when the View-seat quota resets.
2. **Mobile canvas dims (gap #5):** verify frame-sequence canvas sizes against the mobile frame.

_Animation parity decisions are settled: mobile gets GLB Pathways, ritual card cycling, PouchScroll rotation, and multi-line letter-fill (gaps #1–#4)._

---

## Implementation status — gaps #1–#4 BUILT ✅

Build passes (`next build` green, tsc + eslint clean).

| Gap | Change |
|-----|--------|
| #1 GLB on mobile | `mobile/MobilePathways.tsx` now mounts `GlbViewer` (same `GLB_MODELS` + `transitionAt` as desktop), centred over the bands, `pointer-events:none`. Taps call a new `openWithSpin` mirroring desktop (spin → open modal from bottle centre → wire reset/spin360). Static blue/red pouch PNGs removed. |
| #1 perf guard | `GlbViewer.tsx` now defers WebGL-context creation + GLB parsing until its mount has non-zero size. Prevents the hidden (display:none) desktop Pathways/modal viewers from loading 4×34MB models on phones — and vice-versa. Visible viewers behave exactly as before. |
| #2 Ritual cycling | `mobile/MobileRitual.tsx` rewritten as a client component: single card auto-cycles Chill→Twist→Sip every 3s, photo slides up (GSAP). Honours `prefers-reduced-motion` (stays static). |
| #3 PouchScroll | New `mobile/MobilePouchScroll.tsx` (scroll-linked 158.5°→+360° rotation, mobile geometry); replaces the static pouch overlay in `mobile/MobileCollage.tsx`. |
| #4 Letter-fill | `mobile/MobileAbout.tsx` switched `STATEMENT_FLAT` → `STATEMENT_PARAS` (multi-line). |

**Still worth a real-device pass:** GLB size/placement on mobile (`mu(320)×mu(816)`, centred) was set by estimate — eyeball it on a phone and nudge `width`/`top` in `MobilePathways.tsx` if the bottle sits too high/low or large/small. Plus the exact-token follow-up (still `≈`).
