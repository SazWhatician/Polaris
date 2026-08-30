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
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Trigger wall impact pulse when reaching bottom
            if (self.progress > 0.88) {
              if (wallGlowEl) {
                gsap.to(wallGlowEl, { opacity: 1, duration: 0.3 });
              }
              if (badgeEl) {
                gsap.to(badgeEl, { opacity: 1, scale: 1, duration: 0.3 });
              }
            } else {
              if (wallGlowEl) {
                gsap.to(wallGlowEl, { opacity: 0, duration: 0.3 });
              }
              if (badgeEl) {
                gsap.to(badgeEl, { opacity: 0, scale: 0.9, duration: 0.3 });
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
          0
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
        0
      );
    }, triggerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={triggerRef}
      className="relative w-full h-screen min-h-screen bg-black text-white select-none overflow-hidden flex flex-col justify-between items-center z-10"
    >
      {/* 1. Fullscreen Cascade Phone Background (Spanning Entire Screen Width) */}
      <div
        ref={cascadeRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center will-change-transform"
      >
        {/* Ambient Lighting */}
        <div className="absolute inset-0 bg-radial from-primary/15 via-transparent to-black pointer-events-none z-10" />

        {/* Full Cover Image covering 100% width and height */}
        <div className="relative w-full h-full min-w-full min-h-screen">
          <Image
            src="/cascade.png"
            alt="Multi-Device Cascade Grid"
            fill
            priority
            className="w-full h-full object-cover object-center opacity-90 scale-100"
          />
        </div>

        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 z-10 pointer-events-none" />
      </div>

      {/* 2. Top Header Text */}
      <div className="relative z-20 pt-16 sm:pt-20 text-center px-4 max-w-3xl space-y-2 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/20 backdrop-blur-2xl text-[10px] font-mono tracking-[0.28em] uppercase text-white shadow-xl">
          <Smartphone className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>RESPONSIVE ACADEMIC FEED · REAL-TIME SYNC</span>
        </div>

        <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase drop-shadow-2xl">
          Live Streamed Knowledge
        </h2>
      </div>

      {/* 3. Hand + Video Composite: LAYER 1 (Video) is BEHIND, LAYER 2 (ActualHand.png) is ON TOP */}
      <div className="relative z-30 flex-1 w-full max-w-4xl flex items-center justify-center pointer-events-none my-auto">
        <div
          ref={handContainerRef}
          className="relative will-change-transform flex items-center justify-center"
        >
          {/* Hand Container Frame (1024x1536 aspect ratio) */}
          <div className="relative w-[320px] sm:w-[420px] md:w-[480px] aspect-[1024/1536] drop-shadow-[0_35px_70px_rgba(0,0,0,0.95)]">
            
            {/* LAYER 1 (FIRST LAYER - UNDERNEATH): Video playing precisely within the screen bezel */}
            <div
              className="absolute overflow-hidden rounded-[20px] sm:rounded-[28px] md:rounded-[32px] bg-black shadow-inner z-0"
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
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Glass sheen highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />
            </div>

            {/* LAYER 2 (SECOND LAYER - ON TOP): ActualHand.png Overlay with transparent screen window */}
            <Image
              src="/ActualHand.png"
              alt="3D Hand Scroll"
              fill
              priority
              className="object-contain relative z-10 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom Solid Wall Indicator & Dock Settle Bar */}
      <div className="relative z-20 w-full max-w-5xl px-6 pb-8 flex flex-col items-center gap-3 pointer-events-none">
        {/* Wall Hit Impact Flare */}
        <div
          ref={wallGlowRef}
          className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 shadow-[0_0_20px_rgba(99,102,241,0.8)]"
        />

        <div
          ref={badgeRef}
          className="opacity-0 scale-90 transition-all duration-300 flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/90 border border-primary/40 text-[10px] font-mono text-primary uppercase tracking-widest shadow-2xl"
        >
          <Sparkles className="w-3 h-3 text-primary animate-spin" />
          <span>[FEED LOCKED // READY TO ADVANCE]</span>
        </div>

        <div className="w-full flex items-center justify-between text-[9px] font-mono text-white/40 border-t border-white/[0.08] pt-3">
          <span className="uppercase">GESTURE SCROLL: ACTIVE</span>
          <span className="uppercase tracking-[0.2em] hidden sm:inline">60FPS HARDWARE ACCELERATED</span>
          <span className="uppercase">POLARIS STREAM ENGINE</span>
        </div>
      </div>
    </section>
  );
}
