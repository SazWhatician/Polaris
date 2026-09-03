"use client";

import { Scene } from "@/components/Scene";

export default function ScenePage() {
  return (
    <main style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden", background: "#080808" }}>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #080808;
        }
        .shader-frame {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #080808;
        }
      `}</style>
      <Scene />
    </main>
  );
}
