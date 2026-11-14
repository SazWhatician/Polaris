"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Smartphone, Sparkles } from "lucide-react";

export function CascadeHandScrollSection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const cascadeRef = useRef<HTMLDivElement>(null);
  const handContainerRef = useRef<HTMLDivElement>(null);
  const wallGlowRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerEl = triggerRef.current;
    const cascadeEl = cascadeRef.current;
    const handEl = handContainerRef.current;
    const wallGlowEl = wallGlowRef.current;
    const badgeEl = badgeRef.current;

    if (!triggerEl || !handEl) return;

    // Create GSAP ScrollTrigger Timeline with native pinSpacing
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "+=220%",
          pin: true,
          pinSpacing: true,
          scrub: 0.3,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Trigger wall impact pulse when reaching bottom
            if (self.progress > 0.88) {
              if (wallGlowEl) {
                gsap.to(wallGlowEl, { opacity: 1, duration: 0.25, overwrite: "auto" });
              }
              if (badgeEl) {
                gsap.to(badgeEl, { opacity: 1, scale: 1, duration: 0.25, overwrite: "auto" });
              }
            } else {
              if (wallGlowEl) {
                gsap.to(wallGlowEl, { opacity: 0, duration: 0.25, overwrite: "auto" });
              }
              if (badgeEl) {
                gsap.to(badgeEl, { opacity: 0, scale: 0.9, duration: 0.25, overwrite: "auto" });
              }
            }
          },
        },
      });

      // 1. Cascade background parallax scaling (smooth, no rotation)
      if (cascadeEl) {
        tl.fromTo(
          cascadeEl,
          { scale: 1.04, y: -20, opacity: 0.88, force3D: true },
          { scale: 1.0, y: 20, opacity: 1, ease: "none", force3D: true },
          0,
        );
      }

      // 2. Hand STRICTLY VERTICAL descent down the cascade (NO ROTATION)
      tl.fromTo(
        handEl,
        {
          y: -100,
          scale: 1.02,
          rotation: 0,
          rotationZ: 0,
          rotationX: 0,
          force3D: true,
        },
        {
          y: 420,
          scale: 0.96,
          rotation: 0,
          rotationZ: 0,
          rotationX: 0,
          ease: "power1.inOut",
          force3D: true,
        },
        0,
      );
    }, triggerRef);

    // Pause background video when off-screen to conserve GPU memory
    const videoEl = videoRef.current;
    const videoObserver = new IntersectionObserver(
      ([entry]) => {
        if (!videoEl) return;
        if (entry?.isIntersecting) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      },
      { rootMargin: "250px" },
    );
    if (triggerEl) videoObserver.observe(triggerEl);

    return () => {
      videoObserver.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={triggerRef}
      id="cascade-section"
      data-testid="cascade-hand-scroll-section"
      className="relative z-10 flex h-screen min-h-screen w-full select-none flex-col items-center justify-between overflow-hidden bg-black text-white"
    >
      {/* Top Dissolve Gradient seamlessly blending with Hero 3D scene above */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black via-black/70 to-transparent sm:h-24"
        aria-hidden="true"
      />

      {/* 1. Fullscreen Cascade Phone Background (Spanning Entire Screen Width) */}
      <div
        ref={cascadeRef}
        className="pointer-events-none absolute inset-0 z-0 flex h-full w-full items-center justify-center overflow-hidden will-change-transform"
      >
        {/* Ambient Lighting */}
        <div className="bg-radial pointer-events-none absolute inset-0 z-10 from-primary/15 via-transparent to-black" />

        {/* Full Cover Image covering 100% width and height */}
        <div className="relative h-full min-h-screen w-full min-w-full">
          <Image
            src="/cascade.png"
            alt="Multi-Device Cascade Grid"
            fill
            priority
            sizes="100vw"
            className="h-full w-full scale-100 object-cover object-center opacity-90"
          />
        </div>

        {/* Vignette Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-black/80" />
      </div>

      {/* 2. Top Header Text */}
      <div className="pointer-events-none relative z-20 max-w-3xl space-y-2 px-4 pt-16 text-center sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white shadow-xl backdrop-blur-2xl">
          <Smartphone className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>RESPONSIVE ACADEMIC FEED · REAL-TIME SYNC</span>
        </div>

        <h2 className="text-xl font-black uppercase leading-tight tracking-tight drop-shadow-2xl sm:text-3xl md:text-4xl">
          Live Streamed Knowledge
        </h2>
      </div>

      {/* 3. Hand + Video Composite: LAYER 1 (Video) is BEHIND, LAYER 2 (ActualHand.png) is ON TOP */}
      <div className="pointer-events-none relative z-30 my-auto flex w-full max-w-4xl flex-1 items-center justify-center">
        <div
          ref={handContainerRef}
          className="relative flex items-center justify-center will-change-transform"
        >
          {/* Hand Container Frame (1024x1536 aspect ratio) */}
          <div className="relative aspect-[1024/1536] w-[320px] drop-shadow-[0_35px_70px_rgba(0,0,0,0.95)] sm:w-[420px] md:w-[480px]">
            {/* LAYER 1 (FIRST LAYER - UNDERNEATH): Video playing precisely within the screen bezel */}
            <div
              className="absolute z-0 overflow-hidden rounded-[20px] bg-black shadow-inner sm:rounded-[28px] md:rounded-[32px]"
              style={{
                top: "2.73%",
                left: "27.15%",
                width: "34.67%",
                height: "49.61%",
              }}
            >
              <video
                ref={videoRef}
                src="/login-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="pointer-events-none h-full w-full select-none object-cover"
              />

              {/* Glass sheen highlight */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* LAYER 2 (SECOND LAYER - ON TOP): ActualHand.png Overlay with transparent screen window */}
            <Image
              src="/ActualHand.png"
              alt="3D Hand Scroll"
              fill
              priority
              sizes="(max-width: 768px) 320px, (max-width: 1024px) 420px, 480px"
              className="pointer-events-none relative z-10 object-contain"
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom Solid Wall Indicator & Dock Settle Bar */}
      <div className="pointer-events-none relative z-20 flex w-full max-w-5xl flex-col items-center gap-3 px-6 pb-8">
        {/* Wall Hit Impact Flare */}
        <div
          ref={wallGlowRef}
          className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 shadow-[0_0_20px_rgba(99,102,241,0.8)] transition-opacity duration-300"
        />

        <div
          ref={badgeRef}
          className="flex scale-90 items-center gap-2 rounded-full border border-primary/40 bg-black/90 px-3.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary opacity-0 shadow-2xl transition-all duration-300"
        >
          <Sparkles className="h-3 w-3 animate-spin text-primary" />
          <span>[FEED LOCKED // READY TO ADVANCE]</span>
        </div>

        <div className="flex w-full items-center justify-between border-t border-white/[0.08] pt-3 font-mono text-[9px] text-white/40">
          <span className="uppercase">GESTURE SCROLL: ACTIVE</span>
          <span className="hidden uppercase tracking-[0.2em] sm:inline">
            60FPS HARDWARE ACCELERATED
          </span>
          <span className="uppercase">POLARIS STREAM ENGINE</span>
        </div>
      </div>
    </section>
  );
}
