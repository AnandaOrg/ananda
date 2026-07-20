"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as THREE_TYPES from "three";

gsap.registerPlugin(ScrollTrigger);

export type GlbViewerHandle = {
  spin: () => void;
  spin360: () => void;
  resetTilt: () => void;
  /** Set the Z-tilt immediately (no tween) — for scroll-scrubbed control. */
  setTilt: (v: number) => void;
  getRect: () => DOMRect;
  /** Index of the model currently rendered most opaque (the one actually on
   *  screen). Reflects the live cross-fade, not the scroll fraction — use it to
   *  act only once a specific model is really visible. */
  getDominantIndex: () => number;
};

export type ModelEntry = {
  src: string;
  /** Canvas fraction [0-1] at which this model starts blending in from the previous one. Omit for the first model. */
  transitionAt?: number;
};

type Props = {
  models: ModelEntry[];
  /** Fraction window over which each cross-fade completes. Default 0.04. */
  transitionDuration?: number;
  /** Initial Z-tilt in radians. Default -π/2 (lying flat). Pass 0 for upright. */
  initialTilt?: number;
  /** When true: skip ScrollTrigger, centre model vertically, no scroll-driven X rotation. */
  noScroll?: boolean;
  /** Spin 360° each time a model finishes loading (initial mount and every models swap). */
  spinOnMount?: boolean;
  /** Index-select mode: load ALL `models` once, show `models[activeIndex]`, and
   *  cross-fade + spin when it changes — no reload. `models` must be stable.
   *  When set it overrides the scroll-driven transitionAt blending. */
  activeIndex?: number;
  /** Camera distance on Z. Larger = more frustum headroom (model can travel
   *  further vertically without clipping). Default 7. Grow the canvas height
   *  proportionally to keep the on-screen size the same. */
  camZ?: number;
  /** Element whose scroll position drives the cross-fade/position progress.
   *  Defaults to the canvas mount. Pass a fixed band-region element to keep the
   *  flavour timing independent of the canvas geometry. */
  scrollRef?: React.RefObject<HTMLElement | null>;
  /** Scroll-mode only. CSS length the whole canvas translates down over the
   *  full scroll (frac 0→1) to ride the bands. The model stays centred, so it
   *  never leaves the framebuffer; the canvas moves instead. e.g. `u(965)`. */
  scrollTravel?: string;
  /** Scroll-mode only. Fires on every scroll update with the current 0→1
   *  progress (the same value driving the blend), so a caller can react to
   *  crossing a particular model's transitionAt without re-deriving frac. */
  onProgress?: (frac: number) => void;
  /** Index-select mode: seconds for the colour cross-fade on activeIndex
   *  change. Match the caller's modal transition so the bottle and the
   *  background/scene change in lockstep. Default 0.7. */
  navDuration?: number;
  /** Index-select mode: seconds for the left-to-right turntable spin on
   *  activeIndex change. Defaults to `navDuration`. Pass the modal's
   *  bounce-back duration so the bottle finishes its spin exactly as the
   *  wheel swing settles. */
  spinDuration?: number;
  /** Free each GLB's downloaded bytes from THREE.Cache once it's parsed into the
   *  scene. Set on memory-constrained (mobile) viewers so the ~30MB/model
   *  ArrayBuffers don't linger after upload. Leave off where the modal reuses
   *  the same cached bytes (desktop). */
  dropCacheAfterParse?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

let glbPreloaded: Promise<void> | null = null;
/**
 * Warm the three.js + GLTFLoader chunks and the THREE.Cache / browser copies of
 * the given GLB files, so a GlbViewer that later loads them shows without the
 * (multi-MB) download + chunk-import wait. Call it while the page is idle, ahead
 * of opening the modal. Idempotent — repeated calls reuse the first promise.
 */
export function preloadGlb(srcs: string[]): Promise<void> {
  if (glbPreloaded) return glbPreloaded;
  glbPreloaded = (async () => {
    const THREE = await import("three");
    // Warm the GLTFLoader chunk too — init() awaits this same dynamic import.
    await import("three/examples/jsm/loaders/GLTFLoader.js");
    THREE.Cache.enabled = true; // so the modal's loader reuses these bytes
    const fl = new THREE.FileLoader();
    fl.setResponseType("arraybuffer");
    await Promise.all(srcs.map((s) => fl.loadAsync(s).then(() => undefined).catch(() => undefined)));
  })();
  return glbPreloaded;
}

function cloneMaterials(
  group: THREE_TYPES.Group,
  initialOpacity: number
): THREE_TYPES.MeshStandardMaterial[] {
  const map = new Map<THREE_TYPES.Material, THREE_TYPES.MeshStandardMaterial>();

  group.traverse((child) => {
    const mesh = child as THREE_TYPES.Mesh;
    if (!mesh.isMesh) return;
    const slots = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    slots.forEach((m) => {
      if (map.has(m)) return;
      const c = (m as THREE_TYPES.MeshStandardMaterial).clone();
      c.transparent = true;
      c.opacity = initialOpacity;
      map.set(m, c);
    });
  });

  group.traverse((child) => {
    const mesh = child as THREE_TYPES.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => map.get(m) ?? m) as THREE_TYPES.Material[];
    } else {
      mesh.material = map.get(mesh.material) ?? mesh.material;
    }
  });

  return Array.from(map.values());
}

