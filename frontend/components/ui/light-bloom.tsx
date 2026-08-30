"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

const MAX_DPR = 2; // hard-coded: a quality tier is not a design control

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform int   uStyle;        // 0 = bloom, 1 = shafts
uniform int   uDirection;    // 0 = bottom, 1 = top, 2 = left, 3 = right
uniform vec3  uBg;
uniform vec3  uBase;
uniform vec3  uAccent;
uniform float uRise;         // 0..1 how far up the frame the light climbs
uniform float uSpread;       // 0..1 lateral width
uniform float uOriginX;      // 0..1 screen x of the light source
uniform float uLift;         // 0..2 hover intensity lift
uniform float uShaftCount;
uniform float uShaftAmount;  // 0..1
uniform float uShaftDrift;
uniform float uGrain;        // 0..1
uniform float uVignette;     // 0..1

float h11(float x) { return fract(sin(x * 127.1) * 43758.5453123); }

float vn1(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(h11(i), h11(i + 1.0), f);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;         // y up from the bottom edge
    float aspect = uRes.x / uRes.y;
    float t = uTime;

    // Slow breathe so Speed maps to something visible in BOTH styles, not only
    // the one with drifting shafts.
    float breathe = 1.0 + 0.06 * sin(t * 0.35);

    // Light origin sits just beyond the chosen edge; a deeper origin widens
    // the bloom. uDirection picks the edge, and which axis uOriginX tracks
    // the pointer along.
    float depth = mix(0.05, 1.20, uSpread);
    vec2 lp;
    float acrossUv;
    float edgeCoord;
    if (uDirection == 1) {
        lp = vec2(uOriginX, 1.0 + depth);
        acrossUv = uv.x;
        edgeCoord = 1.0 - uv.y;
    } else if (uDirection == 2) {
        lp = vec2(-depth / aspect, uOriginX);
        acrossUv = uv.y;
        edgeCoord = uv.x;
    } else if (uDirection == 3) {
        lp = vec2(1.0 + depth / aspect, uOriginX);
        acrossUv = uv.y;
        edgeCoord = 1.0 - uv.x;
    } else {
        lp = vec2(uOriginX, -depth);
        acrossUv = uv.x;
        edgeCoord = uv.y;
    }
    vec2 q = vec2((uv.x - lp.x) * aspect, uv.y - lp.y);
    float d = length(q);

    float k = mix(9.0, 1.4, uRise) / breathe;
    // Normalise against the value directly above the origin, so the bottom edge
    // reads as 1.0 whatever Spread does. Without this, widening the bloom also
    // dims it and the two dials stop being separable.
    float g = exp(-d * k) / max(exp(-depth * k), 1e-4);
    g = clamp(g, 0.0, 1.0);

    if (uStyle == 1) {
        float sx = acrossUv * uShaftCount;
        float dr = t * uShaftDrift;
        float s = vn1(sx + dr) * 0.6 + vn1(sx * 2.17 - dr * 0.8) * 0.4;
        // Shafts fade out right at the origin edge, where the bloom is blown
        // to white and a column would only read as a dirty edge.
        float mask = smoothstep(0.0, 0.35, edgeCoord);
        g *= mix(1.0, 0.45 + 1.25 * s, uShaftAmount * mask);
    }

    g = clamp(g * (1.0 + uLift * 0.25), 0.0, 1.0);

    vec3 col = mix(uBg, uBase, smoothstep(0.0, 0.68, g));
    // The accent band starts well before the base ramp finishes. Held at 0.70+
    // it only ever painted a thin arc at the very bottom, so Accent Color moved
    // ~2% of the frame and read as a dial that did nothing.
    col = mix(col, uAccent, smoothstep(0.58, 0.99, g));

    vec2 vc = uv - 0.5;
    vc.x *= aspect;
    col *= 1.0 - uVignette * smoothstep(0.35, 0.95, length(vc));

    float rnd = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (rnd - 0.5) * (uGrain * 0.06 + 1.5 / 255.0);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// Emits "#rgb", "#rrggbb", "#rrggbbaa" or "rgb()/rgba()".
function parseColor(input: string | undefined, fb: [number, number, number]): [number, number, number] {
  if (!input) return fb;
  const str = String(input).trim();
  if (str.charAt(0) === "#") {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const h0 = hex[0] || "0";
      const h1 = hex[1] || "0";
      const h2 = hex[2] || "0";
      hex = h0 + h0 + h1 + h1 + h2 + h2;
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255];
    }
    return fb;
  }
  const m = str.match(/[\d.]+/g);
  if (m && m.length >= 3) {
    const r = parseFloat(m[0] ?? "0");
    const g = parseFloat(m[1] ?? "0");
    const b = parseFloat(m[2] ?? "0");
    return [
      Math.min(255, isNaN(r) ? 0 : r) / 255,
      Math.min(255, isNaN(g) ? 0 : g) / 255,
      Math.min(255, isNaN(b) ? 0 : b) / 255,
    ];
  }
  return fb;
}

