"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Keep GSAP lag smoothing active to prevent teleport jumps during heavy 3D rendering
    gsap.ticker.lagSmoothing(500, 33);

    const handleRefresh = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", handleRefresh);
    window.addEventListener("resize", handleRefresh, { passive: true });

    // Initial stabilization refresh after components mount
    const timer = setTimeout(handleRefresh, 300);

    return () => {
      window.removeEventListener("load", handleRefresh);
      window.removeEventListener("resize", handleRefresh);
      clearTimeout(timer);
    };
  }, []);

  return <>{children}</>;
}

