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
          scrub: 0.3,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Pulse & lock when the hand lands exactly onto the open book manuscript
            if (self.progress > 0.8) {
              if (inkGlowEl)
                gsap.to(inkGlowEl, { opacity: 1, scale: 1.2, duration: 0.3, overwrite: "auto" });
              if (lockBadgeEl)
                gsap.to(lockBadgeEl, { opacity: 1, scale: 1, duration: 0.3, overwrite: "auto" });
            } else {
              if (inkGlowEl)
                gsap.to(inkGlowEl, { opacity: 0, scale: 0.5, duration: 0.25, overwrite: "auto" });
              if (lockBadgeEl)
                gsap.to(lockBadgeEl, { opacity: 0, scale: 0.9, duration: 0.25, overwrite: "auto" });
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
          0,
        );
      }

      // 2. Header text subtle elevation
      if (headerEl) {
        tl.fromTo(headerEl, { y: 0, opacity: 1 }, { y: -30, opacity: 0.9, ease: "none" }, 0);
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
        0,
      );

      // 4. Floating glass telemetry cards glide into place
      if (textLeftEl) {
        tl.fromTo(
          textLeftEl,
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, ease: "power2.out" },
          0.3,
        );
      }

      if (textRightEl) {
        tl.fromTo(
          textRightEl,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, ease: "power2.out" },
          0.3,
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
      className="z-15 relative flex h-screen min-h-screen w-full select-none flex-col items-center justify-between overflow-hidden border-t border-white/[0.08] bg-black text-white"
    >
      {/* ── 1. FULLSCREEN BOOK COVER BACKGROUND (bookoriginal.png Covering 100% Page Width) ── */}
      <div
        ref={canvasStageRef}
        className="pointer-events-none absolute inset-0 z-0 flex h-full w-full items-center justify-center overflow-hidden will-change-transform"
      >
        {/* Ambient Darkened Studio Lighting */}
        <div className="bg-radial pointer-events-none absolute inset-0 z-10 from-amber-500/10 via-transparent to-black" />

        {/* Dynamic Cover Stage that preserves exact 1672:941 aspect ratio while spanning 100vw and 100vh */}
        <div
          className="relative flex shrink-0 items-center justify-center"
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
            className="h-full w-full object-cover object-center opacity-95 brightness-[0.98] contrast-[1.03] filter"
          />

          {/* OVERLAY LAYER: Smaller Hand & Feather Quill Proportionally Sized to Sit on the Book */}
          {/* Calibrated proportionally to book size: scale 45%, sitting right above the page crease and writing onto the manuscript */}
          <div
            ref={handRef}
            className="pointer-events-none absolute z-20 will-change-transform"
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
              className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
            />

            {/* Glowing Ink Contact Point on Manuscript Page (Exact Quill Tip Coordinate) */}
            <div
              ref={inkGlowRef}
              className="pointer-events-none absolute flex items-center justify-center opacity-0"
              style={{
                top: "98.5%",
                left: "32.6%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="h-8 w-8 animate-ping rounded-full bg-amber-400/40 blur-md" />
              <div className="absolute h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,1)]" />
            </div>
          </div>
        </div>

        {/* Cinematic Vignette Overlays */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-black/80" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* ── 2. TOP HEADER TITLE & TACTICAL BADGE ── */}
      <div
        ref={headerRef}
        className="pointer-events-none relative z-30 max-w-3xl space-y-3 px-4 pt-12 text-center sm:pt-16"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-2xl">
          <Feather className="h-3.5 w-3.5 animate-pulse text-amber-400" />
          <span>SCHOLASTIC GENESIS // THE LIVING CODEX</span>
        </div>

        <div className="space-y-1.5">
          <CrystalGlow
            as="h2"
            fontSize="clamp(1.75rem, 4vw, 3.25rem)"
            fontWeight={900}
            className="uppercase leading-tight tracking-tight text-white drop-shadow-2xl"
          >
            The Living Manuscript
          </CrystalGlow>
          <p className="mx-auto max-w-xl text-xs font-light leading-relaxed text-slate-300 drop-shadow-md sm:text-sm">
            From handwritten marginalia to high-dimensional neural embeddings. Polaris bridges
            centuries of scholastic tradition with zero-hallucination vector grounding.
          </p>
        </div>
      </div>

      {/* ── 3. FLOATING TELEMETRY ANNOTATION CARDS (Left & Right) ── */}
      <div className="pointer-events-none relative z-20 my-auto flex w-full max-w-7xl flex-1 items-center justify-between px-6">
        {/* Left Floating Intelligence Card */}
        <div
          ref={textLeftRef}
          className="pointer-events-auto z-30 hidden max-w-xs flex-col gap-3 rounded-2xl border border-amber-500/20 bg-black/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:flex"
        >
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-amber-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Manuscript Ingestion</span>
          </div>
          <h4 className="text-sm font-bold tracking-tight text-white">High-Fidelity OCR</h4>
          <p className="text-[11px] font-light leading-relaxed text-slate-300">
            PaddleOCR extracts handwritten formulas, cursive annotations, and Latin scripts with
            sub-millimeter bounding coordinate precision.
          </p>
          <div className="flex items-center gap-1.5 border-t border-white/[0.06] pt-1 font-mono text-[9px] text-amber-300/80">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>99.4% Formula Accuracy</span>
          </div>
        </div>

        {/* Right Floating Intelligence Card */}
        <div
          ref={textRightRef}
          className="pointer-events-auto z-30 hidden max-w-xs flex-col gap-3 rounded-2xl border border-indigo-500/20 bg-black/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:flex"
        >
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-indigo-400">
            <ScrollText className="h-3.5 w-3.5" />
            <span>Epistemic Grounding</span>
          </div>
          <h4 className="text-sm font-bold tracking-tight text-white">Verified Citations</h4>
          <p className="text-[11px] font-light leading-relaxed text-slate-300">
            Every insight cited with page-level bounding boxes and exact excerpt verification
            directly back to your source documents.
          </p>
          <div className="flex items-center gap-1.5 border-t border-white/[0.06] pt-1 font-mono text-[9px] text-indigo-300/80">
            <Shield className="h-3 w-3 text-indigo-400" />
            <span>Zero Hallucination Guarantee</span>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM TELEMETRY STATUS & LOCK NOTIFICATION ── */}
      <div className="pointer-events-none relative z-20 flex w-full max-w-5xl flex-col items-center gap-3 px-6 pb-8">
        {/* Synthesis Lock Badge */}
        <div
          ref={lockBadgeRef}
          className="flex scale-90 items-center gap-2 rounded-full border border-amber-500/40 bg-black/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-300 opacity-0 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300"
        >
          <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-400" />
          <span>[MANUSCRIPT INSCRIBED · NEURAL TOPOLOGY ACTIVE]</span>
        </div>

        {/* Bottom Status Bar */}
        <div className="flex w-full items-center justify-between border-t border-white/[0.08] pt-3 font-mono text-[9px] text-white/40">
          <span className="uppercase tracking-wider">CODEX DIGITIZATION: 100%</span>
          <span className="hidden uppercase tracking-[0.2em] sm:inline">
            60FPS HARDWARE-ACCELERATED TIMELINE
          </span>
          <span className="uppercase tracking-wider">POLARIS GROUNDED RAG</span>
        </div>
      </div>
    </section>
  );
}

export default CodexQuillScrollSection;
