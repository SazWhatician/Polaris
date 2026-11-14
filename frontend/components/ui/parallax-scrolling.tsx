"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function ParallaxComponent() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector("[data-parallax-layers]");

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 },
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none",
          },
          idx === 0 ? undefined : "<",
        );
      });
    }

    const lenis = new Lenis();
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", handleScroll);

    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax relative overflow-hidden bg-black text-white" ref={parallaxRef}>
      <section className="parallax__header relative flex h-[120vh] items-center justify-center">
        <div className="parallax__visuals relative flex h-full w-full items-center justify-center overflow-hidden">
          <div className="parallax__black-line-overflow absolute inset-x-0 top-0 z-30 h-px bg-white/10" />

          <div
            data-parallax-layers
            className="parallax__layers relative flex h-full w-full items-center justify-center"
          >
            {/* Layer 1: Background Cloud / Vista */}
            <img
              src="/clouddd.png"
              loading="eager"
              width="1400"
              data-parallax-layer="1"
              alt="Dreamy Cloud Layer 1"
              className="parallax__layer-img pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-[1px] filter"
            />

            {/* Layer 2: Secondary Cloud Depth */}
            <img
              src="/clouddd.png"
              loading="eager"
              width="1400"
              data-parallax-layer="2"
              alt="Dreamy Cloud Layer 2"
              className="parallax__layer-img pointer-events-none absolute inset-0 h-full w-full rotate-180 scale-125 object-cover opacity-80"
            />

            {/* Layer 3: Central Typography Title */}
            <div
              data-parallax-layer="3"
              className="parallax__layer-title relative z-20 max-w-3xl px-6 text-center"
            >
              <h2 className="parallax__title text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] sm:text-7xl md:text-8xl">
                Parallax
              </h2>
            </div>

            {/* Layer 4: Foreground Cloud Drift */}
            <img
              src="/clouddd.png"
              loading="eager"
              width="1400"
              data-parallax-layer="4"
              alt="Dreamy Cloud Layer 4"
              className="parallax__layer-img scale-130 pointer-events-none absolute inset-x-0 -bottom-20 h-auto w-full object-cover opacity-90"
            />
          </div>

          <div className="parallax__fade pointer-events-none absolute inset-x-0 bottom-0 z-30 h-40 bg-gradient-to-t from-black to-transparent" />
        </div>
      </section>

      <section className="parallax__content relative z-30 flex items-center justify-center px-6 py-24">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 160 160"
          fill="none"
          className="osmo-icon-svg animate-pulse text-primary"
        >
          <path
            d="M94.8284 53.8578C92.3086 56.3776 88 54.593 88 51.0294V0H72V59.9999C72 66.6273 66.6274 71.9999 60 71.9999H0V87.9999H51.0294C54.5931 87.9999 56.3777 92.3085 53.8579 94.8283L18.3431 130.343L29.6569 141.657L65.1717 106.142C67.684 103.63 71.9745 105.396 72 108.939V160L88.0001 160L88 99.9999C88 93.3725 93.3726 87.9999 100 87.9999H160V71.9999H108.939C105.407 71.9745 103.64 67.7091 106.12 65.1938L106.142 65.1716L141.657 29.6568L130.343 18.3432L94.8284 53.8578Z"
            fill="currentColor"
          />
        </svg>
      </section>
    </div>
  );
}

export default ParallaxComponent;
