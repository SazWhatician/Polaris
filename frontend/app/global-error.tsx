"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#020616] p-6 font-sans text-white">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Root System Exception</h1>
            <p className="text-xs leading-relaxed text-slate-400">
              Polaris core encountered a critical framework initialization barrier.
            </p>
          </div>

          {error.message && (
            <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-left">
              <p className="line-clamp-3 break-words font-mono text-xs text-slate-300">
                {error.message}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-black shadow-lg transition-colors hover:bg-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Core Engine</span>
          </button>
        </div>
      </body>
    </html>
  );
}
