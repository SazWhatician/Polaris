"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Brain, Layers, Cpu, Radio, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideData {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  badge: string;
  imageSrc?: string;
  type: "neural" | "mesh" | "ocr" | "twin";
  metrics: {
    label: string;
    value: string;
  }[];
}

const CAROUSEL_SLIDES: SlideData[] = [
  {
    id: "slide-neural-core",
    category: "SPATIAL TELEMETRY",
    title: "Quantum Vector Core",
    subtitle: "Real-time 60 FPS Gyroscopic Mesh",
    badge: "Live 60 FPS",
    imageSrc: "/telemetry-neural-core.jpg",
    type: "neural",
    metrics: [
      { label: "Latency", value: "18ms" },
      { label: "Memory", value: "0.2 MB" },
    ],
  },
  {
    id: "slide-knowledge-mesh",
    category: "CONCEPT TOPOLOGY",
    title: "Constellation Graph",
    subtitle: "3D Louvain Modularity Clusters",
    badge: "12,456 Nodes",
    imageSrc: "/telemetry-knowledge-mesh.jpg",
    type: "mesh",
    metrics: [
      { label: "Edges", value: "48.9K" },
      { label: "Modularity", value: "0.89" },
    ],
  },
  {
    id: "slide-ocr-stream",
    category: "MULTIMODAL OPTICS",
    title: "Deep OCR Pipeline",
    subtitle: "Sub-Second Dense Embeddings",
    badge: "Qdrant Ready",
    imageSrc: "/cascade.png",
    type: "ocr",
    metrics: [
      { label: "Accuracy", value: "99.4%" },
      { label: "Engine", value: "bge-large" },
    ],
  },
  {
    id: "slide-digital-twin",
    category: "ACADEMIC DIGITAL TWIN",
    title: "Mastery Radar",
    subtitle: "Prerequisite Knowledge State",
    badge: "LangGraph v0.2",
    imageSrc: "/ActualHand.png",
    type: "twin",
    metrics: [
      { label: "Readiness", value: "91.4%" },
      { label: "Velocity", value: "+12%" },
    ],
  },
];

export function SpatialTelemetryCarousel({
  totalMb = "0.2",
  className,
}: {
  totalMb?: string;
  className?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = CAROUSEL_SLIDES.length;

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    if (isPaused) return;
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, currentIdx]);

  const slide: SlideData = (CAROUSEL_SLIDES[currentIdx] ?? CAROUSEL_SLIDES[0])!;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "liquid-glass group relative flex min-h-[340px] select-none flex-col justify-between overflow-hidden p-5 transition-all duration-300 sm:p-6",
        className,
      )}
    >
      {/* Background Graphic Slide Image with Glass Refraction Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {slide.imageSrc && (
          <Image
            src={slide.imageSrc}
            alt={slide.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="scale-105 object-cover opacity-25 blur-[1px] transition-transform duration-700 group-hover:scale-110 dark:opacity-20"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
      </div>

      {/* Top Telemetry Header Strip */}
      <div className="relative z-10 flex w-full items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-foreground">
          <Radio className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>{slide.category}</span>
        </span>

        <span className="flex items-center gap-1 text-emerald-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {slide.badge}
        </span>
      </div>

      {/* Center Interactive Hologram Visualization */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 text-center">
        {slide.type === "neural" && (
          <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full border border-primary/40" />
            <div className="absolute inset-2.5 animate-[spin_8s_linear_infinite_reverse] rounded-full border border-dashed border-indigo-400/40" />
            <div className="absolute inset-5 animate-[spin_16s_linear_infinite] rounded-full border border-purple-400/30" />
            <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-white/30 bg-white/10 p-3.5 shadow-xl backdrop-blur-2xl transition-transform group-hover:scale-110 dark:bg-white/5">
              <Brain className="h-6 w-6 animate-pulse text-primary" />
              <span className="font-mono text-[8px] font-bold tracking-widest text-foreground">
                POLARIS
              </span>
            </div>
          </div>
        )}

        {slide.type === "mesh" && (
          <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
            <div className="absolute inset-0 animate-pulse rounded-full border border-purple-500/30" />
            <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-purple-500/30 bg-purple-500/10 p-4 shadow-xl backdrop-blur-2xl transition-transform group-hover:scale-110">
              <Network className="h-7 w-7 animate-bounce text-purple-400" />
              <span className="font-mono text-[8px] font-bold tracking-wider text-purple-300">
                GRAPH DAG
              </span>
            </div>
          </div>
        )}

        {slide.type === "ocr" && (
          <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
            <div className="absolute inset-1 rotate-6 rounded-2xl border border-indigo-500/40" />
            <div className="absolute inset-1 -rotate-6 rounded-2xl border border-dashed border-primary/40" />
            <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-4 shadow-xl backdrop-blur-2xl transition-transform group-hover:scale-110">
              <Layers className="h-7 w-7 text-indigo-400" />
              <span className="font-mono text-[8px] font-bold tracking-wider text-indigo-300">
                OCR CHUNKS
              </span>
            </div>
          </div>
        )}

        {slide.type === "twin" && (
          <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-emerald-500/30" />
            <div className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xl backdrop-blur-2xl transition-transform group-hover:scale-110">
              <Cpu className="h-7 w-7 animate-pulse text-emerald-400" />
              <span className="font-mono text-[8px] font-bold tracking-wider text-emerald-300">
                TWIN STATE
              </span>
            </div>
          </div>
        )}

        {/* Slide Title & Subtitle */}
        <div className="mt-2 space-y-0.5">
          <h4 className="text-sm font-black tracking-tight text-foreground sm:text-base">
            {slide.title}
          </h4>
          <p className="font-mono text-[11px] text-muted-foreground">{slide.subtitle}</p>
        </div>
      </div>

      {/* Bottom Metrics Bar & Controls */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          {slide.metrics.map((m, i) => (
            <span key={i} className="text-muted-foreground">
              {m.label}:{" "}
              <strong className="font-bold text-foreground">
                {m.label === "Memory" ? `${totalMb} MB` : m.value}
              </strong>
            </span>
          ))}
        </div>

        {/* Slide navigation controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevSlide}
            aria-label="Previous Telemetry Slide"
            className="rounded-lg bg-white/10 p-1 text-foreground transition-all hover:bg-white/20 active:scale-95"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1 px-1">
            {CAROUSEL_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentIdx === idx
                    ? "shadow-xs w-4 bg-primary"
                    : "w-1.5 bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            aria-label="Next Telemetry Slide"
            className="rounded-lg bg-white/10 p-1 text-foreground transition-all hover:bg-white/20 active:scale-95"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
