"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Compass, Layers, Zap } from "lucide-react";

import { CrystalGlow } from "@/components/ui/crystal-glow";

export function DreamyCloudsParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax transform physics for the 2 cloud layers and the central Liquid P
  const cloudLeftX = useTransform(scrollYProgress, [0.1, 0.5, 0.9], ["-5%", "-35%", "-65%"]);
  const cloudRightX = useTransform(scrollYProgress, [0.1, 0.5, 0.9], ["5%", "35%", "65%"]);
  const cloudScale = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [1, 1.25, 1.45]);
  const cloudOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0.4, 0.95, 0.8, 0.2]);

  const pScale = useTransform(scrollYProgress, [0.15, 0.5, 0.85], [0.75, 1.15, 1]);
  const pOpacity = useTransform(scrollYProgress, [0.1, 0.35, 0.8, 0.95], [0, 1, 1, 0.3]);
  const pY = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={containerRef}
      id="dreamy-clouds-section"
      data-testid="dreamy-clouds-section"
      className="relative flex min-h-[140vh] w-full select-none flex-col items-center justify-center overflow-hidden overflow-x-clip border-t border-white/[0.08] bg-black py-24 text-white sm:py-36"
    >
      {/* 1. Deep Celestial Atmospheric Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,rgba(168,85,247,0.08)_40%,transparent_75%)]" />

      {/* 2. Tactical Starfield / Coordinate Mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

      {/* 3. PARALLAX CLOUD LAYER 1: DRIFTING LEFT */}
      <motion.div
        style={{
          x: cloudLeftX,
          scale: cloudScale,
          opacity: cloudOpacity,
        }}
        className="pointer-events-none absolute inset-y-0 -left-20 z-10 flex w-[90vw] max-w-[1200px] items-center justify-center sm:-left-40"
      >
        <img
          src="/clouddd.png"
          alt="Celestial Cloud Drift Left"
          className="h-auto w-full select-none object-contain opacity-90 mix-blend-screen"
        />
      </motion.div>

      {/* 4. PARALLAX CLOUD LAYER 2: DRIFTING RIGHT & ROTATED */}
      <motion.div
        style={{
          x: cloudRightX,
          scale: cloudScale,
          opacity: cloudOpacity,
        }}
        className="pointer-events-none absolute inset-y-0 -right-20 z-10 flex w-[90vw] max-w-[1200px] items-center justify-center sm:-right-40"
      >
        <img
          src="/clouddd.png"
          alt="Celestial Cloud Drift Right"
          className="h-auto w-full rotate-180 scale-x-[-1] select-none object-contain opacity-90 mix-blend-screen"
        />
      </motion.div>

      {/* 5. DREAMY REVEAL: CENTRAL POLARIS LIQUID SHADER "P" */}
      <div className="pointer-events-auto relative z-20 mx-auto flex max-w-4xl flex-col items-center justify-center space-y-8 px-4 text-center">
        {/* Top Header Tag */}
        <motion.div
          style={{ opacity: pOpacity }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.25em] text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-xl"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
          <span>The Academic Core // Neural Liquid Kernel</span>
        </motion.div>

        {/* Big Dreamy Headline */}
        <motion.div style={{ opacity: pOpacity }} className="space-y-3">
          <CrystalGlow
            as="h2"
            fontSize="clamp(2rem, 5vw, 4rem)"
            fontWeight={900}
            className="leading-tight tracking-tight text-white"
          >
            Dreaming in Vectors
          </CrystalGlow>
          <p className="mx-auto max-w-xl text-sm font-medium leading-relaxed text-slate-300 drop-shadow-sm sm:text-base">
            Autonomous citation verification, prerequisite topological graphs, and neural vector
            embeddings unified in the Polaris academic core.
          </p>
        </motion.div>

        {/* Central Polaris Celestial Star Core with Orbital Rings */}
        <motion.div
          style={{
            scale: pScale,
            opacity: pOpacity,
            y: pY,
          }}
          className="relative my-4 flex items-center justify-center"
        >
          {/* Orbital Celestial Rings */}
          <div className="pointer-events-none absolute flex aspect-square w-72 animate-[spin_60s_linear_infinite] items-center justify-center rounded-full border border-white/[0.12] sm:w-96 md:w-[440px]">
            <div className="h-[82%] w-[82%] animate-[spin_40s_linear_infinite_reverse] rounded-full border border-dashed border-white/[0.08]" />
            <div className="h-[60%] w-[60%] animate-pulse rounded-full border border-primary/30" />
          </div>

          {/* 100% Backgroundless Floating Polaris Star Emblem */}
          <div className="hover:scale-106 pointer-events-auto relative flex aspect-square w-52 items-center justify-center transition-transform duration-500 sm:w-64 md:w-80 lg:w-96">
            <Image
              src="/polaris-standalone.png"
              alt="Polaris Star Core"
              fill
              sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
              className="pointer-events-none select-none object-contain drop-shadow-[0_0_60px_rgba(147,51,234,0.45)]"
              priority
            />
          </div>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          style={{ opacity: pOpacity }}
          className="flex flex-wrap items-center justify-center gap-3 pt-4 font-mono text-xs"
        >
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-white/80">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Autonomous Intelligence Core</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-white/80">
            <Compass className="h-3.5 w-3.5 text-indigo-400" />
            <span>Zero Hallucination Grounding</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-white/80">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Multi-Layer Parallax Mesh</span>
          </div>
        </motion.div>
      </div>

      {/* 6. Bottom Ambient Fade Out */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-36 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}

export default DreamyCloudsParallaxSection;
