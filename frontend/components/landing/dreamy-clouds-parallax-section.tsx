"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import { Sparkles, Compass, Layers, Zap } from "lucide-react";

import { getTheme } from "@/lib/polaris-themes";
import { CrystalGlow } from "@/components/ui/crystal-glow";

export function DreamyCloudsParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const palette = getTheme(resolvedTheme ?? theme);

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
      className="relative w-full min-h-[140vh] bg-black text-white overflow-hidden overflow-x-clip select-none flex flex-col items-center justify-center py-24 sm:py-36 border-t border-white/[0.08]"
    >
      {/* 1. Deep Celestial Atmospheric Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,rgba(168,85,247,0.08)_40%,transparent_75%)] pointer-events-none" />

      {/* 2. Tactical Starfield / Coordinate Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />

      {/* 3. PARALLAX CLOUD LAYER 1: DRIFTING LEFT */}
      <motion.div
        style={{
          x: cloudLeftX,
          scale: cloudScale,
          opacity: cloudOpacity,
        }}
        className="absolute inset-y-0 -left-20 sm:-left-40 w-[90vw] max-w-[1200px] pointer-events-none z-10 flex items-center justify-center"
      >
        <img
          src="/clouddd.png"
          alt="Celestial Cloud Drift Left"
          className="w-full h-auto object-contain mix-blend-screen opacity-90 select-none"
        />
      </motion.div>

      {/* 4. PARALLAX CLOUD LAYER 2: DRIFTING RIGHT & ROTATED */}
      <motion.div
        style={{
          x: cloudRightX,
          scale: cloudScale,
          opacity: cloudOpacity,
        }}
        className="absolute inset-y-0 -right-20 sm:-right-40 w-[90vw] max-w-[1200px] pointer-events-none z-10 flex items-center justify-center"
      >
        <img
          src="/clouddd.png"
          alt="Celestial Cloud Drift Right"
          className="w-full h-auto object-contain mix-blend-screen opacity-90 select-none rotate-180 scale-x-[-1]"
        />
      </motion.div>

      {/* 5. DREAMY REVEAL: CENTRAL POLARIS LIQUID SHADER "P" */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-8 pointer-events-auto">
        
        {/* Top Header Tag */}
        <motion.div
          style={{ opacity: pOpacity }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 text-white text-xs font-mono uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>The Academic Core // Neural Liquid Kernel</span>
        </motion.div>

        {/* Big Dreamy Headline */}
        <motion.div style={{ opacity: pOpacity }} className="space-y-3">
          <CrystalGlow
            as="h2"
            fontSize="clamp(2rem, 5vw, 4rem)"
            fontWeight={900}
            className="tracking-tight text-white leading-tight"
          >
            Dreaming in Vectors
          </CrystalGlow>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium leading-relaxed drop-shadow-sm">
            Autonomous citation verification, prerequisite topological graphs, and neural vector embeddings unified in the Polaris academic core.
          </p>
        </motion.div>

        {/* Central Polaris Celestial Star Core with Orbital Rings */}
        <motion.div
          style={{
            scale: pScale,
            opacity: pOpacity,
            y: pY,
          }}
          className="relative flex items-center justify-center my-4"
        >
          {/* Orbital Celestial Rings */}
          <div className="absolute w-72 sm:w-96 md:w-[440px] aspect-square rounded-full border border-white/[0.12] animate-[spin_60s_linear_infinite] pointer-events-none flex items-center justify-center">
            <div className="w-[82%] h-[82%] rounded-full border border-dashed border-white/[0.08] animate-[spin_40s_linear_infinite_reverse]" />
            <div className="w-[60%] h-[60%] rounded-full border border-primary/30 animate-pulse" />
          </div>

          {/* 100% Backgroundless Floating Polaris Star Emblem */}
          <div className="relative w-52 sm:w-64 md:w-80 lg:w-96 aspect-square flex items-center justify-center pointer-events-auto hover:scale-106 transition-transform duration-500">
            <Image
              src="/polaris-standalone.png"
              alt="Polaris Star Core"
              fill
              sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
              className="object-contain select-none pointer-events-none drop-shadow-[0_0_60px_rgba(147,51,234,0.45)]"
              priority
            />
          </div>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          style={{ opacity: pOpacity }}
          className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs font-mono"
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/80">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Autonomous Intelligence Core</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/80">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero Hallucination Grounding</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/80">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Layer Parallax Mesh</span>
          </div>
        </motion.div>
      </div>

      {/* 6. Bottom Ambient Fade Out */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}

export default DreamyCloudsParallaxSection;
