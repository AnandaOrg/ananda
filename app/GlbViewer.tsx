"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import MediaSkeleton from "./MediaSkeleton";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as THREE_TYPES from "three";

gsap.registerPlugin(ScrollTrigger);

export type GlbViewerHandle = {
  spin: () => void;
  spin360: () => void;
  resetTilt: () => void;
  setTilt: (v: number) => void;
  getRect: () => DOMRect;
  getDominantIndex: () => number;
  suspend: () => void;
  resume: () => void;
};

export type ModelEntry = {
  src: string;
  transitionAt?: number;
};

type Props = {
  models: ModelEntry[];
  transitionDuration?: number;
  initialTilt?: number;
  noScroll?: boolean;
  spinOnMount?: boolean;
  activeIndex?: number;
  camZ?: number;
  scrollRef?: React.RefObject<HTMLElement | null>;
  scrollTravel?: string;
  onProgress?: (frac: number) => void;
  navDuration?: number;
  spinDuration?: number;
  dropCacheAfterParse?: boolean;
  deferInactiveLoads?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

let glbPreloaded: Promise<void> | null = null;
export function preloadGlb(srcs: string[]): Promise<void> {
  if (glbPreloaded) return glbPreloaded;
  glbPreloaded = (async () => {
    const THREE = await import("three");
    await import("three/examples/jsm/loaders/GLTFLoader.js");
    THREE.Cache.enabled = true;
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

/** Vertical field of view; shared by the camera and the pre-load pouch silhouette. */
const FOV_DEG = 38;
/** fitGroup() scales every model so its largest dimension spans this many world units. */
const FIT_SIZE = 2.0;

const SCROLL_TURNTABLE_TURNS_DESKTOP = 1;
const SCROLL_TURNTABLE_TURNS_PHONE = 0.65;

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
  deferInactiveLoads,
  className,
  style,
}, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spinOffsetRef = useRef({ value: 0 });
  const flipOffsetRef = useRef({ value: 0 });
  const tiltRef = useRef({ value: -Math.PI / 2 });
  const tiltTlRef = useRef<gsap.core.Timeline | null>(null);
  const fracRef = useRef(0);
  const dominantIndexRef = useRef(activeIndex ?? 0);
  const onProgressRef = useRef(onProgress);
  const [ready, setReady] = useState(false);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  const activeRef = useRef(activeIndex ?? 0);
  const prevActiveRef = useRef(activeIndex ?? 0);
  const blendRef = useRef({ value: 1 });
  const ensureModelRef = useRef<((i: number) => void) | null>(null);
  const suspendRef = useRef<(() => void) | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    spin() {
      tiltTlRef.current?.kill();
      tiltTlRef.current = gsap.timeline()
        .to(tiltRef.current, { value: 0, duration: 2.4, ease: "sine.inOut" });
    },
    spin360() {
      gsap.to(spinOffsetRef.current, {
        value: spinOffsetRef.current.value + Math.PI * 2,
        duration: 1.7,
        ease: "power2.inOut",
      });
    },
    resetTilt() {
      tiltTlRef.current?.kill();
      tiltTlRef.current = gsap.timeline()
        .to(tiltRef.current, { value: -Math.PI / 2, duration: 2.0, ease: "sine.inOut" });
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
    suspend() {
      suspendRef.current?.();
    },
    resume() {
      resumeRef.current?.();
    },
  }));

  useEffect(() => {
    if (activeIndex === undefined) return;
    const prev = activeRef.current;
    tiltTlRef.current?.kill();
    tiltRef.current.value = initialTilt ?? -Math.PI / 2;
    const dur = navDuration ?? 0.7;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    if (prev !== activeIndex) {
      prevActiveRef.current = prev;
      activeRef.current = activeIndex;
      blendRef.current.value = 0;
      gsap.to(blendRef.current, { value: 1, duration: dur, ease: "power1.inOut" });
      loadTimer = setTimeout(
        () => ensureModelRef.current?.(activeIndex),
        dur * 1000 + 250
      );
    } else {
      activeRef.current = activeIndex;
      blendRef.current.value = 1;
    }
    gsap.to(flipOffsetRef.current, {
      value: flipOffsetRef.current.value + Math.PI * 2,
      duration: spinDuration ?? dur,
      ease: "power2.inOut",
    });
    return () => { if (loadTimer) clearTimeout(loadTimer); };
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
    let nearIo: IntersectionObserver | null = null;

    const init = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (dead) return;

      const isPhone = window.matchMedia("(max-width: 767px)").matches;
      renderer = new THREE.WebGLRenderer({
        antialias: !isPhone,
        alpha: true,
        powerPreference: "high-performance",
      });
      const maxDpr = isPhone ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      const CAM_Z = camZ ?? 7;
      const FOV = FOV_DEG;
      const camera = new THREE.PerspectiveCamera(FOV, mount.clientWidth / mount.clientHeight, 0.01, 1000);
      camera.position.set(0, 0, CAM_Z);

      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const key = new THREE.DirectionalLight(0xffffff, 4);
      key.position.set(4, 6, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xfff0e5, 2);
      rim.position.set(-4, -2, 3);
      scene.add(rim);

      THREE.Cache.enabled = true;
      const loader = new GLTFLoader();

      function fitGroup(group: THREE_TYPES.Group) {
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        // Move the model's bounding-box center onto the group's origin via an
        // inner pivot, so the per-frame spin/tilt (applied to `group`) rotates
        // about the true center no matter where the GLB's own origin sits.
        const pivot = new THREE.Group();
        pivot.add(...group.children);
        pivot.position.copy(center).negate();
        group.add(pivot);
        group.position.set(0, 0, 0);
        group.scale.setScalar(FIT_SIZE / Math.max(size.x, size.y, size.z));
        group.rotation.order = "XZY";
        group.rotation.z = -Math.PI / 2;
      }

      const useSelect = activeIndex !== undefined;
      const startIndex = activeIndex ?? 0;

      const spin = () => {
        gsap.to(spinOffsetRef.current, {
          value: spinOffsetRef.current.value + Math.PI * 2,
          duration: 0.7,
          ease: "power2.inOut",
        });
      };

      const groups: (THREE_TYPES.Group | undefined)[] = new Array(models.length);
      const allMats: (THREE_TYPES.MeshStandardMaterial[] | undefined)[] = new Array(models.length);
      const flipGroups: (THREE_TYPES.Group | undefined)[] = new Array(models.length);

      let loadedCount = 0;
      let forceRender = true;

      const install = async (scn: THREE_TYPES.Group, i: number, opaque: boolean) => {
        fitGroup(scn);
        allMats[i] = cloneMaterials(scn, opaque ? 1 : 0);
        scn.visible = true;
        const flipGroup = new THREE.Group();
        flipGroup.add(scn);
        scene.add(flipGroup);
        if (typeof renderer!.compileAsync === "function") {
          await renderer!.compileAsync(scene, camera);
        } else {
          renderer!.compile(scene, camera);
        }
        if (dead) return;
        renderer!.render(scene, camera);
        scn.visible = opaque;
        groups[i] = scn;
        flipGroups[i] = flipGroup;
        loadedCount++;
        if (loadedCount === 1) setReady(true);
        forceRender = true;
      };

      if (useSelect) {
        const activeGltf = await loader.loadAsync(models[startIndex].src);
        if (dead) return;
        if (spinOnMount) spin();
        await install(activeGltf.scene as THREE_TYPES.Group, startIndex, true);
        if (dead) return;
        if (dropCacheAfterParse) THREE.Cache.remove(models[startIndex].src);
        const evictFar = () => {
          for (let i = 0; i < models.length; i++) {
            const g = groups[i];
            if (!g || i === activeRef.current || i === prevActiveRef.current) continue;
            const flip = flipGroups[i];
            if (flip) scene.remove(flip);
            g.traverse((child) => {
              const mesh = child as THREE_TYPES.Mesh;
              if (mesh.isMesh) mesh.geometry?.dispose();
            });
            allMats[i]?.forEach((m) => {
              m.map?.dispose();
              m.normalMap?.dispose();
              m.roughnessMap?.dispose();
              m.metalnessMap?.dispose();
              m.aoMap?.dispose();
              m.emissiveMap?.dispose();
              m.dispose();
            });
            groups[i] = undefined;
            allMats[i] = undefined;
            flipGroups[i] = undefined;
            loadedCount--;
            forceRender = true;
          }
        };

        const inFlight = new Set<number>();
        const ensure = async (i: number) => {
          if (dead || groups[i] || inFlight.has(i)) return;
          inFlight.add(i);
          try {
            const g = await loader.loadAsync(models[i].src);
            if (dead) return;
            await install(g.scene as THREE_TYPES.Group, i, false);
            if (dropCacheAfterParse) THREE.Cache.remove(models[i].src);
            if (deferInactiveLoads) evictFar();
          } catch {
          } finally {
            inFlight.delete(i);
          }
        };
        if (deferInactiveLoads) {
          ensureModelRef.current = (i) => { void ensure(i); };
          if (activeRef.current !== startIndex) void ensure(activeRef.current);
        } else {
          void (async () => {
            for (let i = 0; i < models.length; i++) {
              if (i === startIndex || dead) continue;
              await ensure(i);
            }
          })();
        }
      } else {
        for (let i = 0; i < models.length; i++) {
          try {
            const gltf = await loader.loadAsync(models[i].src);
            if (dead) return;
            if (i === startIndex && spinOnMount) spin();
            await install(gltf.scene as THREE_TYPES.Group, i, i === startIndex);
            if (dead) return;
            if (dropCacheAfterParse) THREE.Cache.remove(models[i].src);
          } catch (err) {
            console.error(`GlbViewer: failed to load ${models[i].src}`, err);
          }
        }
      }

      const transitionPoints = models.slice(1).map((m) => m.transitionAt ?? 0);

      let frac = 0;
      let lastTransformFrac = -1;

      if (!noScroll) {
        const scrollEl = scrollRef?.current ?? mount;
        const computeFrac = () => {
          const rect = scrollEl.getBoundingClientRect();
          frac = Math.max(0, Math.min(1, (window.innerHeight * 0.5 - rect.top) / rect.height));
          onProgressRef.current?.(frac);
        };
        st = ScrollTrigger.create({
          trigger: scrollEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          onUpdate: computeFrac,
          onRefresh: computeFrac,
        });
        computeFrac();
      }

      let suspended = false;

      ro = new ResizeObserver(() => {
        if (!renderer || suspended) return;
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        forceRender = true;
        if (!noScroll) ScrollTrigger.refresh();
      });
      ro.observe(mount);

      let lastFrac = NaN;
      let lastSpin = NaN;
      let lastFlip = NaN;
      let lastTilt = NaN;
      let lastBlend = NaN;
      let lastLoaded = -1;

      const tick = () => {
        rafId = requestAnimationFrame(tick);

        fracRef.current = frac;

        const rotFrac = noScroll ? 0 : frac;
        const turntableY = rotFrac * Math.PI * 2 * (isPhone ? SCROLL_TURNTABLE_TURNS_PHONE : SCROLL_TURNTABLE_TURNS_DESKTOP);
        const spinY = spinOffsetRef.current.value;
        const flipY = flipOffsetRef.current.value;
        const tilt = tiltRef.current.value;
        const blend = blendRef.current.value;

        if (
          !forceRender &&
          frac === lastFrac &&
          spinY === lastSpin &&
          flipY === lastFlip &&
          tilt === lastTilt &&
          blend === lastBlend &&
          loadedCount === lastLoaded
        ) {
          return;
        }
        forceRender = false;
        lastFrac = frac;
        lastSpin = spinY;
        lastFlip = flipY;
        lastTilt = tilt;
        lastBlend = blend;
        lastLoaded = loadedCount;

        if (!noScroll && scrollTravel && frac !== lastTransformFrac) {
          lastTransformFrac = frac;
          mount.style.transform = `translateY(calc(${scrollTravel} * ${frac}))`;
        }

        let dominantI = dominantIndexRef.current;
        let dominantOpacity = -1;
        groups.forEach((g, i) => {
          const mats = allMats[i];
          if (!g || !mats) return;
          let opacity: number;
          if (useSelect) {
            opacity = i === activeRef.current ? blend : (i === prevActiveRef.current ? 1 - blend : 0);
          } else {
            const blendIn =
              i === 0
                ? 1
                : Math.max(0, Math.min(1, (frac - transitionPoints[i - 1]) / transitionDuration));
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
          g.rotation.z = tilt;
          g.visible = opacity > 0.01;
          mats.forEach((m) => { m.opacity = opacity; });

          const flip = flipGroups[i];
          if (flip) flip.rotation.y = useSelect ? flipY : 0;
        });
        dominantIndexRef.current = dominantI;

        renderer!.render(scene, camera);
      };
      tick();

      suspendRef.current = () => {
        if (dead || suspended || !renderer) return;
        suspended = true;
        cancelAnimationFrame(rafId);
        renderer.forceContextLoss();
      };
      resumeRef.current = () => {
        if (dead || !suspended || !renderer) return;
        suspended = false;
        renderer.domElement.addEventListener(
          "webglcontextrestored",
          () => { forceRender = true; },
          { once: true },
        );
        renderer.forceContextRestore();
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        forceRender = true;
        tick();
      };
    };

    const startWhenNear = () => {
      if (dead) return;
      if (noScroll || typeof IntersectionObserver === "undefined") {
        init();
        return;
      }
      nearIo = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            nearIo?.disconnect();
            nearIo = null;
            init();
          }
        },
        { rootMargin: "200% 0px" },
      );
      nearIo.observe(mount);
    };

    const tryStart = () => {
      if (dead) return;
      if (mount.clientWidth > 0 && mount.clientHeight > 0) {
        startRo?.disconnect();
        startRo = null;
        startWhenNear();
      } else if (!startRo) {
        startRo = new ResizeObserver(() => tryStart());
        startRo.observe(mount);
      }
    };
    tryStart();

    return () => {
      dead = true;
      ensureModelRef.current = null;
      suspendRef.current = null;
      resumeRef.current = null;
      cancelAnimationFrame(rafId);
      st?.kill();
      ro?.disconnect();
      startRo?.disconnect();
      nearIo?.disconnect();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [models, transitionDuration, initialTilt, noScroll, camZ, scrollRef, scrollTravel, dropCacheAfterParse, deferInactiveLoads]);

  // Pouch-silhouette skeleton until the first model is installed. Its height is the
  // fitted model's on-screen height (FIT_SIZE units out of the camera's visible
  // height at z=0), and it is turned by the initial tilt so it lies the way the
  // pouch will. The Three canvas is appended after it, so it paints on top.
  const camDist = camZ ?? 7;
  const pouchHeightPct = (FIT_SIZE / (2 * camDist * Math.tan((FOV_DEG / 2) * (Math.PI / 180)))) * 100;
  const tilt = initialTilt ?? -Math.PI / 2;

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <div
        aria-hidden="true"
        className="glb-skeleton"
        style={{ height: `${pouchHeightPct.toFixed(2)}%`, transform: `translate(-50%, -50%) rotate(${-tilt}rad)` }}
      >
        <MediaSkeleton hidden={ready} />
      </div>
    </div>
  );
});

export default GlbViewer;
