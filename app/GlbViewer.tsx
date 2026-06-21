"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as THREE_TYPES from "three";

gsap.registerPlugin(ScrollTrigger);

export type GlbViewerHandle = {
  /** Adds a fast-decelerate spin burst on top of the scroll rotation. */
  spin: () => void;
  /** Viewport-relative bounding rect of the canvas mount element. */
  getRect: () => DOMRect;
};

type Props = {
  /** Primary model — shown during bands 1-3 */
  src: string;
  /** Secondary model — cross-fades in for band 4 */
  transitionSrc: string;
  /** Fraction [0-1] within the canvas at which the cross-fade begins. */
  transitionAt?: number;
  /** Canvas-fraction window over which the cross-fade completes. Default 0.04 (crisp). */
  transitionDuration?: number;
  className?: string;
  style?: React.CSSProperties;
};

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
  src,
  transitionSrc,
  transitionAt = 0.73,
  transitionDuration = 0.04,
  className,
  style,
}, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spinOffsetRef = useRef({ value: 0 });
  const spinTweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);
  // Z tilt: starts at -π/2 (lying on side), animated to 0 on click then back
  const tiltRef = useRef({ value: -Math.PI / 2 });
  const tiltTlRef = useRef<gsap.core.Timeline | null>(null);
  // Tracks the live scroll fraction so spin() can compute a 0°-landing target
  const fracRef = useRef(0);

  useImperativeHandle(ref, () => ({
    spin() {
      // ── Y-axis spin ──────────────────────────────────────────────────────
      spinTweenRef.current?.kill();
      const TAU = Math.PI * 2;
      const currentTotal = fracRef.current * TAU + spinOffsetRef.current.value;
      const targetTotal = (Math.ceil(currentTotal / TAU) + 4) * TAU;
      spinTweenRef.current = gsap.to(spinOffsetRef.current, {
        value: targetTotal - fracRef.current * TAU,
        duration: 2.2,
        ease: "sine.out",
      });

      // ── Z tilt: model rotates upright (→ 0°) then lies back down ─────────
      tiltTlRef.current?.kill();
      tiltTlRef.current = gsap.timeline()
        .to(tiltRef.current, { value: 0, duration: 1.0, ease: "sine.inOut" })
        .to(tiltRef.current, { value: -Math.PI / 2, duration: 1.0, ease: "sine.inOut" }, "+=0.1");
    },
    getRect() {
      return mountRef.current?.getBoundingClientRect() ?? new DOMRect();
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let dead = false;
    let renderer: THREE_TYPES.WebGLRenderer | null = null;
    let rafId = 0;
    let ro: ResizeObserver | null = null;
    let st: ReturnType<typeof ScrollTrigger.create> | null = null;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (dead) return;

      // ── Renderer ──────────────────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      // ── Scene / camera / lights ───────────────────────────────────────────
      const scene = new THREE.Scene();

      const CAM_Z = 7;
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

      // ── Load both models in parallel ──────────────────────────────────────
      const loader = new GLTFLoader();
      const [primaryGltf, secondaryGltf] = await Promise.all([
        loader.loadAsync(src),
        loader.loadAsync(transitionSrc),
      ]);

      if (dead) return;

      function fitGroup(group: THREE_TYPES.Group) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        group.position.sub(center);
        group.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z));
        // Lie on its side — matches original CSS rotate(-90deg) on the static pouches
        group.rotation.z = -Math.PI / 2;
      }

      const pGroup = primaryGltf.scene as THREE_TYPES.Group;
      const sGroup = secondaryGltf.scene as THREE_TYPES.Group;

      fitGroup(pGroup);
      fitGroup(sGroup);

      const pMats = cloneMaterials(pGroup, 1);
      const sMats = cloneMaterials(sGroup, 0);

      sGroup.visible = false;
      scene.add(pGroup);
      scene.add(sGroup);

      // ── Precompute frustum half-height ────────────────────────────────────
      let frustumH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 180 / 2);

      // Scroll fraction shared between ScrollTrigger and the RAF tick.
      // A plain closure variable is enough — both live inside this async block.
      let frac = 0;

      // ── Scroll trigger — only tracks frac, scene update lives in tick ─────
      st = ScrollTrigger.create({
        trigger: mount,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate() {
          const rect = mount.getBoundingClientRect();
          frac = Math.max(0, Math.min(1, (window.innerHeight * 0.5 - rect.top) / rect.height));
        },
      });

      // ── Resize ────────────────────────────────────────────────────────────
      ro = new ResizeObserver(() => {
        if (!renderer) return;
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        frustumH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 180 / 2);
        ScrollTrigger.refresh();
      });
      ro.observe(mount);

      // ── Render loop — applies frac + spinOffset every frame ──────────────
      const tick = () => {
        rafId = requestAnimationFrame(tick);

        // Keep fracRef in sync so spin() can read the current scroll position
        fracRef.current = frac;

        // Y position — model tracks viewport centre, clamped to avoid edge clipping
        const rawWorldY = frustumH * (0.5 - frac);
        const worldY = Math.max(-1.9, Math.min(1.9, rawWorldY));
        pGroup.position.y = worldY;
        sGroup.position.y = worldY;

        // Rotation — scroll-driven base + click-driven spin burst
        const rotation = frac * Math.PI * 2 + spinOffsetRef.current.value;
        pGroup.rotation.x = rotation;
        sGroup.rotation.x = rotation;

        // Z tilt — animated to 0° (upright) on click, returns to −90° (on side)
        pGroup.rotation.z = tiltRef.current.value;
        sGroup.rotation.z = tiltRef.current.value;

        // Cross-fade primary → secondary
        const blend = Math.max(0, Math.min(1, (frac - transitionAt) / transitionDuration));
        pMats.forEach((m) => { m.opacity = 1 - blend; });
        sMats.forEach((m) => { m.opacity = blend; });
        pGroup.visible = blend < 0.99;
        sGroup.visible = blend > 0.01;

        renderer!.render(scene, camera);
      };
      tick();
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(rafId);
      st?.kill();
      ro?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [src, transitionSrc, transitionAt, transitionDuration]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ overflow: "hidden", ...style }}
    />
  );
});

export default GlbViewer;