const GlbViewer = forwardRef<GlbViewerHandle, Props>(function GlbViewer({
  models,
  transitionDuration = 0,
  initialTilt,
  noScroll,
  spinOnMount,
  activeIndex,
  camZ,
  scrollRef,
  scrollTravel,
  onProgress,
  navDuration,
  spinDuration,
  dropCacheAfterParse,
  className,
  style,
}, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spinOffsetRef = useRef({ value: 0 });
  const flipOffsetRef = useRef({ value: 0 });
  const tiltRef = useRef({ value: -Math.PI / 2 });
  const tiltTlRef = useRef<gsap.core.Timeline | null>(null);
  const fracRef = useRef(0);
  // Index of the model rendered most opaque this frame (the one actually on
  // screen). Updated in the render loop; surfaced via getDominantIndex().
  const dominantIndexRef = useRef(activeIndex ?? 0);
  // Latest onProgress in a ref so the scroll-effect below (which must stay
  // stable — re-running it reloads every GLB) can call a fresh callback
  // without needing it in its own dependency array.
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  // Index-select mode cross-fade: which model is active, which one we're fading
  // from, and the 0→1 blend progress (tweened on nav so it matches the modal).
  const activeRef = useRef(activeIndex ?? 0);
  const prevActiveRef = useRef(activeIndex ?? 0);
  const blendRef = useRef({ value: 1 });

  useImperativeHandle(ref, () => ({
    spin() {
      tiltTlRef.current?.kill();
      tiltTlRef.current = gsap.timeline()
        .to(tiltRef.current, { value: 0, duration: 1.0, ease: "sine.inOut" });
    },
    spin360() {
      gsap.to(spinOffsetRef.current, {
        value: spinOffsetRef.current.value + Math.PI * 2,
        duration: 0.7,
        ease: "power2.inOut",
      });
    },
    resetTilt() {
      tiltTlRef.current?.kill();
      tiltTlRef.current = gsap.timeline()
        .to(tiltRef.current, { value: -Math.PI / 2, duration: 0.8, ease: "sine.inOut" });
    },
    setTilt(v: number) {
      tiltTlRef.current?.kill();
      tiltRef.current.value = v;
    },
    getRect() {
      return mountRef.current?.getBoundingClientRect() ?? new DOMRect();
    },
    getDominantIndex() {
      return dominantIndexRef.current;
    },
  }));

  // Index-select mode: when activeIndex changes (incl. first mount) point the
  // render loop at the new model, reset its tilt to rest, and spin a full
  // left-to-right turntable turn. The model is already loaded, so this never
  // reloads — just a cross-fade underneath the spin.
  useEffect(() => {
    if (activeIndex === undefined) return;
    const prev = activeRef.current;
    tiltTlRef.current?.kill();
    tiltRef.current.value = initialTilt ?? -Math.PI / 2;
    const dur = navDuration ?? 0.7;
    if (prev !== activeIndex) {
      // Nav: cross-fade prev→new with the SAME duration + easing as the modal's
      // background/scene, so the bottle colour changes in lockstep (not early).
      prevActiveRef.current = prev;
      activeRef.current = activeIndex;
      blendRef.current.value = 0;
      gsap.to(blendRef.current, { value: 1, duration: dur, ease: "power1.inOut" });
    } else {
      // First mount: already showing the right model — no cross-fade.
      activeRef.current = activeIndex;
      blendRef.current.value = 1;
    }
    // Spin a full left-to-right turntable turn instead of swinging the canvas
    // out of frame — the bottle stays on screen the whole time. Timed to
    // spinDuration (the modal's bounce-back) so it lands right as the wheel
    // swing settles.
    gsap.to(flipOffsetRef.current, {
      value: flipOffsetRef.current.value + Math.PI * 2,
      duration: spinDuration ?? dur,
      ease: "power2.inOut",
    });
  }, [activeIndex, initialTilt, navDuration, spinDuration]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || models.length === 0) return;

    tiltRef.current.value = initialTilt ?? -Math.PI / 2;

    let dead = false;
    let renderer: THREE_TYPES.WebGLRenderer | null = null;
    let rafId = 0;
    let ro: ResizeObserver | null = null;
    let st: ReturnType<typeof ScrollTrigger.create> | null = null;
    let startRo: ResizeObserver | null = null;

    const init = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (dead) return;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      // Cap DPR lower on phones: at 2× the framebuffer + every uploaded texture
      // doubles in memory, which is what tips iOS Safari over its per-tab budget
      // when four models are resident at once. 1.5× is visually indistinguishable
      // on the small pouch.
      const maxDpr = window.matchMedia("(max-width: 767px)").matches ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      const CAM_Z = camZ ?? 7;
      const FOV = 38;
      const camera = new THREE.PerspectiveCamera(FOV, mount.clientWidth / mount.clientHeight, 0.01, 1000);
      camera.position.set(0, 0, CAM_Z);

      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const key = new THREE.DirectionalLight(0xffffff, 4);
      key.position.set(4, 6, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xfff0e5, 2);
      rim.position.set(-4, -2, 3);
      scene.add(rim);

      // Reuse any bytes warmed by preloadGlb() (see above) instead of
      // re-downloading — this is what makes the modal's pouch appear promptly.
      THREE.Cache.enabled = true;
      const loader = new GLTFLoader();

      function fitGroup(group: THREE_TYPES.Group) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        group.position.sub(center);
        group.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z));
        // 'XZY' order applies Y last, so the Y-turntable spins around true
        // world-vertical (after the Z tilt orients the bottle) — a clean
        // turntable rather than a wobble.
        group.rotation.order = "XZY";
        group.rotation.z = -Math.PI / 2;
      }

      // Index-select mode (modal): show models[activeIndex] and cross-fade on
      // change. Otherwise scroll-blend mode (Pathways): model 0 starts opaque.
      const useSelect = activeIndex !== undefined;
      const startIndex = activeIndex ?? 0;

      // Spin a full turn each time a model loads (initial mount + each swap).
      // Relative (+2π) so it fires every reload, not just the first.
      const spin = () => {
        gsap.to(spinOffsetRef.current, {
          value: spinOffsetRef.current.value + Math.PI * 2,
          duration: 0.7,
          ease: "power2.inOut",
        });
      };

      // groups[i]/allMats[i] fill in as each model loads. In index-select mode
      // the active model loads first and the rest stream in behind it, so these
      // arrays stay sparse briefly — the render loop iterates with forEach, which
      // skips the holes, so a not-yet-loaded model simply isn't drawn.
      const groups: (THREE_TYPES.Group | undefined)[] = new Array(models.length);
      const allMats: (THREE_TYPES.MeshStandardMaterial[] | undefined)[] = new Array(models.length);
      // Index-select mode only: an empty parent per model that carries ONLY the
      // nav turntable spin. scn keeps its own rotation (tilt, etc.) untouched;
      // the spin is composed on top via the parent transform, so it's a true
      // world-Y (left-to-right) rotation no matter what scn's own rotation/order
      // is doing.
      const flipGroups: (THREE_TYPES.Group | undefined)[] = new Array(models.length);

      // Fit, clone materials (opaque only for the shown model), add to the scene,
      // then warm the GPU for it (compile shaders + upload geometry/textures) so
      // its first visible frame never hitches. Registered in `groups` last, so
      // the tick loop only picks it up once it's fully ready.
      const install = async (scn: THREE_TYPES.Group, i: number, opaque: boolean) => {
        fitGroup(scn);
        allMats[i] = cloneMaterials(scn, opaque ? 1 : 0);
        scn.visible = true; // visible for the compile/upload pass
        const flipGroup = new THREE.Group();
        flipGroup.add(scn);
        scene.add(flipGroup);
        if (typeof renderer!.compileAsync === "function") {
          await renderer!.compileAsync(scene, camera);
        } else {
          renderer!.compile(scene, camera);
        }
        scn.visible = opaque; // the tick loop manages visibility from opacity hereafter
        groups[i] = scn;
        flipGroups[i] = flipGroup;
      };

      if (useSelect) {
        // Active-first: load + show the opened flavour ASAP, then stream the
        // rest in the background for the nav cross-fade. Time-to-first-pouch
        // now costs one model (~30MB) instead of all four (~110MB).
        const activeGltf = await loader.loadAsync(models[startIndex].src);
        if (dead) return;
        if (spinOnMount) spin();
        await install(activeGltf.scene as THREE_TYPES.Group, startIndex, true);
        if (dead) return;
        renderer.render(scene, camera); // first paint: the opened pouch
        void (async () => {
          for (let i = 0; i < models.length; i++) {
            if (i === startIndex || dead) continue;
            try {
              const g = await loader.loadAsync(models[i].src);
              if (dead) return;
              await install(g.scene as THREE_TYPES.Group, i, false);
            } catch {
              /* leave a hole — navigating to it will just show nothing */
            }
          }
        })();
      } else {
        // Scroll-blend (Pathways): every model must be ready before blending.
        // Load + install them ONE AT A TIME rather than Promise.all — the latter
        // holds all four (~110MB) of ArrayBuffers in flight at once, spiking peak
        // memory past iOS Safari's ceiling. Sequential keeps only one download
        // buffer live, and dropCacheAfterParse frees each once it's on the GPU.
        for (let i = 0; i < models.length; i++) {
          const gltf = await loader.loadAsync(models[i].src);
          if (dead) return;
          if (i === startIndex && spinOnMount) spin();
          await install(gltf.scene as THREE_TYPES.Group, i, i === startIndex);
          if (dead) return;
          if (dropCacheAfterParse) THREE.Cache.remove(models[i].src);
          // Paint as soon as the first (shown) model is ready so the section
          // isn't blank while the rest stream in behind it.
          if (i === startIndex) renderer.render(scene, camera);
        }
        renderer.render(scene, camera);
      }

      // Transition points for models[1], models[2], … (no entry for models[0])
      const transitionPoints = models.slice(1).map((m) => m.transitionAt ?? 0);

      let frac = 0;
      let lastTransformFrac = -1; // only rewrite the canvas transform when scroll actually moves

      if (!noScroll) {
        // Drive scroll progress from a fixed reference (the band region) when
        // provided, so the cross-fade timing stays locked to the bands no matter
        // how the canvas itself is sized/positioned for the bottle's placement.
        const scrollEl = scrollRef?.current ?? mount;
        st = ScrollTrigger.create({
          trigger: scrollEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          onUpdate() {
            const rect = scrollEl.getBoundingClientRect();
            frac = Math.max(0, Math.min(1, (window.innerHeight * 0.5 - rect.top) / rect.height));
            onProgressRef.current?.(frac);
          },
        });
      }

      ro = new ResizeObserver(() => {
        if (!renderer) return;
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (!noScroll) ScrollTrigger.refresh();
      });
      ro.observe(mount);

      const tick = () => {
        rafId = requestAnimationFrame(tick);

        fracRef.current = frac;

        // The model stays vertically CENTRED in the canvas (never reaches the
        // framebuffer edge → no clipping). Band tracking is done by translating
        // the whole canvas in CSS (below). Scroll drives a TURNTABLE on Y (model
        // stays upright); the spin offset (nav / spinOnMount / spin360) adds to it.
        const rotFrac = noScroll ? 0 : frac;
        const turntableY = rotFrac * Math.PI * 2;
        const spinY = spinOffsetRef.current.value;

        // Ride the bands by moving the canvas, not the model. Only rewrite the
        // transform when the scroll position actually changes — writing the
        // container-query calc() every frame forces a continuous style recalc
        // that janks the rotate/spin (which run while frac is constant).
        if (!noScroll && scrollTravel && frac !== lastTransformFrac) {
          lastTransformFrac = frac;
          mount.style.transform = `translateY(calc(${scrollTravel} * ${frac}))`;
        }

        let dominantI = dominantIndexRef.current;
        let dominantOpacity = -1;
        groups.forEach((g, i) => {
          const mats = allMats[i];
          if (!g || !mats) return; // not loaded yet (streaming in the background)
          let opacity: number;
          if (useSelect) {
            // Cross-fade driven by the blend tween: new model fades in, the one
            // we left fades out, everything else stays hidden. Same eased curve
            // and duration as the modal's bg/scene → they change together.
            const b = blendRef.current.value;
            opacity = i === activeRef.current ? b : (i === prevActiveRef.current ? 1 - b : 0);
          } else {
            // blendIn: 1 for first model; for others, ramps from 0→1 as frac crosses its transitionAt
            const blendIn =
              i === 0
                ? 1
                : Math.max(0, Math.min(1, (frac - transitionPoints[i - 1]) / transitionDuration));
            // blendOut: 0 for last model; for others, ramps from 0→1 as frac crosses the NEXT transitionAt
            const blendOut =
              i >= transitionPoints.length
                ? 0
                : Math.max(0, Math.min(1, (frac - transitionPoints[i]) / transitionDuration));

            opacity = blendIn * (1 - blendOut);
          }

          if (opacity > dominantOpacity) {
            dominantOpacity = opacity;
            dominantI = i;
          }

          g.position.y = 0;
          g.rotation.y = spinY + turntableY;
          g.rotation.z = tiltRef.current.value;
          g.visible = opacity > 0.01;
          mats.forEach((m) => { m.opacity = opacity; });

          // The nav flip lives on the empty parent, never on `g` itself — a
          // rotation on a group whose only other transform is identity is a
          // guaranteed true left-to-right turntable, regardless of g's own
          // rotation/order.
          const flip = flipGroups[i];
          if (flip) flip.rotation.y = useSelect ? flipOffsetRef.current.value : 0;
        });
        dominantIndexRef.current = dominantI;

        renderer!.render(scene, camera);
      };
      tick();
    };

    // Don't allocate a WebGL context or parse the (large) GLBs while the mount
    // is hidden (display:none → 0×0). Both the desktop and mobile Pathways/modal
    // viewers live in the DOM at once; this lets only the visible one load.
    const tryStart = () => {
      if (dead) return;
      if (mount.clientWidth > 0 && mount.clientHeight > 0) {
        startRo?.disconnect();
        startRo = null;
        init();
      } else if (!startRo) {
        startRo = new ResizeObserver(() => tryStart());
        startRo.observe(mount);
      }
    };
    tryStart();

    return () => {
      dead = true;
      cancelAnimationFrame(rafId);
      st?.kill();
      ro?.disconnect();
      startRo?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    // models/initialTilt/noScroll must be stable (module-level constants or literals) from the caller.
    // spinOnMount is intentionally omitted — it's a one-shot flag captured at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, transitionDuration, initialTilt, noScroll, camZ, scrollRef, scrollTravel, dropCacheAfterParse]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ overflow: "hidden", ...style }}
    />
  );
});

export default GlbViewer;
