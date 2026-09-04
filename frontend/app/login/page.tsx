"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginContent() {
  const { user, loading, signIn, signInWithEmail, signUpWithEmail, signInAsDemo } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode");

  const [mode, setMode] = useState<"login" | "signup">(queryMode === "signup" ? "signup" : "login");

  useEffect(() => {
    if (queryMode === "signup" || queryMode === "login") {
      setMode(queryMode);
    }
  }, [queryMode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scholar Profile Details (collected upon registration)
  const [alias, setAlias] = useState("Quantum Scholar");
  const [username, setUsername] = useState("quantum_scholar");
  const [college, setCollege] = useState("Stanford University");
  const [course, setCourse] = useState("B.S. Computer Science & AI");
  const [year, setYear] = useState("3rd Year (Junior)");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1.0;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        console.warn("Autoplay with audio blocked by browser policy, unmuting on first interaction:", err);
        video.muted = true;
        try {
          await video.play();
        } catch {}

        const enableAudioOnInteraction = () => {
          if (!video) return;
          video.muted = false;
          video.volume = 1.0;
          video.play().catch(() => {});
          window.removeEventListener("click", enableAudioOnInteraction);
          window.removeEventListener("keydown", enableAudioOnInteraction);
          window.removeEventListener("touchstart", enableAudioOnInteraction);
        };

        window.addEventListener("click", enableAudioOnInteraction, { once: true });
        window.addEventListener("keydown", enableAudioOnInteraction, { once: true });
        window.addEventListener("touchstart", enableAudioOnInteraction, { once: true });
      }
    };

    tryPlay();
  }, []);

  const saveScholarProfileToStore = (customAlias?: string, customUsername?: string) => {
    try {
      const cleanHandle = (customUsername || username).replace(/^@/, "").trim() || "scholar";
      const cleanAlias = customAlias || alias || "Scholar";
      const profile = {
        alias: cleanAlias,
        username: `@${cleanHandle}`,
        college,
        course,
        year,
        bio: `Scholar at ${college} specializing in ${course}.`,
        isSetupComplete: true,
      };
      localStorage.setItem("polaris_comm_profile_v2", JSON.stringify(profile));
      window.dispatchEvent(new Event("polaris:community-updated"));
    } catch {}
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      saveScholarProfileToStore();
      await signIn();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    saveScholarProfileToStore("Alex Vance", "alex_vance");
    signInAsDemo();
    window.location.href = "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in both email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      saveScholarProfileToStore();
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* LEFT COLUMN: Clean Video Showcase */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-black overflow-hidden flex-col justify-between p-8 xl:p-12 select-none">
        {/* Background Looping Video with Sound */}
        <video
          ref={videoRef}
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/login-video.mp4" type="video/mp4" />
        </video>

        {/* Minimal Polaris branding on top */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform overflow-hidden">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-wider text-white drop-shadow-md">POLARIS</span>
              <span className="text-[10px] font-mono tracking-widest text-purple-300 uppercase drop-shadow-sm">
                Academic Knowledge Engine
              </span>
            </div>
          </Link>
        </div>

        <div />
      </div>

      {/* RIGHT COLUMN: Modern Split Login & Sign-up Form */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 bg-background relative z-20 overflow-y-auto">

        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Image src="/polaris-standalone.png" alt="Logo" width={28} height={28} className="object-contain" />
            <span className="font-bold text-base tracking-wider">POLARIS</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-8 py-8">

          {/* Header Title */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {mode === "login" ? "Welcome Back to Polaris" : "Create Your Account"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {mode === "login"
                ? "Enter your credentials to access your grounded knowledge workspace."
                : "Sign up to start indexing course notes, PDFs, and generating revision plans."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-xl bg-muted/60 flex items-center border border-border/40 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${mode === "login"
                  ? "bg-background text-foreground shadow-sm font-bold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${mode === "signup"
                  ? "bg-background text-foreground shadow-sm font-bold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full h-11 px-4 rounded-xl border border-border/60 bg-card hover:bg-muted/60 text-foreground text-xs font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:scale-[1.01] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* One-Click Demo Mode Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDemoSignIn}
              className="w-full h-11 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Instant Demo Mode — Skip Credentials</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-border/60 w-full" />
            <span className="bg-background px-3 text-[11px] text-muted-foreground uppercase font-mono tracking-wider absolute">
              Or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Scholar Name</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Unique Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground text-xs font-mono">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex_vance"
                        required
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* University / College */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">University / College</label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                  >
                    <option value="Stanford University">Stanford University</option>
                    <option value="Massachusetts Institute of Technology (MIT)">Massachusetts Institute of Technology (MIT)</option>
                    <option value="UC Berkeley">UC Berkeley</option>
                    <option value="Carnegie Mellon University (CMU)">Carnegie Mellon University (CMU)</option>
                    <option value="IIT Bombay">IIT Bombay</option>
                    <option value="IIT Delhi">IIT Delhi</option>
                    <option value="Oxford University">Oxford University</option>
                    <option value="Harvard University">Harvard University</option>
                    <option value="Georgia Tech">Georgia Tech</option>
                    <option value="University of Washington">University of Washington</option>
                    <option value="National University of Singapore (NUS)">National University of Singapore (NUS)</option>
                    <option value="Other / Global Academy">Other / Global Academy</option>
                  </select>
                </div>

                {/* Branch & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Branch / Major</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    >
                      <option value="B.S. Computer Science & AI">B.S. Computer Science & AI</option>
                      <option value="M.S. Artificial Intelligence & ML">M.S. Artificial Intelligence & ML</option>
                      <option value="B.Tech Electrical & Computer Engineering">B.Tech Electrical & Computer Engineering</option>
                      <option value="Data Science & Applied Statistics">Data Science & Applied Statistics</option>
                      <option value="Software Engineering & Systems">Software Engineering & Systems</option>
                      <option value="Mathematics & Quantum Computing">Mathematics & Quantum Computing</option>
                      <option value="Mechanical & Robotics Engineering">Mechanical & Robotics Engineering</option>
                      <option value="Biomedical Engineering">Biomedical Engineering</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Year of Study</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
                    >
                      <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                      <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                      <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                      <option value="4th Year (Senior)">4th Year (Senior)</option>
                      <option value="Master's Degree Candidate">Master's Degree Candidate</option>
                      <option value="PhD & Doctoral Scholar">PhD & Doctoral Scholar</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@polaris.edu"
                  required
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Password</label>
                {mode === "login" && (
                  <span className="text-[11px] text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/60 bg-muted/30 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Unique Gradient Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-purple-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 border border-purple-400/30"
            >
              <span>{mode === "login" ? "Sign In to Polaris Workspace" : "Register Scholar Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Footer toggle note */}
          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-bold hover:underline ml-1"
            >
              {mode === "login" ? "Sign Up Free" : "Log In"}
            </button>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-muted-foreground pt-4 border-t border-border/40">
          Polaris RAG Intelligence Platform • Secured by Firebase Auth & Qdrant Engine
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-xs font-mono">
          INITIALIZING SECURE PORTAL...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
