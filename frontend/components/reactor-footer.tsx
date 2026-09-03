"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Move3d, Loader2 } from "lucide-react";
import {
  MODEL_COLORWAYS,
  ModelColorway,
  ColorwayConfig,
} from "./reactor-canvas";

export { MODEL_COLORWAYS };
export type { ModelColorway, ColorwayConfig };

// Dynamic import with SSR disabled for Next.js 15 App Router WebGL canvas
const ReactorCanvas = dynamic(
  () => import("./reactor-canvas").then((mod) => mod.ReactorCanvas),
  {
    ssr: false,
    loading: () => null,
  }
);

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
      { rootMargin: "350px" }
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
    <div className="relative z-20 w-full min-h-screen bg-black overflow-hidden select-none flex flex-col justify-between">
      <footer
        ref={footerRef}
        className="reactor-zone relative z-20 w-full min-h-screen overflow-hidden bg-black flex flex-col justify-between"
      >
        {/* 3D React Three Fiber Canvas Layer — Lazy mounted on scroll */}
        <div
          id="footer-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none"
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
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none transition-opacity duration-500">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 shadow-2xl">
              <Loader2 className="w-5 h-5 text-[#2BA648] animate-spin" />
              <span className="text-xs font-mono text-white/80 tracking-wider">
                Loading 3D Chamber...
              </span>
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div
          ref={contentContainerRef}
          className="relative w-full min-h-screen flex flex-col justify-between p-8 sm:p-14 lg:p-20 pointer-events-none z-10"
        >
          {/* Top Section: ENIGMA Connect With Us + Socials + Menu */}
          <div className="w-full pt-10 sm:pt-14 flex flex-col md:flex-row items-start justify-between gap-10 pointer-events-none">
            {/* Left: Giant Heading */}
            <div className="pointer-events-auto">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tighter uppercase leading-none">
                connect<br />WITH<br />US
              </h1>
            </div>

            {/* Right: Socials & Menu */}
            <div className="flex gap-12 sm:gap-24 pointer-events-auto">
              {/* Socials Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="text-base sm:text-xl font-normal text-slate-400 uppercase tracking-wider mb-2">
                  SOCIALS
                </h3>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  INSTAGRAM
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  X
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  LINKEDIN
                </a>
              </div>

              {/* Menu Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="text-base sm:text-xl font-normal text-slate-400 uppercase tracking-wider mb-2">
                  MENU
                </h3>
                <Link
                  href="/"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  HOME
                </Link>
                <Link
                  href="/dashboard"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  WORKSPACE
                </Link>
                <Link
                  href="/login"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  CONTACT
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="w-full pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50 border-t border-white/10 pointer-events-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-2">
                <Move3d className="w-3.5 h-3.5 text-[#2BA648]" />
                <span className="text-[10px] tracking-widest uppercase">3D CHAMBER CORE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Interactive Colorway Pills */}
              <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-full border border-white/5">
                {(Object.keys(MODEL_COLORWAYS) as ModelColorway[]).map((cw) => {
                  const cfg = MODEL_COLORWAYS[cw];
                  const isSelected = selectedColorway === cw;
                  return (
                    <button
                      key={cw}
                      onClick={() => setSelectedColorway(cw)}
                      className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                        isSelected
                          ? "bg-white/15 text-white font-semibold shadow-sm"
                          : "text-white/40 hover:text-white/80"
                      }`}
                      title={cfg.label}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: cfg.dotColor }}
                      />
                      <span className="hidden md:inline">{cfg.label.split(" ")[1] || cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase">
              <div className="relative h-6 w-28 sm:w-36 opacity-80 hover:opacity-100 transition-opacity">
                <Image
                  src="/polaris-monochrome.png"
                  alt="Polaris Logo"
                  fill
                  sizes="(max-width: 640px) 112px, 144px"
                  className="object-contain invert"
                />
              </div>
              <span className="hidden sm:inline border-l border-white/20 pl-3">
                AUTONOMOUS RESEARCH <span className="text-[#2BA648] font-bold">POLARIS.</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ReactorFooter;
