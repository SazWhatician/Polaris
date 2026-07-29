"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles, Terminal, Zap, ShieldCheck, ArrowRight, Activity, BookOpen, Target, Calendar, MessageSquare, Compass } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

export default function Home() {
  const { user, loading, signIn, signInAsDemo } = useAuth();
  const router = useRouter();
  const heroRef = useGsapEntrance(".gsap-item", 0.05);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-transparent">
      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <div className="font-mono text-[11px] px-3 py-1 border border-indigo-500/40 bg-black/60 text-indigo-300 font-bold uppercase tracking-widest hidden sm:block">
          [SYS_READY // GLSL_ACTIVE]
        </div>
        <ThemeToggle />
      </div>

      <div ref={heroRef} className="z-20 max-w-5xl w-full flex flex-col items-center space-y-6 text-center">
        
        {/* Transparent Main Polaris Logo Intro */}
        <div className="gsap-item flex flex-col items-center space-y-3">
          <div className="relative hover:scale-105 transition-transform duration-300 cursor-pointer">
            <Image
              src="/polaris-logo.png"
              alt="Polaris Main Logo"
              width={640}
              height={220}
              priority
              className="w-[360px] sm:w-[500px] md:w-[640px] h-auto object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 border border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono text-xs uppercase tracking-widest font-bold">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Autonomous Academic Intelligence Engine</span>
          </div>
        </div>

        {/* Hero Tagline */}
        <div className="gsap-item space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-black font-mono tracking-tight uppercase leading-none">
            BRUTALIST <span className="gradient-text">ACADEMIC NAVIGATOR</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Turn raw course PDFs into structured knowledge trees, compute coverage scores, isolate learning gaps, and generate date-bounded revision plans.
          </p>
        </div>

        {/* Auth Interface */}
        <div className="gsap-item w-full max-w-md">
          <div className="brutal-card p-5 bg-slate-950/90 text-left space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-indigo-500/40 pb-3">
              <div className="font-mono font-bold text-xs text-slate-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span>USER_AUTHENTICATION</span>
              </div>
              <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 border border-indigo-500/40 font-bold">
                AUTH_V1
              </span>
            </div>

            <div className="space-y-3">
              {/* 1-Click Instant Demo Button */}
              <button
                onClick={signInAsDemo}
                disabled={loading}
                className="brutal-btn w-full flex items-center justify-center gap-3 text-xs py-3"
              >
                <Zap className="h-4 w-4 text-yellow-300 fill-current animate-bounce" />
                <span>1-CLICK DEMO ACCESS</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-3 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                  OR GOOGLE OAUTH
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Google OAuth */}
              <Button
                onClick={signIn}
                disabled={loading}
                variant="outline"
                className="w-full h-10 border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs uppercase tracking-wider rounded-none font-bold flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Sign In</span>
              </Button>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  TENANT_ISOLATED
                </span>
                <span>EMULATOR_SUPPORT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brutalist Capabilities Grid */}
        <div className="gsap-item grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl w-full text-left pt-2">
          <BrutalFeatureCard
            icon={<BookOpen className="h-4 w-4 text-indigo-400" />}
            code="PHASE_04"
            title="Syllabus Intelligence"
            desc="Tree extraction & coverage rubric scoring."
          />
          <BrutalFeatureCard
            icon={<Target className="h-4 w-4 text-purple-400" />}
            code="PHASE_05"
            title="Learning Gap Agent"
            desc="LangGraph state machine for Known/Weak/Missing."
          />
          <BrutalFeatureCard
            icon={<Calendar className="h-4 w-4 text-pink-400" />}
            code="PHASE_07"
            title="Revision Planner"
            desc="Constraint-aware study schedules & semantic diffing."
          />
          <BrutalFeatureCard
            icon={<Sparkles className="h-4 w-4 text-cyan-400" />}
            code="PHASE_06"
            title="Resource Discovery"
            desc="YouTube API educational search & LLM ranker."
          />
          <BrutalFeatureCard
            icon={<MessageSquare className="h-4 w-4 text-emerald-400" />}
            code="PHASE_03"
            title="Grounded RAG Chat"
            desc="Streamed AI answers with page snippet citations."
          />
          <BrutalFeatureCard
            icon={<Compass className="h-4 w-4 text-yellow-400" />}
            code="PHASE_11"
            title="LiteRT.js Ambient Layer"
            desc="On-device WebGPU embedding & Chrome extension."
          />
        </div>
      </div>
    </main>
  );
}

function BrutalFeatureCard({
  icon,
  code,
  title,
  desc,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="brutal-card p-3 space-y-1 bg-black/80 hover:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between">
        <div className="p-1.5 border border-slate-800 bg-white/5">{icon}</div>
        <span className="font-mono text-[9px] font-bold text-indigo-400 tracking-wider">[{code}]</span>
      </div>
      <h3 className="font-mono font-bold text-xs text-slate-100 uppercase tracking-wide">{title}</h3>
      <p className="font-mono text-[11px] text-slate-400 leading-snug">{desc}</p>
    </div>
  );
}
