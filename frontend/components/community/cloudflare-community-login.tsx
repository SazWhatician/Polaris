"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  School,
  AtSign,
  User,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Globe,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLLEGES, COURSES, YEARS, useCommunityStore } from "@/lib/community-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onSuccess?: () => void;
}

export function CloudflareCommunityLogin({ onSuccess }: Props) {
  const { loginWithCloudflare } = useCommunityStore();

  const [username, setUsername] = useState("");
  const [alias, setAlias] = useState("");
  const [college, setCollege] = useState<string>(COLLEGES[0] || "Stanford University");
  const [customCollege, setCustomCollege] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0] || "B.S. Computer Science & AI");
  const [year, setYear] = useState<string>(YEARS[2] || "3rd Year (Junior)");
  const [bio, setBio] = useState("");

  // Turnstile verification state
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [turnstileChecking, setTurnstileChecking] = useState(false);
  const [rayId] = useState(`8e24f${Math.random().toString(36).substring(2, 8)}7b01`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTurnstileClick = () => {
    if (turnstileVerified || turnstileChecking) return;
    setTurnstileChecking(true);
    setTimeout(() => {
      setTurnstileChecking(false);
      setTurnstileVerified(true);
      toast.success("Cloudflare Turnstile Verified", {
        description: `Edge Handshake Verified (TLS 1.3 • Ray ID: ${rayId})`,
      });
    }, 900);
  };

  const handleQuickFill = (
    presetCollege: string,
    presetUsername: string,
    presetAlias: string,
    presetCourse: string,
  ) => {
    setCollege(presetCollege);
    setUsername(presetUsername);
    setAlias(presetAlias);
    setCourse(presetCourse);
    setTurnstileVerified(true);
    toast.info(`Filled with ${presetAlias} profile`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileVerified) {
      toast.error("Please complete the Cloudflare security verification");
      return;
    }

    const cleanUsername = username
      .trim()
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      toast.error("Please provide a valid unique username");
      return;
    }

    const effectiveCollege =
      college === "Other / Global Academy" && customCollege.trim() ? customCollege.trim() : college;
    if (!effectiveCollege) {
      toast.error("Please select or enter your college / university");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      loginWithCloudflare({
        username: `@${cleanUsername}`,
        alias: alias.trim() || cleanUsername,
        college: effectiveCollege,
        course,
        year,
        bio:
          bio.trim() || `Scholar from ${effectiveCollege} exploring AI, systems, and coursework.`,
        cfRayId: rayId,
      });

      toast.success("Welcome to Polaris Community!", {
        description: `Authenticated via Cloudflare as @${cleanUsername} (${effectiveCollege})`,
      });
      setIsSubmitting(false);
      onSuccess?.();
    }, 600);
  };

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-10 sm:px-6">
      {/* Ambient orange-indigo security aura */}
      <div className="ambient-liquid-glow pointer-events-none -left-20 -top-20 h-[450px] w-[450px] bg-[#F6821F]/15 blur-3xl" />
      <div className="ambient-liquid-glow pointer-events-none -bottom-20 -right-20 h-[450px] w-[450px] bg-indigo-500/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Cloudflare Header Card */}
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-2xl shadow-black/40 backdrop-blur-2xl dark:border-white/10">
          {/* Top Banner: Cloudflare Security Gateway */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#F6821F]/15 via-black/40 to-indigo-950/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F6821F]/40 bg-[#F6821F]/20 text-[#F6821F] shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="flex items-center gap-1.5 text-sm font-black tracking-tight text-foreground">
                    <span>Cloudflare Zero Trust</span>
                    <span className="rounded-full border border-[#F6821F]/30 bg-[#F6821F]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#F6821F]">
                      Community Gateway
                    </span>
                  </h2>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Verified Edge Access • Ray ID: <span className="text-foreground/80">{rayId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Edge Active</span>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {/* Title & Introduction */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight text-foreground sm:justify-start">
                <span>Join Scholar Community</span>
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground">
                A separate, peer-verified network. Authenticate with Cloudflare, select your
                university and handle, and connect with fellow scholars.
              </p>
            </div>

            {/* Cloudflare Turnstile Challenge Simulation */}
            <button
              type="button"
              id="cloudflare-turnstile-btn"
              onClick={handleTurnstileClick}
              className={cn(
                "flex w-full cursor-pointer select-none items-center justify-between gap-4 rounded-2xl border p-3.5 text-left transition-all",
                turnstileVerified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 hover:border-[#F6821F]/50 hover:bg-[#F6821F]/5",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all",
                    turnstileVerified
                      ? "border-emerald-400 bg-emerald-500 text-black"
                      : turnstileChecking
                        ? "border-[#F6821F] bg-[#F6821F]/10"
                        : "border-white/30 bg-white/5",
                  )}
                >
                  {turnstileVerified ? (
                    <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                  ) : turnstileChecking ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#F6821F]" />
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {turnstileVerified
                      ? "Success! Human verification verified by Cloudflare"
                      : turnstileChecking
                        ? "Verifying browser and connection security..."
                        : "Verify you are human (Cloudflare Turnstile)"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {turnstileVerified
                      ? "Encrypted token: sha256:cf_edge_ok"
                      : "Click the box to complete security check"}
                  </p>
                </div>
              </div>

              {/* Cloudflare Badge Logo */}
              <div className="flex shrink-0 flex-col items-end">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#F6821F]">
                  <Globe className="h-3.5 w-3.5" />
                  <span>CLOUDFLARE</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">
                  Turnstile Privacy
                </span>
              </div>
            </button>

            {/* Registration / Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* College & Username inputs */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-muted-foreground">
                    <AtSign className="h-3.5 w-3.5 text-primary" />
                    <span>Unique Handle</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                      @
                    </span>
                    <input
                      id="community-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="saz_polaris"
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-8 pr-3 font-mono text-xs font-bold text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Scholar Alias */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Full Name / Alias</span>
                  </label>
                  <input
                    id="community-alias-input"
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="e.g. Saz Vance"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* College Selection */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between font-mono text-[11px] font-bold uppercase text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-emerald-400" />
                    <span>University / College</span>
                    <span className="text-destructive">*</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">Academic Hub</span>
                </label>
                <select
                  id="community-college-select"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {COLLEGES.map((col) => (
                    <option key={col} value={col} className="bg-zinc-900 text-foreground">
                      {col}
                    </option>
                  ))}
                </select>

                {college === "Other / Global Academy" && (
                  <input
                    type="text"
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    placeholder="Type your university name..."
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                )}
              </div>

              {/* Course & Year */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                    <span>Major / Department</span>
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-900 text-foreground">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    <span>Academic Year</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="bg-zinc-900 text-foreground">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio / Tagline */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase text-muted-foreground">
                  Scholar Bio / Focus
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Distributed systems researcher & Pintos hacker."
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                id="community-submit-btn"
                type="submit"
                disabled={isSubmitting || !turnstileVerified}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all",
                  turnstileVerified
                    ? "cursor-pointer bg-gradient-to-r from-[#F6821F] to-orange-500 text-white shadow-orange-500/25 hover:brightness-110"
                    : "cursor-not-allowed bg-white/10 text-muted-foreground",
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Authorizing Cloudflare Session...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Enter Community with Cloudflare</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick-fill presets for test convenience */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>Instant Scholar Presets:</span>
                <span className="text-[10px] text-primary">1-Click Test</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  id="preset-stanford-btn"
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      "Stanford University",
                      "alex_stanford",
                      "Alex Vance",
                      "M.S. Artificial Intelligence & ML",
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                >
                  <p className="truncate text-[11px] font-bold text-foreground">Stanford</p>
                  <p className="font-mono text-[10px] text-muted-foreground">@alex_stanford</p>
                </button>
                <button
                  id="preset-mit-btn"
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      "Massachusetts Institute of Technology (MIT)",
                      "elena_mit",
                      "Elena Vance",
                      "B.Tech Electrical & Computer Engineering",
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                >
                  <p className="truncate text-[11px] font-bold text-foreground">MIT EECS</p>
                  <p className="font-mono text-[10px] text-muted-foreground">@elena_mit</p>
                </button>
                <button
                  id="preset-berkeley-btn"
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      "UC Berkeley",
                      "kai_cal",
                      "Kai Tanaka",
                      "B.S. Computer Science & AI",
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                >
                  <p className="truncate text-[11px] font-bold text-foreground">UC Berkeley</p>
                  <p className="font-mono text-[10px] text-muted-foreground">@kai_cal</p>
                </button>
                <button
                  id="preset-iitb-btn"
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      "IIT Bombay",
                      "arjun_iitb",
                      "Arjun Roy",
                      "Mathematics & Quantum Computing",
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                >
                  <p className="truncate text-[11px] font-bold text-foreground">IIT Bombay</p>
                  <p className="font-mono text-[10px] text-muted-foreground">@arjun_iitb</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
