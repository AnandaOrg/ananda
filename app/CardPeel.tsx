"use client";

import { SkeletonImage } from "./MediaSkeleton";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  { src: "/hero_3/5.png",       w: 960,  h: 1104 },
  { src: "/hero_3/4.png",       w: 1856, h: 2304 },
  { src: "/hero_3/3.png",       w: 1856, h: 2304 },
  { src: "/hero_3/2.png",       w: 1856, h: 2304 },
  { src: "/hero_3/1.png",       w: 2048, h: 2677 },
  { src: "/ananda-pour.png",    w: 2392, h: 2724 },
];

const STACK_ROTATIONS = [3, -5, 2, -3, 0, 4];

const maskCss = {
  maskImage: "url(/m-photo-card.svg)",
  WebkitMaskImage: "url(/m-photo-card.svg)",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
} as const;

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function CardPeel({ className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const allCards = gsap.utils.toArray<HTMLElement>(".card-peel", containerRef.current);
      const pourCard = allCards[allCards.length - 1];
      const peelable = allCards.slice(1, -1).reverse();

      gsap.set(pourCard, {
        y: -window.innerHeight * 1.1,
        x: "12vw",
        scale: 0.35,
        opacity: 0,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 100%",
          end: "bottom 10%",
          scrub: 1,
        },
      });

      tl.to(pourCard, {
        y: 0,
        x: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        duration: 1.5,
      });

      tl.to(
        pourCard,
        {
          rotationY: -175,
          transformOrigin: "0% 50%",
          z: 80,
          ease: "power2.inOut",
          duration: 1,
        },
        1.6
      );

      peelable.forEach((card, i) => {
        tl.to(
          card,
          {
            rotationY: -175,
            transformOrigin: "0% 50%",
            z: 80,
            ease: "power2.inOut",
            duration: 1,
          },
          2.7 + i * 1.1
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        perspective: "1400px",
        ...style,
      }}
    >
      {CARDS.map((card, i) => (
        <div
          key={card.src}
          className="card-peel"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              width: "56%",
              aspectRatio: `${card.w} / ${card.h}`,
              position: "relative",
              transform: `rotate(${STACK_ROTATIONS[i]}deg)`,
              ...maskCss,
            }}
          >
            <SkeletonImage
              src={card.src}
              alt="ANANDA cocktail moment"
              fill
              sizes="55vw"
              className="object-cover"
              priority={i >= CARDS.length - 2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
