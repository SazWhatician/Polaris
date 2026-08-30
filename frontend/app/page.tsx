"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Layers, ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";

import { LandingLoader } from "@/components/landing/landing-loader";
import { NotchNavbar } from "@/components/landing/notch-navbar";
import { OpeningHeroScene } from "@/components/landing/opening-hero-scene";
import { CascadeHandScrollSection } from "@/components/landing/cascade-hand-scroll-section";
import { DreamyCloudsParallaxSection } from "@/components/landing/dreamy-clouds-parallax-section";
import { ReactorFooter } from "@/components/reactor-footer";
import { AnimatedShaderCard } from "@/components/ui/animated-shader-card";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  const handlePrimaryCta = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-foreground selection:bg-primary/30 selection:text-foreground">
      {/* 1. INITIAL CURTAIN SPLIT LOADER */}
      <LandingLoader
        onComplete={() => setIsLoaded(true)}
        minDisplayTime={900}
      />

      {/* 2. ORGANIC NOTCH NAVBAR */}
      <NotchNavbar />

      {/* 3. MAIN SCROLLABLE CONTENT (Curtain Layer over Drawer Footer) */}
      <div className="relative z-10 bg-black shadow-[0_50px_100px_rgba(0,0,0,0.95)] border-b border-white/[0.08] rounded-b-[36px] sm:rounded-b-[56px] overflow-hidden">
        
        {/* SCENE 1: WebGL Shader + Tactical Blueprint Grid + Fancy Quote + Full-Width POLARIS */}
        <OpeningHeroScene isLoaded={isLoaded} />

        {/* SCENE 2: Cascade of Phones + Silent Video + Scrolling Hand Met-A-Wall Effect */}
        <CascadeHandScrollSection />

        {/* SCENE 3: Dreamy Clouds Parallax Section (2 Clouds + Liquid P Shader) */}
        <DreamyCloudsParallaxSection />

        {/* SCENE 4: Tactical Feature Architecture & Intelligence Engine */}
        <section id="features-section" className="relative z-20 py-28 sm:py-36 px-6 max-w-7xl mx-auto space-y-16 border-t border-white/[0.08]">
          {/* Precision Intelligence Banner Card */}
          <AnimatedShaderCard className="max-w-4xl mx-auto">
            <div className="relative z-10 text-center p-8 sm:p-14 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/20 backdrop-blur-xl text-white text-xs font-mono tracking-[0.2em] uppercase shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <CrystalGlow fontSize={12} fontWeight={700} compact>
                  Academic Architecture
                </CrystalGlow>
              </div>

              <div className="flex justify-center">
                <CrystalGlow
                  as="h2"
                  fontSize="clamp(1.8rem, 3.5vw, 3rem)"
                  fontWeight={900}
                  className="tracking-tight"
                >
                  Precision Intelligence Engine
                </CrystalGlow>
              </div>

              <p className="text-slate-200 text-xs sm:text-base font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                Polaris indexes your course notes, textbooks, and syllabi to provide verified citations, identify prerequisite gaps, and structure automated revision plans.
              </p>

              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <span>{user ? "Enter Workspace" : "Launch Navigator"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </AnimatedShaderCard>

          {/* 3 Core Popout Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <PopoutFeatureCard
              variant="green"
              icon={<Zap className="h-6 w-6 text-primary" />}
              category="VECTOR RETRIEVAL"
              title="Grounded RAG Search"
              description="Ask complex questions and receive precise, page-level citations from your uploaded PDF notes and textbooks with bounding box previews."
            />
            <PopoutFeatureCard
              variant="purple"
              icon={<Layers className="h-6 w-6 text-purple-400" />}
              category="KNOWLEDGE GRAPH"
              title="Concept Topology"
              description="Automatically extract concept nodes, prerequisite relationships, and interactive community clusters directly from your syllabus."
            />
            <PopoutFeatureCard
              variant="cyan"
              icon={<ShieldCheck className="h-6 w-6 text-cyan-400" />}
              category="DIAGNOSTICS"
              title="Multimodal Gap Analysis"
              description="Detect missing prerequisite concepts in your knowledge base and receive curated educational lecture recommendations."
            />
          </div>
        </section>

        {/* Subtle Bottom Spacer */}
        <div className="w-full h-12 bg-transparent" />
      </div>

      {/* 4. DRAWER-REVEAL REACTOR 3D FOOTER */}
      <div className="relative w-full overflow-hidden">
        <ReactorFooter customModelUrl="/models/bouche_a_levres.glb" />
      </div>
    </div>
  );
}

function PopoutFeatureCard({
  icon,
  category,
  title,
  description,
  variant = "green",
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  description: string;
  variant?: "green" | "purple" | "cyan";
}) {
  const variantClasses = {
    green: "luxury-glass-card group",
    purple: "luxury-glass-card luxury-glass-card-purple group",
    cyan: "luxury-glass-card luxury-glass-card-cyan group",
  }[variant];

  const glowAccent = {
    green: "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]",
  }[variant];

  return (
    <div className={`p-8 rounded-3xl ${variantClasses} cursor-pointer`}>
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/60 transition-all duration-500" />

      <div className="flex items-center justify-between mb-8">
        <div className={`p-3.5 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${glowAccent}`}>
          {icon}
        </div>
        <CrystalGlow fontSize={10} fontWeight={600} compact className="font-mono tracking-[0.2em] uppercase">
          {category}
        </CrystalGlow>
      </div>

      <div className="mb-3">
        <CrystalGlow as="h3" fontSize={20} fontWeight={800} className="tracking-tight">
          {title}
        </CrystalGlow>
      </div>

      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-light group-hover:text-slate-200 transition-colors duration-300">
        {description}
      </p>

      <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40 group-hover:text-white transition-colors">
        <span>Explore Module</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
