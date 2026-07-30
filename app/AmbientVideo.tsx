"use client";

import { useEffect, useRef } from "react";

/**
 * A muted, looping, autoplaying <video> that actually plays only while it is
 * near the viewport. Ambient loops (the hero, the strawberries collage clip)
 * otherwise keep decoding frames for the whole session even when they sit
 * several screens away — on phones that is constant CPU/battery drain
 * competing with the scroll-driven animations. Pausing off-screen is
 * invisible: the loop resumes exactly where it left off as it scrolls back in
 * (a generous rootMargin restarts it a beat early).
 *
 * Drop-in for `<video autoPlay muted loop playsInline>` — pass className /
 * style / src / <source> children through as usual. Plays nicely with
 * AutoplayRescue: its kick only targets videos that have never started, and
 * the 'play' listener below re-pauses one kicked while off screen.
 */
export default function AmbientVideo(props: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const ref = useRef<HTMLVideoElement>(null);

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
    let onScreen = true;
    // Something else (AutoplayRescue's gesture kick) may start the video while
    // it's off screen — put it straight back to sleep.
    const onPlay = () => {
      if (!onScreen) v.pause();
    };
    v.addEventListener("play", onPlay);
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "50% 0px" }
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("play", onPlay);
    };
  }, []);

  return <video ref={ref} autoPlay muted loop playsInline {...props} />;
}
