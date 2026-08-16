"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * GSAP Staggered Entrance Hook
 * Smoothly animates matching elements with cubic bezier easing and custom delays.
 */
export function useGsapEntrance(selector = ".gsap-reveal", delay = 0.05) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements || elements.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        {
          y: 28,
          opacity: 0,
          scale: 0.98,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.05,
          delay,
          ease: "power3.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector, delay]);

  return containerRef;
}

/**
 * GSAP Pulse / Scale interaction hook
 */
export function useGsapPulse(trigger = true) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !trigger) return;

    gsap.fromTo(
      ref.current,
      { scale: 0.97 },
      { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }
    );
  }, [trigger]);

  return ref;
}

/**
 * Animated Number Counter Hook
 * Smoothly animates a numeric value from 0 to targetValue using high-performance requestAnimationFrame.
 */
export function useAnimeCounter(targetValue: number, duration = 1000, formatFn?: (val: number) => string) {
  const [displayValue, setDisplayValue] = useState<string>(formatFn ? formatFn(0) : "0");
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = targetValue;
    const startTime = performance.now();

    let frameId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);

      setDisplayValue(formatFn ? formatFn(current) : current.toString());

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        prevValueRef.current = end;
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [targetValue, duration, formatFn]);

  return displayValue;
}

/**
 * Animated Progress Bar Fill Hook
 */
export function useAnimeProgress(percentage: number, duration = 800) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;

    const targetWidth = `${Math.min(Math.max(percentage, 0), 100)}%`;
    gsap.to(progressRef.current, {
      width: targetWidth,
      duration: duration / 1000,
      ease: "power2.out",
    });
  }, [percentage, duration]);

  return progressRef;
}