function num(v: unknown, fb: number): number {
  return typeof v === "number" && isFinite(v) ? v : fb;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("LightBloom shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export type LightGroup = { rise?: number; spread?: number };
export type ShaftGroup = { count?: number; amount?: number; drift?: number };
export type FinishGroup = { grain?: number; vignette?: number };

export type LightBloomProps = {
  style?: React.CSSProperties;
  className?: string;
  variant?: "bloom" | "shafts";
  direction?: "bottom" | "top" | "left" | "right";
  background?: string;
  baseColor?: string;
  accentColor?: string;
  speed?: number;
  hover?: number;
  light?: LightGroup;
  shafts?: ShaftGroup;
  finish?: FinishGroup;
  width?: number;
  height?: number;
  fixedFullscreen?: boolean;
  zIndex?: number;
};

// Typed so an omitted group field cannot silently pin a control
const D_LIGHT: Required<LightGroup> = { rise: 79, spread: 72 };
const D_SHAFTS: Required<ShaftGroup> = { count: 17, amount: 70, drift: 79 };
const D_FINISH: Required<FinishGroup> = { grain: 12, vignette: 25 };

export function LightBloom(props: LightBloomProps) {
  const {
    style,
    className = "",
    variant = "shafts",
    direction = "bottom",
    background = "#020616",
    baseColor = "#6B2BF5",
    accentColor = "#EFE6FF",
    speed = 100,
    hover = 114,
    light,
    shafts,
    finish,
    width,
    height,
    fixedFullscreen = false,
    zIndex = 0,
  } = props;

  const L = { ...D_LIGHT, ...(light ?? {}) };
  const S = { ...D_SHAFTS, ...(shafts ?? {}) };
  const F = { ...D_FINISH, ...(finish ?? {}) };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mirrored size for loop
  const sizeRef = useRef({ w: 0, h: 0 });
  sizeRef.current = { w: num(width, 0), h: num(height, 0) };

  // Live input ref so prop changes do not rebuild the context
  const vRef = useRef({
    style: 0,
    direction: 0,
    bg: [0, 0, 0] as [number, number, number],
    base: [0, 0, 0] as [number, number, number],
    accent: [0, 0, 0] as [number, number, number],
    rise: 0.55,
    spread: 0.6,
    speed: 1,
    hover: 1,
    count: 9,
    amount: 0.55,
    drift: 0.4,
    grain: 0.12,
    vignette: 0.25,
  });

  vRef.current = {
    style: variant === "shafts" ? 1 : 0,
    direction: direction === "top" ? 1 : direction === "left" ? 2 : direction === "right" ? 3 : 0,
    bg: parseColor(background, [0.01, 0.02, 0.08]),
    base: parseColor(baseColor, [0.42, 0.17, 0.96]),
    accent: parseColor(accentColor, [0.94, 0.9, 1]),
    rise: num(L.rise, 79) / 100,
    spread: num(L.spread, 72) / 100,
    speed: num(speed, 50) / 50,
    hover: num(hover, 100) / 100,
    count: Math.max(1, num(S.count, 17)),
    amount: num(S.amount, 70) / 100,
    drift: num(S.drift, 79) / 100,
    grain: num(F.grain, 12) / 100,
    vignette: num(F.vignette, 25) / 100,
  };

  const ptrRef = useRef({ x: 0.5, target: 0.5, on: 0, onTarget: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      console.error("LightBloom: WebGL unavailable");
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("LightBloom link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      time: gl.getUniformLocation(prog, "uTime"),
      style: gl.getUniformLocation(prog, "uStyle"),
      direction: gl.getUniformLocation(prog, "uDirection"),
      bg: gl.getUniformLocation(prog, "uBg"),
      base: gl.getUniformLocation(prog, "uBase"),
      accent: gl.getUniformLocation(prog, "uAccent"),
      rise: gl.getUniformLocation(prog, "uRise"),
      spread: gl.getUniformLocation(prog, "uSpread"),
      originX: gl.getUniformLocation(prog, "uOriginX"),
      lift: gl.getUniformLocation(prog, "uLift"),
      count: gl.getUniformLocation(prog, "uShaftCount"),
      amount: gl.getUniformLocation(prog, "uShaftAmount"),
      drift: gl.getUniformLocation(prog, "uShaftDrift"),
      grain: gl.getUniformLocation(prog, "uGrain"),
      vignette: gl.getUniformLocation(prog, "uVignette"),
    };

    let raf = 0;
    let last = performance.now();
    let clock = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = vRef.current;
      clock = (clock + dt * v.speed) % 3600;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cw = sizeRef.current.w || canvas.clientWidth || window.innerWidth || 1200;
      const ch = sizeRef.current.h || canvas.clientHeight || window.innerHeight || 800;
      const bw = Math.max(1, Math.round(cw * dpr));
      const bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        gl.viewport(0, 0, bw, bh);
      }

      const p = ptrRef.current;
      const kx = 1 - Math.exp(-8 * dt);
      const ko = 1 - Math.exp(-5 * dt);
      p.x += (p.target - p.x) * kx;
      p.on += (p.onTarget - p.on) * ko;

      const travel = Math.min(1, v.hover);
      const originX = 0.5 + (p.x - 0.5) * travel * p.on;

      gl.uniform2f(u.res, bw, bh);
      gl.uniform1f(u.time, clock);
      gl.uniform1i(u.style, v.style);
      gl.uniform1i(u.direction, v.direction);
      gl.uniform3f(u.bg, v.bg[0], v.bg[1], v.bg[2]);
      gl.uniform3f(u.base, v.base[0], v.base[1], v.base[2]);
      gl.uniform3f(u.accent, v.accent[0], v.accent[1], v.accent[2]);
      gl.uniform1f(u.rise, v.rise);
      gl.uniform1f(u.spread, v.spread);
      gl.uniform1f(u.originX, originX);
      gl.uniform1f(u.lift, v.hover * p.on);
      gl.uniform1f(u.count, v.count);
      gl.uniform1f(u.amount, v.amount);
      gl.uniform1f(u.drift, v.drift);
      gl.uniform1f(u.grain, v.grain);
      gl.uniform1f(u.vignette, v.vignette);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };

    const onMove = (e: MouseEvent | PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (vRef.current.direction === 2 || vRef.current.direction === 3) {
        const h = canvas.offsetHeight || window.innerHeight || 1;
        const scale = r.height > 0 ? h / r.height : 1;
        ptrRef.current.target = Math.max(0, Math.min(1, 1 - ((e.clientY - r.top) * scale) / h));
      } else {
        const w = canvas.offsetWidth || window.innerWidth || 1;
        const scale = r.width > 0 ? w / r.width : 1;
        ptrRef.current.target = Math.max(0, Math.min(1, ((e.clientX - r.left) * scale) / w));
      }
      ptrRef.current.onTarget = 1;
    };

    const onEnter = () => {
      ptrRef.current.onTarget = 1;
    };
    const onLeave = () => {
      ptrRef.current.onTarget = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerenter", onEnter, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [fixedFullscreen]);

  if (fixedFullscreen) {
    return (
      <div
        ref={containerRef}
        className={`fixed inset-0 w-screen h-screen pointer-events-none select-none ${className}`}
        style={{
          zIndex,
          background,
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background,
        minWidth: width ? undefined : "100%",
        minHeight: height ? undefined : "100%",
        width: typeof width === "number" && width > 0 ? width : "100%",
        height: typeof height === "number" && height > 0 ? height : "100%",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

export default LightBloom;
