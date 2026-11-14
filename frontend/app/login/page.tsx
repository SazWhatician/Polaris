"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Sparkles, ArrowRight, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";
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
    router.prefetch("/dashboard");
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
        console.warn(
          "Autoplay with audio blocked by browser policy, unmuting on first interaction:",
          err,
        );
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
      const success = await signIn();
      if (success) {
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    saveScholarProfileToStore("Alex Vance", "alex_vance");
    signInAsDemo();
    router.replace("/dashboard");
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
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* LEFT COLUMN: Clean Video Showcase */}
      <div className="relative hidden select-none flex-col justify-between overflow-hidden bg-black p-8 lg:flex lg:w-7/12 xl:p-12">
        {/* Background Looping Video with Sound */}
        <video
          ref={videoRef}
          autoPlay
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/login-video.mp4" type="video/mp4" />
        </video>

        {/* Minimal Polaris branding on top */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl backdrop-blur-md transition-transform group-hover:scale-105">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white drop-shadow-md">
                POLARIS
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-purple-300 drop-shadow-sm">
                Academic Knowledge Engine
              </span>
            </div>
          </Link>
        </div>

        <div />
      </div>

      {/* RIGHT COLUMN: Modern Split Login & Sign-up Form */}
      <div className="relative z-20 flex w-full flex-col justify-between overflow-y-auto bg-background p-6 sm:p-12 lg:w-5/12">
        {/* Top Action Bar */}
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/polaris-standalone.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-base font-bold tracking-wider">POLARIS</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md space-y-8 py-8">
          {/* Header Title */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {mode === "login" ? "Welcome Back to Polaris" : "Create Your Account"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {mode === "login"
                ? "Enter your credentials to access your grounded knowledge workspace."
                : "Sign up to start indexing course notes, PDFs, and generating revision plans."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-xl border border-border/40 bg-muted/60 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-all duration-200 ${
                mode === "login"
                  ? "border border-border/50 bg-background font-bold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-all duration-200 ${
                mode === "signup"
                  ? "border border-border/50 bg-background font-bold text-foreground shadow-sm"
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
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-card px-4 text-xs font-bold text-foreground shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-muted/60 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Instant Demo Mode — Skip Credentials</span>
            </button>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-border/60" />
            <span className="absolute bg-background px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                {/* Full Name & Username */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Scholar Name</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      required
                      className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3.5 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Unique Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-xs text-muted-foreground">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex_vance"
                        required
                        className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-7 pr-3 font-mono text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
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
                    className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Stanford University">Stanford University</option>
                    <option value="Massachusetts Institute of Technology (MIT)">
                      Massachusetts Institute of Technology (MIT)
                    </option>
                    <option value="UC Berkeley">UC Berkeley</option>
                    <option value="Carnegie Mellon University (CMU)">
                      Carnegie Mellon University (CMU)
                    </option>
                    <option value="IIT Bombay">IIT Bombay</option>
                    <option value="IIT Delhi">IIT Delhi</option>
                    <option value="Oxford University">Oxford University</option>
                    <option value="Harvard University">Harvard University</option>
                    <option value="Georgia Tech">Georgia Tech</option>
                    <option value="University of Washington">University of Washington</option>
                    <option value="National University of Singapore (NUS)">
                      National University of Singapore (NUS)
                    </option>
                    <option value="Other / Global Academy">Other / Global Academy</option>
                  </select>
                </div>

                {/* Branch & Year */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Branch / Major</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="B.S. Computer Science & AI">B.S. Computer Science & AI</option>
                      <option value="M.S. Artificial Intelligence & ML">
                        M.S. Artificial Intelligence & ML
                      </option>
                      <option value="B.Tech Electrical & Computer Engineering">
                        B.Tech Electrical & Computer Engineering
                      </option>
                      <option value="Data Science & Applied Statistics">
                        Data Science & Applied Statistics
                      </option>
                      <option value="Software Engineering & Systems">
                        Software Engineering & Systems
                      </option>
                      <option value="Mathematics & Quantum Computing">
                        Mathematics & Quantum Computing
                      </option>
                      <option value="Mechanical & Robotics Engineering">
                        Mechanical & Robotics Engineering
                      </option>
                      <option value="Biomedical Engineering">Biomedical Engineering</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Year of Study</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
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
                <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@polaris.edu"
                  required
                  className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-10 pr-4 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Password</label>
                {mode === "login" && (
                  <span className="cursor-pointer text-[11px] text-primary hover:underline">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-10 pr-10 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/40"
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
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-xs font-black tracking-wide text-white shadow-xl shadow-purple-500/25 transition-all duration-300 hover:scale-[1.01] hover:from-indigo-700 hover:to-pink-700 active:scale-[0.99] sm:text-sm"
            >
              <span>
                {mode === "login" ? "Sign In to Polaris Workspace" : "Register Scholar Account"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Footer toggle note */}
          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="ml-1 font-bold text-primary hover:underline"
            >
              {mode === "login" ? "Sign Up Free" : "Log In"}
            </button>
          </p>
        </div>

        {/* Footer info */}
        <div className="border-t border-border/40 pt-4 text-center text-[11px] text-muted-foreground">
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
        <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs text-muted-foreground">
          INITIALIZING SECURE PORTAL...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
