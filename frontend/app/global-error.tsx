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
      <body className="min-h-screen bg-[#020616] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Root System Exception</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Polaris core encountered a critical framework initialization barrier.
            </p>
          </div>

          {error.message && (
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left">
              <p className="text-xs font-mono text-slate-300 break-words line-clamp-3">{error.message}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs inline-flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Core Engine</span>
          </button>
        </div>
      </body>
    </html>
  );
}
