"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowRight, LogIn, ShieldCheck, Zap, Layers, ChevronRight, User } from "lucide-react";

import { AnimatedShaderCard } from "@/components/ui/animated-shader-card";
import { LightBloom } from "@/components/ui/light-bloom";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { PolarisLiquidP } from "@/components/ui/polaris-liquid-p";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReactorFooter } from "@/components/reactor-footer";
import { getTheme } from "@/lib/polaris-themes";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { resolvedTheme, theme } = useTheme();
  const palette = getTheme(resolvedTheme ?? theme);

  const handlePrimaryClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSecondaryClick = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen text-foreground relative selection:bg-primary/30 selection:text-foreground overflow-x-hidden">
      {/* Light Bloom — dynamic theme-aware cinematic WebGL background */}
      <LightBloom fixedFullscreen zIndex={0} {...palette.lightBloom} />

      {/* Top Floating Luxury Glass Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/15 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/polaris-standalone.png"
              alt="Polaris Logo"
              width={28}
              height={28}
              className="object-contain relative z-10"
            />
          </div>
          <div className="flex flex-col">
            <span className="polaris-luxury-logo text-sm tracking-[0.24em] font-extrabold uppercase">
              POLARIS
            </span>
            <span className="text-[9px] font-mono text-white/40 tracking-[0.2em] uppercase">
              Haute Intelligence
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/user"
                className="px-4 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 shadow-md"
                title="View User Profile & Uploads"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <span>Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 shadow-md hover:border-primary/30"
            >
              <LogIn className="h-3.5 w-3.5 text-primary" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="relative z-10 w-full">
        {/* Hero — Liquid Metal Polaris P + editorial copy (theme-aware) */}
        <section className="relative w-full min-h-screen flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center px-6 py-24 lg:py-32">
            {/* Left column — headline + subhead + CTAs */}
            <div className="relative z-10 text-center lg:text-left space-y-8 order-2 lg:order-1">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-xl text-[10px] font-mono tracking-[0.24em] uppercase"
                style={{
                  background: "var(--hero-badge-bg)",
                  borderColor: "var(--hero-badge-border)",
                  color: "var(--hero-badge-fg)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--hero-badge-dot)" }} />
                <CrystalGlow fontSize={11} fontWeight={700} compact>
                  Polaris · Academic Navigator
                </CrystalGlow>
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.95] drop-shadow-2xl"
                style={{ color: "var(--hero-heading)" }}
              >
                Your entire<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, var(--hero-heading), var(--hero-heading-alt), var(--hero-heading-end))",
                  }}
                >
                  academic world.
                </span>
              </h1>

              <p
                className="text-base sm:text-lg lg:text-xl font-light leading-relaxed max-w-lg mx-auto lg:mx-0"
                style={{ color: "var(--hero-subhead)" }}
              >
                Powered by AI. Autonomous research, page-level citations, and prerequisite knowledge graphs — all in one navigator.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <button
                  data-polaris-cta
                  onClick={handlePrimaryClick}
                  className="px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 shadow-2xl active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
                >
                  <span>{user ? "Enter Workspace" : "Get Started Free"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSecondaryClick}
                  className="px-8 py-4 border rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 backdrop-blur-2xl shadow-md active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: "var(--cta-alt-bg)",
                    color: "var(--cta-alt-fg)",
                    borderColor: "var(--cta-alt-border)",
                  }}
                >
                  <LogIn className="h-4 w-4" style={{ color: "var(--cta-icon)" }} />
                  <span>Sign In / Register</span>
                </button>
              </div>
            </div>

            {/* Right column — liquid-metal Polaris mark (theme-driven palette) */}
            <div className="relative order-1 lg:order-2 mx-auto w-full max-w-[520px] aspect-square">
              <PolarisLiquidP {...palette.liquid} />
            </div>
          </div>
        </section>

        {/* Feature Section with Precision Intelligence Engine Shader Card & 3 Feature Cards */}
        <section className="relative z-20 py-24 px-6 max-w-7xl mx-auto space-y-16">
          {/* Precision Intelligence Engine Banner Card with Polaris Hero Shader */}
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

              <p className="text-slate-200 text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
                Polaris indexes your course notes, textbooks, and syllabi to provide verified citations, identify prerequisite gaps, and structure automated revision plans.
              </p>
            </div>
          </AnimatedShaderCard>

          {/* 3 Popout AI Feature Cards with Crystal Glow Hover Effect */}
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

        {/* Smooth Dark Fade into ENIGMA Reactor Footer */}
        <div className="w-full h-24 bg-gradient-to-b from-transparent to-black pointer-events-none" />
      </main>

      {/* ENIGMA Negative-Inversion 3D Reactor Footer with GLB Model */}
      <ReactorFooter customModelUrl="/models/bouche_a_levres.glb" />
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

