"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export interface CrystalGlowProps {
  text?: string;
  children?: React.ReactNode;
  fontFamily?: string;
  fontWeight?: number | string;
  fontSize?: number | string;
  textColor?: string;
  shadowColor?: string;
  glareColor?: string;
  glareSpeed?: number;
  glareDirection?: "left-to-right" | "right-to-left";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  as?: "span" | "div" | "a" | "button" | "h1" | "h2" | "h3" | "h4";
  compact?: boolean;
}

function Sparkle() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" />
    </svg>
  );
}

export function CrystalGlow({
  text,
  children,
  fontFamily = "inherit",
  fontWeight = 800,
  fontSize = 24,
  textColor,
  shadowColor,
  glareColor,
  glareSpeed = 1,
  glareDirection = "left-to-right",
  className = "",
  style,
  onClick,
  as: Component = "span",
  compact = false,
}: CrystalGlowProps) {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? (resolvedTheme || theme || "dark") : "dark";

  // Auto-derived theme palette defaults
  const defaults = React.useMemo(() => {
    if (activeTheme === "light") {
      return {
        text: "#1A1A1A",
        shadow: "#C97381",
        glare: "rgba(201, 115, 129, 0.85)",
      };
    }
    if (activeTheme === "theme-amber") {
      return {
        text: "#FFFBEB",
        shadow: "#F59E0B",
        glare: "rgba(254, 243, 199, 0.90)",
      };
    }
    // Default Cosmic Obsidian dark
    return {
      text: "#FFFFFF",
      shadow: "#7C3AED",
      glare: "rgba(255, 255, 255, 0.85)",
    };
  }, [activeTheme]);

  const resolvedText = textColor || defaults.text;
  const resolvedShadow = shadowColor || defaults.shadow;
  const resolvedGlare = glareColor || defaults.glare;

  const content = text || children;
  const fontSizeCss = typeof fontSize === "number" ? `${fontSize}px` : fontSize;

  return (
    <Component
      onClick={onClick}
      suppressHydrationWarning
      className={`crystal-glow-wrapper ${compact ? "crystal-glow-compact" : ""} ${className}`}
      style={
        {
          fontFamily,
          fontWeight,
          "--color": resolvedText,
          "--shadow": resolvedShadow,
          "--glare": resolvedGlare,
          "--font-size": fontSizeCss,
          "--glare-duration": `${1 / glareSpeed}s`,
          "--glare-dir": glareDirection === "right-to-left" ? "-1" : "1",
          ...style,
        } as React.CSSProperties
      }
    >
      <Sparkle />
      <Sparkle />
      <Sparkle />
      <Sparkle />
      <Sparkle />

      <span className="crystal-text-base">{content}</span>
      <span className="crystal-text-glare" aria-hidden="true">
        {content}
      </span>
    </Component>
  );
}

export const SparkleButton = CrystalGlow;
export default CrystalGlow;
