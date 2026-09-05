"use client";

// LiquidMetalButton ThreeUI integration v2
import { useRouter } from "next/navigation";
import { LiquidMetalButton } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  const router = useRouter();

  const handleSignup = () => {
    router.push("/login?mode=signup");
  };

  return (
    <div className="shader-frame">
      <LiquidMetalButton
        variant="play"
        rendering="colored"
        diameter={88}
        strokeWidth={3.0}
        text="Play"
        onClick={handleSignup}
      />
    </div>
  );
}
