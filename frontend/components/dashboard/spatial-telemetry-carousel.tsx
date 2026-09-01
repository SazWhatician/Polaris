"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Layers,
  Cpu,
  Radio,
  Network,
} from "lucide-react";
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
        "liquid-glass p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group select-none transition-all duration-300 min-h-[340px]",
        className
      )}
    >
      {/* Background Graphic Slide Image with Glass Refraction Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {slide.imageSrc && (
          <Image
            src={slide.imageSrc}
            alt={slide.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover opacity-25 dark:opacity-20 scale-105 group-hover:scale-110 transition-transform duration-700 blur-[1px]"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
      </div>

      {/* Top Telemetry Header Strip */}
      <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-foreground">
          <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>{slide.category}</span>
        </span>

        <span className="text-emerald-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {slide.badge}
        </span>
      </div>

      {/* Center Interactive Hologram Visualization */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center text-center">
        {slide.type === "neural" && (
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/40 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-2.5 rounded-full border border-dashed border-indigo-400/40 animate-[spin_8s_linear_infinite_reverse]" />
            <div className="absolute inset-5 rounded-full border border-purple-400/30 animate-[spin_16s_linear_infinite]" />
            <div className="p-3.5 rounded-3xl bg-white/10 dark:bg-white/5 border border-white/30 backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-[8px] font-mono font-bold text-foreground tracking-widest">POLARIS</span>
            </div>
          </div>
        )}

        {slide.type === "mesh" && (
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-pulse" />
            <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/30 backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
              <Network className="w-7 h-7 text-purple-400 animate-bounce" />
              <span className="text-[8px] font-mono font-bold text-purple-300 tracking-wider">GRAPH DAG</span>
            </div>
          </div>
        )}

        {slide.type === "ocr" && (
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-1 rounded-2xl border border-indigo-500/40 rotate-6" />
            <div className="absolute inset-1 rounded-2xl border border-dashed border-primary/40 -rotate-6" />
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
              <Layers className="w-7 h-7 text-indigo-400" />
              <span className="text-[8px] font-mono font-bold text-indigo-300 tracking-wider">OCR CHUNKS</span>
            </div>
          </div>
        )}

        {slide.type === "twin" && (
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-[spin_10s_linear_infinite]" />
            <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
              <Cpu className="w-7 h-7 text-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono font-bold text-emerald-300 tracking-wider">TWIN STATE</span>
            </div>
          </div>
        )}

        {/* Slide Title & Subtitle */}
        <div className="mt-2 space-y-0.5">
          <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">
            {slide.title}
          </h4>
          <p className="text-[11px] font-mono text-muted-foreground">
            {slide.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Metrics Bar & Controls */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-3">
          {slide.metrics.map((m, i) => (
            <span key={i} className="text-muted-foreground">
              {m.label}:{" "}
              <strong className="text-foreground font-bold">
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
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-all active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
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
                    ? "w-4 bg-primary shadow-xs"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                )}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            aria-label="Next Telemetry Slide"
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-foreground transition-all active:scale-95"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
