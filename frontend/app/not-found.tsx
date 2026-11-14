import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, MessageSquare, BookOpen, Sparkles, Compass } from "lucide-react";
import { CrystalGlow } from "@/components/ui/crystal-glow";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-6 text-white selection:bg-primary/30">
      {/* 1. Deep Celestial Atmospheric Radial Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18)_0%,rgba(168,85,247,0.08)_40%,transparent_75%)]" />

      {/* 2. Tactical Starfield / Coordinate Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-xl space-y-8 rounded-3xl border border-white/10 bg-card/60 p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-14">
        {/* Sector Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white shadow-lg backdrop-blur-xl">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span>SECTOR UNMAPPED // 0x404</span>
        </div>

        {/* 404 Headline */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <CrystalGlow
              as="h1"
              fontSize="clamp(4rem, 10vw, 7rem)"
              fontWeight={900}
              className="select-none leading-none tracking-tight"
            >
              404
            </CrystalGlow>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Vector Coordinate Not Found
            </h2>
            <p className="mx-auto max-w-md text-xs font-light leading-relaxed text-slate-300 sm:text-sm">
              The academic document or topic node you are searching for does not exist in the active
              index.
            </p>
          </div>
        </div>

        {/* Fast Action Grid */}
        <div className="grid grid-cols-1 gap-3 text-left text-xs sm:grid-cols-2">
          <Link
            href="/"
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-2.5">
              <Home className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              <div>
                <div className="font-bold text-white">Return to Orbit</div>
                <div className="text-[10px] text-muted-foreground">Landing page & ethos</div>
              </div>
            </div>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/dashboard"
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-cyan-400 transition-transform group-hover:scale-110" />
              <div>
                <div className="font-bold text-white">Workspace</div>
                <div className="text-[10px] text-muted-foreground">Active student overview</div>
              </div>
            </div>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/chat"
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-purple-400 transition-transform group-hover:scale-110" />
              <div>
                <div className="font-bold text-white">Grounded RAG</div>
                <div className="text-[10px] text-muted-foreground">Query academic index</div>
              </div>
            </div>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/syllabus"
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-amber-400 transition-transform group-hover:scale-110" />
              <div>
                <div className="font-bold text-white">Course Syllabus</div>
                <div className="text-[10px] text-muted-foreground">Topic trees & schedule</div>
              </div>
            </div>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Primary CTA */}
        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-black shadow-xl transition-all hover:scale-105 hover:bg-slate-200 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Launch Primary Navigator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
