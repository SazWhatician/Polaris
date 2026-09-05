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
      } else if (event.data?.type === "POLARIS_SCROLL_RELAY" && typeof event.data?.deltaY === "number") {
        window.scrollBy({ top: event.data.deltaY, left: 0, behavior: "instant" });
      } else if (event.data?.type === "POLARIS_SCROLL_TO_NEXT") {
        const nextEl = document.getElementById("cascade-section");
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  // Pause the 3D moss Three.js loop when scrolled out of view to free GPU resources
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

      {/* Crisp Cinematic Transition to Next Section (No premature dark fog) */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 sm:h-24 pointer-events-none z-20 bg-gradient-to-b from-transparent via-black/40 to-black"
        aria-hidden="true"
      />
    </div>
  );
}
