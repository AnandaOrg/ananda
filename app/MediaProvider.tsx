"use client";

import { createContext, useContext } from "react";
import { extraMediaFor, resolveMediaAsset, type ExtraMediaItem, type MediaAsset, type MediaRow, type ResolvedAsset } from "@/lib/media/get-media-assets";

const MediaContext = createContext<Record<string, MediaAsset>>({});
const MediaByCategoryContext = createContext<Record<string, MediaRow[]>>({});

/** Hydrates the managed-image lookup for the whole tree — populated once, server-side,
 *  in the root layout (mirrors NextIntlClientProvider). */
export function MediaProvider({
  assets,
  byCategory,
  children,
}: {
  assets: Record<string, MediaAsset>;
  byCategory: Record<string, MediaRow[]>;
  children: React.ReactNode;
}) {
  return (
    <MediaContext.Provider value={assets}>
      <MediaByCategoryContext.Provider value={byCategory}>{children}</MediaByCategoryContext.Provider>
    </MediaContext.Provider>
  );
}

/** Resolves a managed image by its stable `public/` path. Client-component
 *  counterpart to calling `resolveMediaAsset(await getMediaAssets(), path)` directly
 *  in a server component. */
export function useMediaAsset(path: string): ResolvedAsset {
  const assets = useContext(MediaContext);
  return resolveMediaAsset(assets, path);
}

/** The backoffice-added images in `category` (i.e. not one of `knownPaths`, the
 *  component's own hardcoded list) — client-component counterpart to calling
 *  `extraMediaFor(await getMediaAssetsByCategory(), category, knownPaths)` directly
 *  in a server component. Only meaningful for the addable categories (see
 *  lib/media/addable.ts) — components elsewhere have no reason to call this. */
export function useExtraMedia(category: string, knownPaths: readonly string[]): ExtraMediaItem[] {
  const byCategory = useContext(MediaByCategoryContext);
  return extraMediaFor(byCategory, category, knownPaths);
}

/** For CSS mask-image / background-image sources: returns the resolved URL, or `null`
 *  when deactivated (caller falls back to no mask / no background-shape). */
export function useManagedMaskUrl(path: string): string | null {
  const { url, active } = useMediaAsset(path);
  return active ? url : null;
}

/** Wraps children in a new-tab link when `href` is populated; passes children through
 *  unchanged otherwise. `pointer-events: auto` re-enables clicks on anchors nested
 *  inside decorative `pointer-events: none` containers (e.g. FlavorModal's fruit art).
 *
 *  Pass `fill` when wrapping an absolutely-positioned image (next/image `fill`, or a
 *  plain `<img>` positioned via `absolute inset-0` / explicit crop coordinates) — a
 *  plain `<a>` is inline and sizes to its in-flow content, so around an out-of-flow
 *  (absolutely-positioned) child it collapses to near-zero size, leaving only a sliver
 *  clickable instead of the whole image. `fill` makes the anchor itself `absolute
 *  inset-0`, covering the same area as the image it wraps (its own parent must already
 *  be a positioned, sized container — true everywhere `fill` is used today). Omit for
 *  a normal in-flow image (e.g. Footer's logo), where a plain wrapping `<a>` already
 *  covers exactly the visible image, same as any ordinary `<a><img/></a>`. */
export function LinkWrap({ href, children, fill }: { href: string | null; children: React.ReactNode; fill?: boolean }) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={fill ? "absolute inset-0" : undefined}
      style={{ pointerEvents: "auto" }}
    >
      {children}
    </a>
  );
}
