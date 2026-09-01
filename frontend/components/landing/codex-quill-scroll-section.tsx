"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Feather, Sparkles, BookOpen, ScrollText, CheckCircle2, Shield } from "lucide-react";
import { CrystalGlow } from "@/components/ui/crystal-glow";

export function CodexQuillScrollSection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const inkGlowRef = useRef<HTMLDivElement>(null);
  const lockBadgeRef = useRef<HTMLDivElement>(null);
  const textLeftRef = useRef<HTMLDivElement>(null);
  const textRightRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerEl = triggerRef.current;
    const stageEl = canvasStageRef.current;
    const handEl = handRef.current;
    const inkGlowEl = inkGlowRef.current;
    const lockBadgeEl = lockBadgeRef.current;
    const textLeftEl = textLeftRef.current;
    const textRightEl = textRightRef.current;
    const headerEl = headerRef.current;

    if (!triggerEl || !handEl) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "+=240%",
          pin: true,
          pinSpacing: true,
          scrub: 0.9,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Pulse & lock when the hand lands exactly onto the open book manuscript
            if (self.progress > 0.8) {
              if (inkGlowEl) gsap.to(inkGlowEl, { opacity: 1, scale: 1.2, duration: 0.4 });
              if (lockBadgeEl) gsap.to(lockBadgeEl, { opacity: 1, scale: 1, duration: 0.35 });
            } else {
              if (inkGlowEl) gsap.to(inkGlowEl, { opacity: 0, scale: 0.5, duration: 0.3 });
              if (lockBadgeEl) gsap.to(lockBadgeEl, { opacity: 0, scale: 0.9, duration: 0.3 });
            }
          },
        },
      });

      // 1. Fullscreen book parallax breathing (smooth, no rotation)
      if (stageEl) {
        tl.fromTo(
          stageEl,
          { scale: 1.04, y: -15, force3D: true },
          { scale: 1.0, y: 15, ease: "none", force3D: true },
          0
        );
      }

      // 2. Header text subtle elevation
      if (headerEl) {
        tl.fromTo(
          headerEl,
          { y: 0, opacity: 1 },
          { y: -30, opacity: 0.9, ease: "none" },
          0
        );
      }

      // 3. The Hand + Quill pen glides smoothly down from above and sits proportionally on the book
      tl.fromTo(
        handEl,
        {
          y: -300,
          opacity: 0.15,
          scale: 1.05,
          force3D: true,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1.0,
          ease: "power2.out",
          force3D: true,
        },
        0
      );

      // 4. Floating glass telemetry cards glide into place
      if (textLeftEl) {
        tl.fromTo(
          textLeftEl,
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, ease: "power2.out" },
          0.3
        );
      }

      if (textRightEl) {
        tl.fromTo(
          textRightEl,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, ease: "power2.out" },
          0.3
        );
      }
    }, triggerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={triggerRef}
      id="codex-manuscript-section"
      data-testid="codex-manuscript-section"
      className="relative w-full h-screen min-h-screen bg-black text-white select-none overflow-hidden flex flex-col justify-between items-center z-15 border-t border-white/[0.08]"
    >
      {/* ── 1. FULLSCREEN BOOK COVER BACKGROUND (bookoriginal.png Covering 100% Page Width) ── */}
      <div
        ref={canvasStageRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center will-change-transform"
      >
        {/* Ambient Darkened Studio Lighting */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black pointer-events-none z-10" />

        {/* Dynamic Cover Stage that preserves exact 1672:941 aspect ratio while spanning 100vw and 100vh */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{
            width: "max(100vw, calc(100vh * (1672 / 941)))",
            height: "max(100vh, calc(100vw * (941 / 1672)))",
          }}
        >
          {/* BASE LAYER: Fullscreen bookoriginal.png spanning 100% of the stage */}
          <Image
            src="/bookoriginal.png"
            alt="Classical Illuminated Manuscript"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center opacity-95 filter brightness-[0.98] contrast-[1.03]"
          />

          {/* OVERLAY LAYER: Smaller Hand & Feather Quill Proportionally Sized to Sit on the Book */}
          {/* Calibrated proportionally to book size: scale 45%, sitting right above the page crease and writing onto the manuscript */}
          <div
            ref={handRef}
            className="absolute will-change-transform pointer-events-none z-20"
            style={{
              left: "26.0%",
              top: "5.68%",
              width: "35.88%",
              height: "56.43%",
            }}
          >
            <Image
              src="/handbook123.png"
              alt="Hand with Feather Quill Pen"
              fill
              priority
              sizes="(max-width: 768px) 50vw, 36vw"
              className="object-contain w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
            />

            {/* Glowing Ink Contact Point on Manuscript Page (Exact Quill Tip Coordinate) */}
            <div
              ref={inkGlowRef}
              className="absolute opacity-0 pointer-events-none flex items-center justify-center"
              style={{
                top: "98.5%",
                left: "32.6%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-400/40 blur-md animate-ping" />
              <div className="absolute w-3.5 h-3.5 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,1)]" />
            </div>
          </div>
        </div>

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-10 pointer-events-none" />
      </div>

      {/* ── 2. TOP HEADER TITLE & TACTICAL BADGE ── */}
      <div
        ref={headerRef}
        className="relative z-30 pt-12 sm:pt-16 text-center px-4 max-w-3xl space-y-3 pointer-events-none"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-2xl text-[10px] font-mono tracking-[0.28em] uppercase text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Feather className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>SCHOLASTIC GENESIS // THE LIVING CODEX</span>
        </div>

        <div className="space-y-1.5">
          <CrystalGlow
            as="h2"
            fontSize="clamp(1.75rem, 4vw, 3.25rem)"
            fontWeight={900}
            className="tracking-tight text-white leading-tight uppercase drop-shadow-2xl"
          >
            The Living Manuscript
          </CrystalGlow>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-light leading-relaxed drop-shadow-md">
            From handwritten marginalia to high-dimensional neural embeddings. Polaris bridges centuries of scholastic tradition with zero-hallucination vector grounding.
          </p>
        </div>
      </div>

      {/* ── 3. FLOATING TELEMETRY ANNOTATION CARDS (Left & Right) ── */}
      <div className="relative z-20 flex-1 w-full max-w-7xl flex items-center justify-between pointer-events-none px-6 my-auto">
        {/* Left Floating Intelligence Card */}
        <div
          ref={textLeftRef}
          className="hidden md:flex flex-col gap-3 p-5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-amber-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-xs z-30 pointer-events-auto"
        >
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] tracking-widest uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manuscript Ingestion</span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            High-Fidelity OCR
          </h4>
          <p className="text-[11px] text-slate-300 font-light leading-relaxed">
            PaddleOCR extracts handwritten formulas, cursive annotations, and Latin scripts with sub-millimeter bounding coordinate precision.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300/80 pt-1 border-t border-white/[0.06]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>99.4% Formula Accuracy</span>
          </div>
        </div>

        {/* Right Floating Intelligence Card */}
        <div
          ref={textRightRef}
          className="hidden md:flex flex-col gap-3 p-5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-indigo-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-xs z-30 pointer-events-auto"
        >
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] tracking-widest uppercase">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Epistemic Grounding</span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Verified Citations
          </h4>
          <p className="text-[11px] text-slate-300 font-light leading-relaxed">
            Every insight cited with page-level bounding boxes and exact excerpt verification directly back to your source documents.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-300/80 pt-1 border-t border-white/[0.06]">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span>Zero Hallucination Guarantee</span>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM TELEMETRY STATUS & LOCK NOTIFICATION ── */}
      <div className="relative z-20 w-full max-w-5xl px-6 pb-8 flex flex-col items-center gap-3 pointer-events-none">
        {/* Synthesis Lock Badge */}
        <div
          ref={lockBadgeRef}
          className="opacity-0 scale-90 transition-all duration-300 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/90 border border-amber-500/40 text-[10px] font-mono text-amber-300 uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>[MANUSCRIPT INSCRIBED · NEURAL TOPOLOGY ACTIVE]</span>
        </div>

        {/* Bottom Status Bar */}
        <div className="w-full flex items-center justify-between text-[9px] font-mono text-white/40 border-t border-white/[0.08] pt-3">
          <span className="uppercase tracking-wider">CODEX DIGITIZATION: 100%</span>
          <span className="uppercase tracking-[0.2em] hidden sm:inline">60FPS HARDWARE-ACCELERATED TIMELINE</span>
          <span className="uppercase tracking-wider">POLARIS GROUNDED RAG</span>
        </div>
      </div>
    </section>
  );
}

export default CodexQuillScrollSection;
