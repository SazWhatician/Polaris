"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "POLARIS_NAVIGATE" && typeof event.data?.url === "string") {
        router.push(event.data.url);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  // Pause the 130k-blade moss Three.js loop when scrolled out of view to free GPU resources
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting ?? true;
        const iframe = container.querySelector("iframe");
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: "POLARIS_PAUSE_HERO", paused: !isVisible },
            "*"
          );
        }
      },
      { rootMargin: "250px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="shader-frame relative">
      <SylvaHero
        variant="living-green"
        headingFont="lexend"
        bodyFont="lexend"
        headingWeight="300"
        bodyWeight="300"
        primaryColor="#ffffff"
        headingSize={63}
        bodySize={16.5}
        headingLetterSpacing={-0.006}
      />

      {/* Cinematic Transition Dissolve to Next Section (CascadeHandScrollSection) */}
      <div
        className="absolute inset-x-0 bottom-0 h-44 sm:h-64 md:h-80 pointer-events-none z-20 bg-gradient-to-b from-transparent via-black/60 to-black"
        aria-hidden="true"
      />
    </div>
  );
}
