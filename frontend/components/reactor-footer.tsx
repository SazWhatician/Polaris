"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Move3d, Loader2 } from "lucide-react";
import { MODEL_COLORWAYS, ModelColorway, ColorwayConfig } from "./reactor-canvas";

export { MODEL_COLORWAYS };
export type { ModelColorway, ColorwayConfig };

// Dynamic import with SSR disabled for Next.js 15 App Router WebGL canvas
const ReactorCanvas = dynamic(() => import("./reactor-canvas").then((mod) => mod.ReactorCanvas), {
  ssr: false,
  loading: () => null,
});

export interface ReactorFooterProps {
  /** Custom 3D model URL (e.g. "/models/bouche_a_levres.glb") */
  customModelUrl?: string;
  /** Scale factor for custom 3D model (default: 1.0) */
  modelScale?: number;
  /** Initial colorway preset (default: "emerald") */
  initialColorway?: ModelColorway;
}

export function ReactorFooter({
  customModelUrl = "/models/bouche_a_levres.glb",
  modelScale = 1.0,
  initialColorway = "emerald",
}: ReactorFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedColorway, setSelectedColorway] = useState<ModelColorway>(initialColorway);
  const [isInView, setIsInView] = useState(false);

  // Lazy-mount the 3D model and WebGL canvas only when scrolling near the footer
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "350px" },
    );
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const footerEl = footerRef.current;
    const contentEl = contentContainerRef.current;
    if (!footerEl || !contentEl) return;

    gsap.set(contentEl, { yPercent: 0, opacity: 1 });

    const trigger = ScrollTrigger.create({
      trigger: footerEl,
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const scrollProgress = self.progress;
        gsap.set(contentEl, {
          yPercent: -6 * (1 - scrollProgress),
          opacity: 0.6 + 0.4 * scrollProgress,
        });
      },
    });

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(refreshTimer);
      trigger.kill();
    };
  }, []);

  return (
    <div className="relative z-20 flex min-h-screen w-full select-none flex-col justify-between overflow-hidden bg-black">
      <footer
        ref={footerRef}
        className="reactor-zone relative z-20 flex min-h-screen w-full flex-col justify-between overflow-hidden bg-black"
      >
        {/* 3D React Three Fiber Canvas Layer — Lazy mounted on scroll */}
        <div
          id="footer-canvas"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {isInView ? (
            <ReactorCanvas
              customModelUrl={customModelUrl}
              modelScale={modelScale}
              colorway={selectedColorway}
              onLoaded={() => setIsLoading(false)}
            />
          ) : null}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm transition-opacity duration-500">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-[#2BA648]" />
              <span className="font-mono text-xs tracking-wider text-white/80">
                Loading 3D Chamber...
              </span>
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div
          ref={contentContainerRef}
          className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col justify-between p-8 sm:p-14 lg:p-20"
        >
          {/* Top Section: ENIGMA Connect With Us + Socials + Menu */}
          <div className="pointer-events-none flex w-full flex-col items-start justify-between gap-10 pt-10 sm:pt-14 md:flex-row">
            {/* Left: Giant Heading */}
            <div className="pointer-events-auto">
              <h1 className="text-5xl font-light uppercase leading-none tracking-tighter sm:text-7xl lg:text-8xl">
                connect
                <br />
                WITH
                <br />
                US
              </h1>
            </div>

            {/* Right: Socials & Menu */}
            <div className="pointer-events-auto flex gap-12 sm:gap-24">
              {/* Socials Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="mb-2 text-base font-normal uppercase tracking-wider text-slate-400 sm:text-xl">
                  SOCIALS
                </h3>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  INSTAGRAM
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  X
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  LINKEDIN
                </a>
              </div>

              {/* Menu Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="mb-2 text-base font-normal uppercase tracking-wider text-slate-400 sm:text-xl">
                  MENU
                </h3>
                <Link
                  href="/"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  HOME
                </Link>
                <Link
                  href="/dashboard"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  WORKSPACE
                </Link>
                <Link
                  href="/login"
                  className="text-xl font-light text-white transition-colors hover:text-[#2BA648] sm:text-3xl"
                >
                  CONTACT
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="pointer-events-auto flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs text-white/50 sm:flex-row">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                <Move3d className="h-3.5 w-3.5 text-[#2BA648]" />
                <span className="text-[10px] uppercase tracking-widest">3D CHAMBER CORE</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              </div>

              {/* Interactive Colorway Pills */}
              <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] p-1">
                {(Object.keys(MODEL_COLORWAYS) as ModelColorway[]).map((cw) => {
                  const cfg = MODEL_COLORWAYS[cw];
                  const isSelected = selectedColorway === cw;
                  return (
                    <button
                      key={cw}
                      onClick={() => setSelectedColorway(cw)}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider transition-all ${
                        isSelected
                          ? "bg-white/15 font-semibold text-white shadow-sm"
                          : "text-white/40 hover:text-white/80"
                      }`}
                      title={cfg.label}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cfg.dotColor }}
                      />
                      <span className="hidden md:inline">
                        {cfg.label.split(" ")[1] || cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
              <div className="relative h-6 w-28 opacity-80 transition-opacity hover:opacity-100 sm:w-36">
                <Image
                  src="/polaris-monochrome.png"
                  alt="Polaris Logo"
                  fill
                  sizes="(max-width: 640px) 112px, 144px"
                  className="object-contain invert"
                />
              </div>
              <span className="hidden border-l border-white/20 pl-3 sm:inline">
                AUTONOMOUS RESEARCH <span className="font-bold text-[#2BA648]">POLARIS.</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ReactorFooter;
