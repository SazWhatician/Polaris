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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.12)_0%,rgba(124,58,237,0.06)_45%,transparent_75%)] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 p-8 sm:p-12 rounded-3xl bg-card/70 border border-rose-500/20 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono tracking-[0.25em] uppercase shadow-lg">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
          <span>Vector Pipeline Exception</span>
        </div>

        {/* Center Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <CrystalGlow as="h1" fontSize="clamp(1.5rem, 3.5vw, 2.2rem)" fontWeight={900}>
            An Academic Disruption Occurred
          </CrystalGlow>
          <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
            The neural embedding or data interface encountered an unexpected barrier. Your workspace state remains safely preserved.
          </p>
        </div>

        {/* Error Details Disclosure */}
        {error.message && (
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-left overflow-x-auto">
            <p className="text-[10px] font-mono text-rose-400 uppercase tracking-wider mb-1">Diagnostic Log</p>
            <p className="text-xs font-mono text-slate-300 break-words line-clamp-3">{error.message}</p>
            {error.digest && (
              <p className="text-[10px] font-mono text-muted-foreground mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-align Orbit</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-white/15 bg-white/[0.06] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
