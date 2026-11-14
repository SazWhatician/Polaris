"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface LandingLoaderProps {
  onComplete?: () => void;
  minDisplayTime?: number;
}

export function LandingLoader({ onComplete, minDisplayTime = 800 }: LandingLoaderProps) {
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
      className="pointer-events-none fixed inset-0 z-[100] select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* TOP HALF CURTAIN */}
      <div
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
        className={`fixed inset-x-0 top-0 z-[101] h-1/2 border-b border-white/[0.08] bg-black transition-transform duration-700 will-change-transform ${
          isSplitting ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Subtle grid line in curtain */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      </div>

      {/* BOTTOM HALF CURTAIN */}
      <div
        style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
        className={`fixed inset-x-0 bottom-0 z-[101] h-1/2 border-t border-white/[0.08] bg-black transition-transform duration-700 will-change-transform ${
          isSplitting ? "translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Subtle grid line in curtain */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      </div>

      {/* CENTER P STENCIL LOADER */}
      <div
        className={`duration-600 pointer-events-none fixed inset-0 z-[102] flex flex-col items-center justify-center transition-all ease-out ${
          isSplitting ? "blur-xs scale-125 opacity-0 filter" : "scale-100 opacity-100"
        }`}
      >
        <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-40 [animation-duration:2.2s]" />

          {/* Stencil Image */}
          <div className="relative h-12 w-12 animate-pulse [animation-duration:1.6s] sm:h-16 sm:w-16">
            <Image
              src="/polaris-standalone.png"
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
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
            POLARIS · INITIALIZING
          </span>
        </div>
      </div>
    </div>
  );
}
