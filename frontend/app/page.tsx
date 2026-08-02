"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  Activity,
  BookOpen,
  Target,
  Calendar,
  MessageSquare,
  Compass,
  Mail,
  Lock,
  UserCheck,
  Layers,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeDial, SkeuoScrews, VUMeter } from "@/components/skeuomorphic-controls";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

export default function Home() {
  const { user, loading, signIn, signInWithEmail, signUpWithEmail, signInAsDemo } = useAuth();
  const router = useRouter();
  const heroRef = useGsapEntrance(".gsap-item", 0.05);

  const [authTab, setAuthTab] = useState<"demo" | "email" | "google">("demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegistering) {
      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <div className="skeuo-badge text-xs hidden md:flex items-center gap-2 text-foreground font-mono">
          <div className="led-indicator text-emerald-400 animate-pulse" />
          <span>POLARIS CORE ONLINE</span>
        </div>
        <ThemeDial />
        <ThemeToggle />
      </div>

      <div ref={heroRef} className="z-20 max-w-6xl w-full flex flex-col items-center space-y-8 text-center mt-6 sm:mt-0">
        
        {/* Main Polaris Logo Presentation — Enlarged & Prominent */}
        <div className="gsap-item flex flex-col items-center space-y-4">
          <div className="relative max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full px-4 hover:scale-105 transition-transform duration-300">
            <Image
              src="/polaris-logo.png"
              alt="Polaris Logo"
              width={1000}
              height={500}
              priority
              className="w-full h-auto object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.85)]"
            />
          </div>

          <div className="skeuo-badge text-xs sm:text-sm flex items-center gap-2 text-foreground font-semibold px-4 py-1.5">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Autonomous Academic Intelligence Engine</span>
          </div>
        </div>

        {/* Hero Tagline */}
        <div className="gsap-item space-y-3 max-w-3xl">
          <p className="text-foreground text-sm sm:text-base leading-relaxed font-semibold">
            Upload course PDFs and syllabi to build structured knowledge trees, compute coverage scores, isolate learning gaps with video solutions, and generate date-bounded revision plans.
          </p>
        </div>

        {/* Skeuomorphic Auth Interface with Screws & Telemetry */}
        <div className="gsap-item w-full max-w-lg">
          <div className="skeuo-card p-7 text-left space-y-5 relative overflow-hidden shadow-2xl">
            <SkeuoScrews />

            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2 text-base font-black text-foreground">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <span>Student Portal Sign-In</span>
              </div>
              <span className="skeuo-badge text-[11px] text-emerald-400 border-emerald-500/30 font-mono">
                V1_ACTIVE
              </span>
            </div>

            {/* Analog VU Telemetry Meter */}
            <VUMeter label="Qdrant Hybrid Engine Status" level={92} />

            {/* Auth Tab Selectors */}
            <div className="grid grid-cols-3 gap-1.5 skeuo-inset p-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthTab("demo")}
                className={`py-2.5 rounded-lg transition-all select-none ${
                  authTab === "demo"
                    ? "skeuo-button text-white font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1-Click Demo
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("google")}
                className={`py-2.5 rounded-lg transition-all select-none ${
                  authTab === "google"
                    ? "skeuo-button text-white font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Google OAuth
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("email")}
                className={`py-2.5 rounded-lg transition-all select-none ${
                  authTab === "email"
                    ? "skeuo-button text-white font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Email Sign-In
              </button>
            </div>

            {/* Tab Contents */}
            {authTab === "demo" && (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Instant zero-config access for review & evaluation. Includes pre-loaded syllabus data, sample notes, and grounded RAG session.
                </p>
                <button
                  onClick={signInAsDemo}
                  disabled={loading}
                  className="skeuo-button w-full text-xs py-3.5 font-extrabold"
                >
                  <Zap className="h-4 w-4 text-amber-300 fill-current animate-bounce" />
                  <span>START 1-CLICK DEMO SESSION</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            )}

            {authTab === "google" && (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Sign in securely with your Firebase-verified Google student or university email account.
                </p>
                <button
                  onClick={signIn}
                  disabled={loading}
                  className="skeuo-button-secondary w-full h-12 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google OAuth</span>
                </button>
              </div>
            )}

            {authTab === "email" && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full px-3.5 py-2.5 skeuo-inset text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-500" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 skeuo-inset text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="skeuo-button w-full text-xs py-3 mt-2 font-bold"
                >
                  {isRegistering ? "CREATE ACCOUNT" : "SIGN IN WITH EMAIL"}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[11px] text-indigo-500 hover:underline font-bold"
                  >
                    {isRegistering ? "Already have an account? Sign in" : "Need an account? Register here"}
                  </button>
                </div>
              </form>
            )}

            {/* Tenant Security Tag */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-white/10 font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <ShieldCheck className="h-4 w-4" />
                Firebase Auth & Tenant Isolated
              </span>
              <span className="text-muted-foreground font-mono">JWT Security</span>
            </div>
          </div>
        </div>

        {/* 4-Step Academic Workflow Cards */}
        <div className="gsap-item grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl w-full text-left pt-4">
          <SleekWorkflowCard
            step="1"
            icon={<BookOpen className="h-4 w-4 text-indigo-500" />}
            title="Upload Docs & Syllabus"
            desc="Extract structured knowledge trees and score course coverage."
          />
          <SleekWorkflowCard
            step="2"
            icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
            title="Grounded RAG Chat"
            desc="Streamed AI answers cited from your exact uploaded PDF snippets."
          />
          <SleekWorkflowCard
            step="3"
            icon={<Target className="h-4 w-4 text-pink-500" />}
            title="Gaps & YT Discovery"
            desc="Isolate weak concepts and recommend targeted YouTube video lessons."
          />
          <SleekWorkflowCard
            step="4"
            icon={<Calendar className="h-4 w-4 text-cyan-500" />}
            title="Date Revision Plan"
            desc="Generate constraint-aware study schedules before exam day."
          />
        </div>

        {/* Core Technical Highlights */}
        <div className="gsap-item grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-6xl w-full text-left">
          <div className="skeuo-card p-5 flex items-start gap-3 relative">
            <SkeuoScrews />
            <Layers className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Multi-Tenant Qdrant Hybrid Search</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">
                Dense vector retrieval coupled with sparse BM25 reranking for precise snippet extraction.
              </p>
            </div>
          </div>
          <div className="skeuo-card p-5 flex items-start gap-3 relative">
            <SkeuoScrews />
            <Compass className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">LangGraph Agent State Machine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">
                Deterministic multi-node agent tracing notes coverage vs syllabus requirements.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

function SleekWorkflowCard({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="skeuo-card p-4 space-y-2 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <SkeuoScrews />
      <div className="flex items-center justify-between">
        <div className="p-2 skeuo-inset">{icon}</div>
        <span className="skeuo-badge text-[10px] font-mono font-bold text-foreground">
          {step}
        </span>
      </div>
      <h3 className="font-extrabold text-xs tracking-wide text-foreground">{title}</h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
