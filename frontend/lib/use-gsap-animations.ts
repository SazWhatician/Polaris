"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function useGsapEntrance(selector = ".gsap-reveal", delay = 0.1) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements || elements.length === 0) return;

    gsap.fromTo(
      elements,
      {
        y: 40,
        opacity: 0,
        scale: 0.96,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.08,
        delay,
        ease: "power3.out",
      }
    );
  }, [selector, delay]);

  return containerRef;
}

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
