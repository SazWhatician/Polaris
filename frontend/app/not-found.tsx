import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  MessageSquare,
  BookOpen,
  Sparkles,
  Compass,
} from "lucide-react";
import { CrystalGlow } from "@/components/ui/crystal-glow";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 1. Deep Celestial Atmospheric Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18)_0%,rgba(168,85,247,0.08)_40%,transparent_75%)] pointer-events-none" />

      {/* 2. Tactical Starfield / Coordinate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-8 p-8 sm:p-14 rounded-3xl bg-card/60 border border-white/10 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
        {/* Sector Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/20 backdrop-blur-xl text-white text-[11px] font-mono tracking-[0.25em] uppercase shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>SECTOR UNMAPPED // 0x404</span>
        </div>

        {/* 404 Headline */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <CrystalGlow
              as="h1"
              fontSize="clamp(4rem, 10vw, 7rem)"
              fontWeight={900}
              className="tracking-tight select-none leading-none"
            >
              404
            </CrystalGlow>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Vector Coordinate Not Found
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-md mx-auto">
              The academic document or topic node you are searching for does not exist in the active index.
            </p>
          </div>
        </div>

        {/* Fast Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
          <Link
            href="/"
            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white">Return to Orbit</div>
                <div className="text-[10px] text-muted-foreground">Landing page & ethos</div>
              </div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/dashboard"
            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white">Workspace</div>
                <div className="text-[10px] text-muted-foreground">Active student overview</div>
              </div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/chat"
            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white">Grounded RAG</div>
                <div className="text-[10px] text-muted-foreground">Query academic index</div>
              </div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/syllabus"
            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white">Course Syllabus</div>
                <div className="text-[10px] text-muted-foreground">Topic trees & schedule</div>
              </div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Launch Primary Navigator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
