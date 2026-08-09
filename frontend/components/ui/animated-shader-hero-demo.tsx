"use client";

import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";

export default function HeroDemo() {
  const handlePrimaryClick = () => {
    window.location.href = "/dashboard";
  };

  const handleSecondaryClick = () => {
    window.location.href = "/chat";
  };

  return (
    <div className="w-full">
      <AnimatedShaderHero
        trustBadge={{
          text: "Polaris Multimodal RAG Engine",
          icons: ["✨", "🚀", "🪐"],
        }}
        headline={{
          line1: "Accelerate Knowledge",
          line2: "Into Deep Space Orbit",
        }}
        subtitle="Supercharge your academic workflow with grounded vector search, instant PDF citations, and interactive knowledge graphs built for ambitious learners."
        buttons={{
          primary: {
            text: "Get Started for Free",
            onClick: handlePrimaryClick,
          },
          secondary: {
            text: "Explore RAG Chat",
            onClick: handleSecondaryClick,
          },
        }}
      />
    </div>
  );
}
