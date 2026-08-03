"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted, looping, autoplaying <video> that only downloads and plays while
 * it is near the viewport. Ambient loops (the hero, the strawberries collage
 * clip) otherwise start fetching the instant they mount — via the native
 * `autoplay` attribute, which browsers honour regardless of CSS visibility —
 * even for a section's off-breakpoint twin sitting behind `hidden md:block` /
 * `md:hidden`, or a clip several screens below the fold. Deferring both the
 * `src`/`<source>` attachment AND playback to the same IntersectionObserver
 * fixes both: a `display:none` element never reports intersecting, so the
 * wrong-breakpoint twin never fetches at all, and below-the-fold clips wait
 * their turn. Resuming is invisible: the loop picks up exactly where it left
 * off as it scrolls back in (a generous rootMargin starts it a beat early).
 *
 * Drop-in for `<video autoPlay muted loop playsInline>` — pass className /
 * style / src / <source> children through as usual. Plays nicely with
 * AutoplayRescue: its kick only targets videos that have already started
 * loading, and the 'play' listener below re-pauses one kicked while off
 * screen.
 */
export default function AmbientVideo({
  src,
  children,
  ...props
}: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // React never writes the `muted` attribute into server-rendered HTML
    // (long-standing React quirk), so Safari parses an UNMUTED autoplay video,
    // refuses the attribute during load, and then rejects the observer's
    // play() below too (unmuted play() needs a user gesture). Re-assert it
    // imperatively before the first play attempt — a muted, playsInline video
    // may always start programmatically.
    v.muted = true;
    v.defaultMuted = true;
    let onScreen = false;
    // Something else (AutoplayRescue's gesture kick) may start the video while
    // it's off screen — put it straight back to sleep.
    const onPlay = () => {
      if (!onScreen) v.pause();
    };
    v.addEventListener("play", onPlay);
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          setShouldLoad(true);
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "50% 0px" }
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("play", onPlay);
    };
  }, []);

  // <source> children (or a src attribute) attached after mount need an
  // explicit load() before the browser will notice them.
  useEffect(() => {
    if (!shouldLoad) return;
    const v = ref.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [shouldLoad]);

  return (
    <video ref={ref} muted loop playsInline preload="none" {...props} src={shouldLoad ? src : undefined}>
      {shouldLoad ? children : null}
    </video>
  );
}
