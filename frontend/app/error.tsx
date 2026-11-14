"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { CrystalGlow } from "@/components/ui/crystal-glow";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Telemetry log for debugging
    console.error("Polaris Core Exception caught by ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white selection:bg-rose-500/30">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.12)_0%,rgba(124,58,237,0.06)_45%,transparent_75%)]" />

      <div className="relative z-10 w-full max-w-lg space-y-6 rounded-3xl border border-rose-500/20 bg-card/70 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-12">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-rose-400 shadow-lg">
          <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
          <span>Vector Pipeline Exception</span>
        </div>

        {/* Center Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <CrystalGlow as="h1" fontSize="clamp(1.5rem, 3.5vw, 2.2rem)" fontWeight={900}>
            An Academic Disruption Occurred
          </CrystalGlow>
          <p className="text-xs font-light leading-relaxed text-slate-300 sm:text-sm">
            The neural embedding or data interface encountered an unexpected barrier. Your workspace
            state remains safely preserved.
          </p>
        </div>

        {/* Error Details Disclosure */}
        {error.message && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60 p-3.5 text-left">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-rose-400">
              Diagnostic Log
            </p>
            <p className="line-clamp-3 break-words font-mono text-xs text-slate-300">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-black shadow-xl transition-all hover:scale-105 hover:bg-slate-200 active:scale-95 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Re-align Orbit</span>
          </button>

          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            <span>Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
