"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface LandingLoaderProps {
  onComplete?: () => void;
  minDisplayTime?: number;
}

export function LandingLoader({
  onComplete,
  minDisplayTime = 800,
}: LandingLoaderProps) {
  const [stage, setStage] = useState<"loading" | "splitting" | "done">("loading");

  useEffect(() => {
    // 1. Initial pulse stage
    const timer1 = setTimeout(() => {
      setStage("splitting");
    }, minDisplayTime);

    // 2. Curtains finished sliding
    const timer2 = setTimeout(() => {
      setStage("done");
      onComplete?.();
    }, minDisplayTime + 650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [minDisplayTime, onComplete]);

  if (stage === "done") return null;

  const isSplitting = stage === "splitting";

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* TOP HALF CURTAIN */}
      <div
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
        className={`fixed top-0 inset-x-0 h-1/2 bg-black z-[101] border-b border-white/[0.08] transition-transform duration-700 will-change-transform ${
          isSplitting ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Subtle grid line in curtain */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      </div>

      {/* BOTTOM HALF CURTAIN */}
      <div
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
        className={`fixed bottom-0 inset-x-0 h-1/2 bg-black z-[101] border-t border-white/[0.08] transition-transform duration-700 will-change-transform ${
          isSplitting ? "translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Subtle grid line in curtain */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      </div>

      {/* CENTER P STENCIL LOADER */}
      <div
        className={`fixed inset-0 z-[102] flex flex-col items-center justify-center pointer-events-none transition-all duration-600 ease-out ${
          isSplitting
            ? "opacity-0 scale-125 filter blur-xs"
            : "opacity-100 scale-100"
        }`}
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping [animation-duration:2.2s] opacity-40" />
          
          {/* Stencil Image */}
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 animate-pulse [animation-duration:1.6s]">
            <Image
              src="/polaris-p-stencil.png"
              alt="Polaris Emblem"
              fill
              priority
              sizes="(max-width: 640px) 48px, 64px"
              className="object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]"
            />
          </div>
        </div>

        {/* Small Tactical Status Tag */}
        <div className="mt-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50">
            POLARIS · INITIALIZING
          </span>
        </div>
      </div>
    </div>
  );
}
