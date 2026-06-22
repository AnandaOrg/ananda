"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as THREE_TYPES from "three";

gsap.registerPlugin(ScrollTrigger);

export type GlbViewerHandle = {
  spin: () => void;
  getRect: () => DOMRect;
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
  models,
  transitionDuration = 0.04,
  className,
  style,
}, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spinOffsetRef = useRef({ value: 0 });
  const spinTweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);
  const tiltRef = useRef({ value: -Math.PI / 2 });
  const tiltTlRef = useRef<gsap.core.Timeline | null>(null);
  const fracRef = useRef(0);

  useImperativeHandle(ref, () => ({
    spin() {
      spinTweenRef.current?.kill();
      const TAU = Math.PI * 2;
      const currentTotal = fracRef.current * TAU + spinOffsetRef.current.value;
      const targetTotal = (Math.ceil(currentTotal / TAU) + 4) * TAU;
      spinTweenRef.current = gsap.to(spinOffsetRef.current, {
        value: targetTotal - fracRef.current * TAU,
        duration: 2.2,
        ease: "sine.out",
      });

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
    if (!mount || models.length === 0) return;

    let dead = false;
    let renderer: THREE_TYPES.WebGLRenderer | null = null;
    let rafId = 0;
    let ro: ResizeObserver | null = null;
    let st: ReturnType<typeof ScrollTrigger.create> | null = null;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (dead) return;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

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

      const loader = new GLTFLoader();
      const gltfs = await Promise.all(models.map((m) => loader.loadAsync(m.src)));

      if (dead) return;

      function fitGroup(group: THREE_TYPES.Group) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        group.position.sub(center);
        group.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z));
        group.rotation.z = -Math.PI / 2;
      }

      const groups = gltfs.map((g) => g.scene as THREE_TYPES.Group);
      groups.forEach(fitGroup);

      // First model starts fully opaque; all others start transparent
      const allMats = groups.map((g, i) => cloneMaterials(g, i === 0 ? 1 : 0));

      groups.forEach((g, i) => {
        g.visible = i === 0;
        scene.add(g);
      });

      // Transition points for models[1], models[2], … (no entry for models[0])
      const transitionPoints = models.slice(1).map((m) => m.transitionAt ?? 0);

      let frustumH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 180 / 2);
      let frac = 0;

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

      const tick = () => {
        rafId = requestAnimationFrame(tick);

        fracRef.current = frac;

        const rawWorldY = frustumH * (0.5 - frac);
        const worldY = Math.max(-1.9, Math.min(1.9, rawWorldY));
        const rotation = frac * Math.PI * 2 + spinOffsetRef.current.value;

        groups.forEach((g, i) => {
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

          const opacity = blendIn * (1 - blendOut);

          g.position.y = worldY;
          g.rotation.x = rotation;
          g.rotation.z = tiltRef.current.value;
          g.visible = opacity > 0.01;
          allMats[i].forEach((m) => { m.opacity = opacity; });
        });

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
    // models must be a stable reference (module-level constant) from the caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, transitionDuration]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ overflow: "hidden", ...style }}
    />
  );
});

export default GlbViewer;
