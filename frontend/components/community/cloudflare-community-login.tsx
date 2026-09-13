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

  const handleQuickFill = (presetCollege: string, presetUsername: string, presetAlias: string, presetCourse: string) => {
    setCollege(presetCollege);
    setUsername(presetUsername);
    setAlias(presetAlias);
    setCourse(presetCourse);
    setTurnstileVerified(true);
    toast.info(`Filled with ${presetAlias} profile`);
  };

  const handleDirectDemoLogin = (presetCollege: string, presetUsername: string, presetAlias: string, presetCourse: string) => {
    loginWithCloudflare({
      username: `@${presetUsername}`,
      alias: presetAlias,
      college: presetCollege,
      course: presetCourse,
      year: "3rd Year (Junior)",
      bio: `Scholar from ${presetCollege} collaborating via Polaris Community.`,
      cfRayId: rayId,
    });
    toast.success(`Welcome to Polaris Community as ${presetAlias}!`);
    onSuccess?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileVerified) {
      toast.error("Please complete the Cloudflare security verification");
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      toast.error("Please provide a valid unique username");
      return;
    }

    const effectiveCollege = college === "Other / Global Academy" && customCollege.trim() ? customCollege.trim() : college;
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
        bio: bio.trim() || `Scholar from ${effectiveCollege} exploring AI, systems, and coursework.`,
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
    <div className="relative min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      {/* Ambient orange-indigo security aura */}
      <div className="ambient-liquid-glow -top-20 -left-20 w-[450px] h-[450px] bg-[#F6821F]/15 blur-3xl pointer-events-none" />
      <div className="ambient-liquid-glow -bottom-20 -right-20 w-[450px] h-[450px] bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Cloudflare Header Card */}
        <div className="overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/40">
          {/* Top Banner: Cloudflare Security Gateway */}
          <div className="border-b border-white/10 bg-gradient-to-r from-[#F6821F]/15 via-black/40 to-indigo-950/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F6821F]/20 border border-[#F6821F]/40 flex items-center justify-center text-[#F6821F] shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
                    <span>Cloudflare Zero Trust</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#F6821F]/20 text-[#F6821F] border border-[#F6821F]/30">
                      Community Gateway
                    </span>
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Verified Edge Access • Ray ID: <span className="text-foreground/80">{rayId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Edge Active</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Introduction */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                <span>Join Scholar Community</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A separate, peer-verified network. Authenticate with Cloudflare, select your university and handle, and connect with fellow scholars.
              </p>
            </div>

            {/* Cloudflare Turnstile Challenge Simulation */}
            <button
              type="button"
              id="cloudflare-turnstile-btn"
              onClick={handleTurnstileClick}
              className={cn(
                "w-full p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 text-left",
                turnstileVerified
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/5 border-white/10 hover:border-[#F6821F]/50 hover:bg-[#F6821F]/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0",
                    turnstileVerified
                      ? "bg-emerald-500 border-emerald-400 text-black"
                      : turnstileChecking
                      ? "border-[#F6821F] bg-[#F6821F]/10"
                      : "border-white/30 bg-white/5"
                  )}
                >
                  {turnstileVerified ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  ) : turnstileChecking ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F6821F]" />
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
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {turnstileVerified ? "Encrypted token: sha256:cf_edge_ok" : "Click the box to complete security check"}
                  </p>
                </div>
              </div>

              {/* Cloudflare Badge Logo */}
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#F6821F]">
                  <Globe className="w-3.5 h-3.5" />
                  <span>CLOUDFLARE</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">Turnstile Privacy</span>
              </div>
            </button>

            {/* Registration / Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* College & Username inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-primary" />
                    <span>Unique Handle</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                      @
                    </span>
                    <input
                      id="community-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="saz_polaris"
                      className="w-full pl-8 pr-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Scholar Alias */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Full Name / Alias</span>
                  </label>
                  <input
                    id="community-alias-input"
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="e.g. Saz Vance"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
                  />
                </div>
              </div>

              {/* College Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-emerald-400" />
                    <span>University / College</span>
                    <span className="text-destructive">*</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Academic Hub</span>
                </label>
                <select
                  id="community-college-select"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-colors"
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
                    className="mt-2 w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary text-foreground"
                  />
                )}
              </div>

              {/* Course & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Major / Department</span>
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary text-foreground"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-900 text-foreground">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Academic Year</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary text-foreground"
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
                <label className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
                  Scholar Bio / Focus
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Distributed systems researcher & Pintos hacker."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/15 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Submit Button */}
              <Button
                id="community-submit-btn"
                type="submit"
                disabled={isSubmitting || !turnstileVerified}
                className={cn(
                  "w-full h-11 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg",
                  turnstileVerified
                    ? "bg-gradient-to-r from-[#F6821F] to-orange-500 hover:brightness-110 text-white shadow-orange-500/25 cursor-pointer"
                    : "bg-white/10 text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Cloudflare Session...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enter Community with Cloudflare</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick-fill presets for test convenience */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Instant Scholar Presets:</span>
                <span className="text-[10px] text-primary">1-Click Test</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  id="preset-stanford-btn"
                  type="button"
                  onClick={() => handleQuickFill("Stanford University", "alex_stanford", "Alex Vance", "M.S. Artificial Intelligence & ML")}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-foreground truncate">Stanford</p>
                  <p className="text-[10px] font-mono text-muted-foreground">@alex_stanford</p>
                </button>
                <button
                  id="preset-mit-btn"
                  type="button"
                  onClick={() => handleQuickFill("Massachusetts Institute of Technology (MIT)", "elena_mit", "Elena Vance", "B.Tech Electrical & Computer Engineering")}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-foreground truncate">MIT EECS</p>
                  <p className="text-[10px] font-mono text-muted-foreground">@elena_mit</p>
                </button>
                <button
                  id="preset-berkeley-btn"
                  type="button"
                  onClick={() => handleQuickFill("UC Berkeley", "kai_cal", "Kai Tanaka", "B.S. Computer Science & AI")}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-foreground truncate">UC Berkeley</p>
                  <p className="text-[10px] font-mono text-muted-foreground">@kai_cal</p>
                </button>
                <button
                  id="preset-iitb-btn"
                  type="button"
                  onClick={() => handleQuickFill("IIT Bombay", "arjun_iitb", "Arjun Roy", "Mathematics & Quantum Computing")}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-foreground truncate">IIT Bombay</p>
                  <p className="text-[10px] font-mono text-muted-foreground">@arjun_iitb</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
