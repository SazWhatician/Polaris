"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, LogIn, UserPlus } from "lucide-react";

import { LightBloom } from "@/components/ui/light-bloom";
import { getTheme } from "@/lib/polaris-themes";
import { useAuth } from "@/lib/auth-context";

const LETTERS = ["P", "O", "L", "A", "R", "I", "S"];

interface OpeningHeroSceneProps {
  isLoaded?: boolean;
}

export function OpeningHeroScene({ isLoaded: propIsLoaded }: OpeningHeroSceneProps) {
  const { resolvedTheme, theme } = useTheme();
  const { user } = useAuth();
  const palette = getTheme(resolvedTheme ?? theme);

  // Safety fallback if loader onComplete is not wired
  const [mountedLoaded, setMountedLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMountedLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isLoaded = propIsLoaded !== undefined ? propIsLoaded : mountedLoaded;

  return (
    <section className="relative w-full h-screen min-h-[640px] max-h-[1080px] flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* 1. Dynamic WebGL Shader Background (LightBloom Vivid Shader Canvas) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightBloom
          fixedFullscreen={false}
          zIndex={0}
          {...palette.lightBloom}
        />
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      </div>

      {/* 2. Tactical Thin White Blueprint Grid */}
      <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-2 md:grid-cols-4 grid-rows-2">
        {/* Quadrant 1 */}
        <div className="relative border-r border-b border-white/[0.1] p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-white/70 uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span>[SYS.01 // ACTIVE]</span>
          </div>
          <span className="absolute -bottom-2 -right-2 text-white/40 font-mono text-sm leading-none">+</span>
        </div>

        {/* Quadrant 2 */}
        <div className="relative hidden md:flex border-r border-b border-white/[0.1] p-6 flex-col justify-start items-center">
          <div className="text-[9px] font-mono tracking-[0.3em] text-white/50 uppercase">
            [VECTOR TOPOLOGY // PROTON-V]
          </div>
          <span className="absolute -bottom-2 -right-2 text-white/40 font-mono text-sm leading-none">+</span>
        </div>

        {/* Quadrant 3 */}
        <div className="relative hidden md:flex border-r border-b border-white/[0.1] p-6 flex-col justify-start items-center">
          <div className="text-[9px] font-mono tracking-[0.3em] text-primary uppercase">
            [GROUNDED RAG KERNEL]
          </div>
          <span className="absolute -bottom-2 -right-2 text-white/40 font-mono text-sm leading-none">+</span>
        </div>

        {/* Quadrant 4 */}
        <div className="relative border-b border-white/[0.1] p-6 flex flex-col justify-between items-end text-right">
          <div className="text-[10px] font-mono tracking-[0.25em] text-white/70 uppercase">
            [FREQ: 840.2 MHZ]
          </div>
        </div>

        {/* Quadrant 5 */}
        <div className="relative border-r border-white/[0.1] p-6 flex flex-col justify-end">
          <div className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
            LAT: 42° 21&apos; N · LNG: 71° 03&apos; W
          </div>
        </div>

        {/* Quadrant 6 */}
        <div className="relative hidden md:flex border-r border-white/[0.1] p-6 flex-col justify-end items-center">
          <div className="text-[9px] font-mono tracking-[0.3em] text-slate-400 uppercase">
            AUTONOMOUS CITATION VERIFICATION
          </div>
        </div>

        {/* Quadrant 7 */}
        <div className="relative hidden md:flex border-r border-white/[0.1] p-6 flex-col justify-end items-center">
          <div className="text-[9px] font-mono tracking-[0.3em] text-slate-400 uppercase">
            NEURAL KNOWLEDGE GRAPHS
          </div>
        </div>

        {/* Quadrant 8 */}
        <div className="relative p-6 flex flex-col justify-end items-end text-right">
          <div className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
            HAUTE ACADEMIC ARCHITECTURE
          </div>
        </div>
      </div>

      {/* 3. CENTER HERO ORBIT: GEN-Z QUOTE & INSANE HOVER BUTTONS */}
      <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-16 sm:pt-20 pb-6 pointer-events-auto">
        
        {/* Subtle Ambient Rings framing the center shader */}
        <div className="absolute w-72 sm:w-96 md:w-[460px] aspect-square rounded-full border border-white/[0.06] animate-[spin_100s_linear_infinite] pointer-events-none flex items-center justify-center -z-10">
          <div className="w-[82%] h-[82%] rounded-full border border-dashed border-white/[0.05] animate-[spin_60s_linear_infinite_reverse]" />
          <div className="w-[60%] h-[60%] rounded-full border border-white/[0.03]" />
        </div>

        {/* Gen-Z Quote & Badge Container */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 25, filter: "blur(8px)" }}
          transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center max-w-2xl space-y-3 sm:space-y-4 mb-6 sm:mb-8"
        >
          {/* Micro pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 text-white/90 text-[11px] font-mono uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(255,255,255,0.08)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Academic Comeback Season</span>
          </div>

          {/* Fancy Gen-Z Editorial Quote (9 words) */}
          <h2 className="font-serif italic text-2xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-indigo-200 tracking-wide font-normal drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)] leading-[1.15] px-2">
            &ldquo;Stop rawdogging your exams, let Polaris cook for you.&rdquo;
          </h2>
        </motion.div>

        {/* INSANE HOVER ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={isLoaded ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5"
        >
          {user ? (
            <Link
              href="/dashboard"
              id="hero-btn-dashboard"
              data-testid="hero-btn-dashboard"
              className="relative group inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-white text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(255,255,255,0.35)] hover:shadow-[0_0_60px_rgba(255,255,255,0.7),0_0_100px_rgba(99,102,241,0.5)] hover:scale-108 active:scale-95 transition-all duration-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Enter Workspace</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3] text-slate-950 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-45 transition-transform duration-300" />
            </Link>
          ) : (
            <>
              {/* 1. SIGN UP BUTTON WITH INSANE PRISMATIC AURA & MAGNETIC HOVER */}
              <Link
                href="/login"
                id="hero-btn-signup"
                data-testid="hero-btn-signup"
                className="relative group overflow-hidden inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-white text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_10px_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.8),0_0_90px_rgba(168,85,247,0.6)] hover:scale-108 active:scale-95 transition-all duration-300 border border-white"
              >
                {/* Iridescent background glow pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                
                {/* Diagonal light sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                
                <UserPlus className="relative z-10 w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span className="relative z-10">Sign Up Free</span>
                <div className="relative z-10 w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center group-hover:bg-primary transition-colors duration-300 shadow-xs">
                  <ArrowUpRight className="w-3 h-3 stroke-[3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </Link>

              {/* 2. LOGIN BUTTON WITH NEON FROSTED GLASS & SHIMMERING HOVER */}
              <Link
                href="/login"
                id="hero-btn-login"
                data-testid="hero-btn-login"
                className="relative group overflow-hidden inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm tracking-wider uppercase backdrop-blur-2xl border border-white/25 hover:border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5),0_0_80px_rgba(236,72,153,0.3)] hover:scale-108 active:scale-95 transition-all duration-300"
              >
                {/* Ambient hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-rose-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Animated shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                <LogIn className="relative z-10 w-4 h-4 text-amber-300 group-hover:text-amber-200 transition-colors" />
                <span className="relative z-10 bg-gradient-to-r from-white via-amber-200 to-white bg-[length:200%_auto] group-hover:animate-[shimmer_2s_linear_infinite] bg-clip-text text-transparent drop-shadow-xs">
                  Login
                </span>
                <ArrowUpRight className="relative z-10 w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* 4. BIG POLARIS TYPOGRAPHY (BOTTOM PINNED & EDGE-TO-EDGE WITH ZERO COLLISION) */}
      <div className="relative z-20 w-full px-6 sm:px-12 lg:px-16 pb-4 sm:pb-6 pointer-events-none select-none">
        
        {/* Staggered Slide-In Letter Mask */}
        <div className="overflow-hidden flex items-baseline justify-between w-full">
          <div className="flex items-center gap-[0.02em] sm:gap-[0.04em]">
            {LETTERS.map((letter, index) => (
              <motion.span
                key={index}
                initial={{ y: "140%", opacity: 0, filter: "blur(12px)" }}
                animate={
                  isLoaded
                    ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                    : { y: "140%", opacity: 0, filter: "blur(12px)" }
                }
                transition={{
                  duration: 0.95,
                  delay: index * 0.075,
                  ease: [0.16, 1, 0.3, 1], // easeOutExpo
                }}
                className="inline-block font-black uppercase text-5xl sm:text-7xl md:text-8xl lg:text-[10.5vw] tracking-tight text-white drop-shadow-[0_20px_40px_rgba(0,0,0,1)] leading-[0.82]"
                style={{
                  fontFamily: "var(--font-syncopate), var(--font-jakarta), system-ui, sans-serif",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Right telemetry tag at the border */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.55, ease: "easeOut" }}
            className="hidden sm:flex flex-col items-end text-right pb-2 sm:pb-3"
          >
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-emerald-400 uppercase">
              [V2.4 // ONLINE]
            </span>
            <span className="text-[9px] font-mono tracking-[0.2em] text-white/50 uppercase">
              AUTONOMOUS ACADEMIC INTELLIGENCE
            </span>
          </motion.div>
        </div>

        {/* Animated Horizontal Border Line Span */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isLoaded ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-[2px] bg-gradient-to-r from-primary via-white/40 to-transparent origin-left mt-1.5"
        />
      </div>
    </section>
  );
}
