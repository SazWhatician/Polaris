"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { SkeuoScrews, VUMeter } from "@/components/skeuomorphic-controls";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

export default function Home() {
  const { user, loading, signIn, signInWithEmail, signUpWithEmail, signInAsDemo } = useAuth();
  const router = useRouter();
  const heroRef = useGsapEntrance(".gsap-item", 0.05);

  const [authTab, setAuthTab] = useState<"demo" | "google" | "email">("demo");
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
    <div className="min-h-screen text-foreground relative flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl skeuo-inset flex items-center justify-center overflow-hidden shadow-inner">
            <Image
              src="/polaris-logo.png"
              alt="Polaris Logo"
              width={40}
              height={40}
              className="object-contain drop-shadow"
            />
          </div>
          <div className="flex flex-col">
            <span className="skeuo-title text-xl tracking-tight leading-none">POLARIS</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
              Autonomous AI Engine
            </span>
          </div>
        </div>

        {/* Rotary Theme Switch Dial */}
        <ThemeToggle />
      </header>

      {/* Main Hero & Skeuomorphic Auth Card Deck */}
      <main
        ref={heroRef}
        className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto py-8 space-y-8"
      >
        {/* Main Polaris Hero Emblem */}
        <div className="gsap-item flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full skeuo-card p-6 flex items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-300">
            <SkeuoScrews />
            <Image
              src="/polaris-logo.png"
              alt="Polaris Main Logo"
              width={1000}
              height={1000}
              priority
              className="object-contain w-full h-full drop-shadow-2xl animate-pulse"
            />
          </div>

          <div className="skeuo-badge text-xs text-indigo-300 font-mono tracking-widest flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Autonomous Academic Intelligence Engine</span>
          </div>
        </div>

        {/* Hero Tagline */}
        <div className="gsap-item space-y-3 max-w-3xl">
          <p className="text-foreground text-sm sm:text-base leading-relaxed font-semibold">
            Upload course PDFs and syllabi to build structured knowledge trees, compute coverage scores, isolate learning gaps with video solutions, and generate date-bounded revision plans.
          </p>
        </div>

        {/* Ultra Skeuomorphic Multi-Card Auth Deck */}
        <div className="gsap-item w-full max-w-lg">
          <div className="skeuo-card p-7 text-left space-y-5 relative overflow-hidden shadow-2xl">
            <SkeuoScrews />

            {/* Deck Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2 text-base font-black text-foreground">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <span>Student Portal Sign-In</span>
              </div>
              <span className="skeuo-badge text-[11px] text-emerald-400 border-emerald-500/30 font-mono flex items-center gap-1">
                <div className="led-indicator text-emerald-400 animate-pulse" />
                V1_ACTIVE
              </span>
            </div>

            {/* Analog Telemetry Meter */}
            <VUMeter label="Qdrant Hybrid Engine Status" level={92} />

            {/* Skeuomorphic 3-Tab Selector Cards */}
            <div className="grid grid-cols-3 gap-1.5 skeuo-inset p-1.5 text-xs font-semibold select-none">
              <button
                type="button"
                onClick={() => setAuthTab("demo")}
                className={`py-2.5 rounded-lg transition-all ${
                  authTab === "demo"
                    ? "skeuo-button text-white font-bold shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1-Click Demo
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("google")}
                className={`py-2.5 rounded-lg transition-all ${
                  authTab === "google"
                    ? "skeuo-button text-white font-bold shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Google OAuth
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("email")}
                className={`py-2.5 rounded-lg transition-all ${
                  authTab === "email"
                    ? "skeuo-button text-white font-bold shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Email Sign-In
              </button>
            </div>

            {/* Card 1: Instant Demo Session */}
            {authTab === "demo" && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Instant zero-config access for review & evaluation. Pre-loaded with syllabus data, sample notes, and grounded RAG session.
                </p>
                <button
                  onClick={signInAsDemo}
                  disabled={loading}
                  className="skeuo-button w-full text-xs py-4 font-extrabold tracking-wide uppercase"
                >
                  <Zap className="h-4 w-4 text-amber-300 fill-current animate-bounce" />
                  <span>START 1-CLICK DEMO SESSION</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            )}

            {/* Card 2: Google OAuth Card */}
            {authTab === "google" && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
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

            {/* Card 3: Email / Password Portal Card */}
            {authTab === "email" && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5 pt-1 animate-in fade-in duration-200">
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
                    className="text-[11px] text-indigo-400 hover:underline font-bold"
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
              <span className="font-mono text-[10px]">AES-256</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 border-t border-white/10 text-center text-xs text-muted-foreground font-semibold">
        Polaris Academic Engine &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
