"use client";

/**
 * PolarisAurora — themable cinematic background.
 *
 * A single fragment shader composes:
 *   1. base colour + slow-breathing depth tint
 *   2. atmospheric colour wash (2 layers, additive OR tint depending on
 *      `atmosphereMix` — dark themes glow, light themes softly tint)
 *   3. five aurora bands (additive, scaled by `auroraStrength` — light theme
 *      disables via 0)
 *   4. two-density starfield (scaled by `starIntensity` — off on light)
 *   5. cursor aura
 *   6. bloom on bright regions (off on light)
 *   7. radial vignette with per-theme floor
 *   8. film grain
 */

import { useEffect, useRef } from "react";
import { POLARIS_THEMES, type AuroraPalette } from "@/lib/polaris-themes";

/* ─────────────────────────────  GLSL  ───────────────────────────── */

const VS = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FS = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;

uniform vec3  uBase;
uniform vec3  uBgDepth;

uniform vec3  uAtmosphere1;
uniform vec3  uAtmosphere2;
uniform float uAtmosphereStrength;
uniform float uAtmosphereMix;      // 0 = add, 1 = mix (tint)

uniform vec3  uBand1;
uniform vec3  uBand2;
uniform vec3  uBand3;
uniform vec3  uBand4;
uniform vec3  uBand5;
uniform float uBand5Alpha;
uniform float uAuroraStrength;

uniform vec3  uCursorTint;
uniform float uCursorStrength;

uniform vec3  uStarWarm;
uniform vec3  uStarCool;
uniform float uStarIntensity;

uniform float uBloomStrength;
uniform float uVignetteMin;
uniform float uGrainAmount;

in  vec2 vUv;
out vec4 outColor;

/* ─── hash / noise ─── */
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i),                  hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
             u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p  = rot * p * 2.03 + vec2(1.7, 4.3);
    a *= 0.5;
  }
  return v;
}

/* apply a colour layer either additively (uAtmosphereMix=0) or as a tint (=1) */
vec3 applyLayer(vec3 base, vec3 layerColor, float weight, float mixMode) {
  vec3 addResult = base + layerColor * weight;
  vec3 mixResult = mix(base, layerColor, clamp(weight, 0.0, 1.0));
  return mix(addResult, mixResult, mixMode);
}

/* aurora band intensity (0..1) */
float auroraIntensity(vec2 uv, float yCenter, float phase, float speed, float thickness, float amp) {
  float wA = sin(uv.x * 2.3  + phase       + uTime * speed)       * amp * 0.60;
  float wB = sin(uv.x * 5.7  - phase * 1.4 + uTime * speed * 1.3) * amp * 0.30;
  float wC = sin(uv.x * 11.0 + phase * 0.5 + uTime * speed * 0.6) * amp * 0.12;
  float wN = (vnoise(vec2(uv.x * 1.5, uTime * speed * 0.4)) - 0.5) * amp * 0.50;

  float y = yCenter + wA + wB + wC + wN;
  float d = uv.y - y;

  float intensity = exp(-d * d / (thickness * thickness));
  float topGlow   = smoothstep(0.0, thickness * 2.0, d);
  intensity = mix(intensity, intensity * 1.35, topGlow * 0.35);

  float shimmer = 0.72 + 0.28 * sin(uv.x * 24.0 + uTime * 1.8 + phase);
  intensity *= shimmer;
  intensity *= smoothstep(1.45, 0.55, abs(uv.x));
  return intensity;
}

/* sparse twinkling star layer */
float starLayer(vec2 uv, float density, float twinkleSpeed) {
  vec2  p = uv * 55.0;
  vec2  i = floor(p);
  vec2  f = fract(p);
  float h = hash21(i);
  if (h < 1.0 - density) return 0.0;
  vec2  s = vec2(hash21(i + 1.7), hash21(i - 1.3));
  float d = length(f - s);
  float br = smoothstep(0.045, 0.0, d);
  br *= 0.55 + 0.45 * sin(uTime * twinkleSpeed + h * 100.0);
  return br;
}

void main() {
  vec2 uv = (vUv - 0.5);
  uv.x *= uRes.x / uRes.y;

  /* 1 ── base + subtle depth tint */
  vec3 col = uBase;
  float bg = fbm(uv * 1.2 + vec2(uTime * 0.015, uTime * 0.008));
  col = mix(col, uBgDepth, pow(bg, 1.4) * 0.55);

  /* 2 ── atmospheric wash — 2 layers, domain-warped */
  vec2 warp = vec2(fbm(uv * 1.4 + vec2(uTime * 0.04, 0.0)),
                   fbm(uv * 1.1 + vec2(0.0, uTime * 0.03)));
  float w1 = fbm(uv * 2.1 + warp        + vec2(uTime * 0.025, 0.0));
  float w2 = fbm(uv * 3.4 - warp * 0.8  + vec2(0.0, uTime * 0.020));
  col = applyLayer(col, uAtmosphere1, w1 * uAtmosphereStrength,          uAtmosphereMix);
  col = applyLayer(col, uAtmosphere2, w2 * uAtmosphereStrength * 0.75,   uAtmosphereMix);

  /* 3 ── aurora bands — additive glow, gated by uAuroraStrength */
  vec3 aurora = vec3(0.0);
  aurora += uBand1 * auroraIntensity(uv, -0.18, 0.00, 0.070, 0.20, 0.16);
  aurora += uBand2 * auroraIntensity(uv,  0.22, 2.70, 0.050, 0.25, 0.20);
  aurora += uBand3 * auroraIntensity(uv,  0.02, 5.30, 0.090, 0.16, 0.14);
  aurora += uBand4 * auroraIntensity(uv, -0.38, 1.40, 0.080, 0.14, 0.10);
  aurora += uBand5 * auroraIntensity(uv,  0.42, 3.80, 0.040, 0.28, 0.22) * uBand5Alpha;
  col += aurora * uAuroraStrength;

  /* 4 ── starfield (0 intensity on light theme) */
  col += uStarCool * starLayer(uv * 0.50,                          0.028, 1.4) * uStarIntensity;
  col += uStarWarm * starLayer(uv * 0.32 + vec2(1.1, -0.3),        0.010, 0.9) * uStarIntensity;

  /* 5 ── cursor aura */
  vec2 mUv = uMouse / uRes - 0.5;
  mUv.x *= uRes.x / uRes.y;
  float md = length(uv - mUv);
  col = applyLayer(col, uCursorTint, exp(-md * 3.8) * uCursorStrength, uAtmosphereMix);

  /* 6 ── bloom emphasis */
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += col * smoothstep(0.14, 0.42, lum) * uBloomStrength;

  /* 7 ── radial vignette */
  float vig = smoothstep(1.30, 0.30, length(uv));
  col *= mix(uVignetteMin, 1.0, vig);

  /* 8 ── film grain */
  float g = fract(sin(dot(vUv * (1.0 + mod(uTime, 100.0) * 0.01), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  col += g * uGrainAmount;

  outColor = vec4(col, 1.0);
}`;

/* ─────────────────────────────  Component  ───────────────────────────── */

interface PolarisAuroraProps extends Partial<AuroraPalette> {
  className?: string;
  zIndex?: number;
}

function hex(c: string): [number, number, number] {
  const s = c.replace("#", "");
  const v = s.length === 3
    ? s.split("").map((ch) => parseInt(ch + ch, 16))
    : [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return [v[0]! / 255, v[1]! / 255, v[2]! / 255];
}

export function PolarisAurora({
  className = "",
  zIndex = 0,
  ...paletteOverrides
}: PolarisAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fresh palette every render, but funnelled through a ref so the draw loop
  // reads it live without rebuilding the WebGL pipeline on theme swap.
  const palette: AuroraPalette = { ...POLARIS_THEMES.dark.aurora, ...paletteOverrides };
  const paletteRef = useRef<AuroraPalette>(palette);
  paletteRef.current = palette;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      premultipliedAlpha: false,
      antialias: true,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      canvas.style.background = palette.base;
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("[PolarisAurora] shader:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[PolarisAurora] link:", gl.getProgramInfoLog(prog));
      return;
    }

    const quad = new Float32Array([
      -1, -1,  1, -1, -1, 1,
      -1,  1,  1, -1,  1, 1,
    ]);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const uL = {
      res:                gl.getUniformLocation(prog, "uRes"),
      time:               gl.getUniformLocation(prog, "uTime"),
      mouse:              gl.getUniformLocation(prog, "uMouse"),
      base:               gl.getUniformLocation(prog, "uBase"),
      bgDepth:            gl.getUniformLocation(prog, "uBgDepth"),
      atmosphere1:        gl.getUniformLocation(prog, "uAtmosphere1"),
      atmosphere2:        gl.getUniformLocation(prog, "uAtmosphere2"),
      atmosphereStrength: gl.getUniformLocation(prog, "uAtmosphereStrength"),
      atmosphereMix:      gl.getUniformLocation(prog, "uAtmosphereMix"),
      band1:              gl.getUniformLocation(prog, "uBand1"),
      band2:              gl.getUniformLocation(prog, "uBand2"),
      band3:              gl.getUniformLocation(prog, "uBand3"),
      band4:              gl.getUniformLocation(prog, "uBand4"),
      band5:              gl.getUniformLocation(prog, "uBand5"),
      band5Alpha:         gl.getUniformLocation(prog, "uBand5Alpha"),
      auroraStrength:     gl.getUniformLocation(prog, "uAuroraStrength"),
      cursorTint:         gl.getUniformLocation(prog, "uCursorTint"),
      cursorStrength:     gl.getUniformLocation(prog, "uCursorStrength"),
      starWarm:           gl.getUniformLocation(prog, "uStarWarm"),
      starCool:           gl.getUniformLocation(prog, "uStarCool"),
      starIntensity:      gl.getUniformLocation(prog, "uStarIntensity"),
      bloomStrength:      gl.getUniformLocation(prog, "uBloomStrength"),
      vignetteMin:        gl.getUniformLocation(prog, "uVignetteMin"),
      grainAmount:        gl.getUniformLocation(prog, "uGrainAmount"),
    };

    // Palette-derived hex→float colours are cached per unique palette object.
    // The draw loop refreshes this cache when the ref points at a new palette.
    let cachedPalette: AuroraPalette | null = null;
    let c: {
      base: [number, number, number];
      bgDepth: [number, number, number];
      atmosphere1: [number, number, number];
      atmosphere2: [number, number, number];
      band1: [number, number, number];
      band2: [number, number, number];
      band3: [number, number, number];
      band4: [number, number, number];
      band5: [number, number, number];
      cursorTint: [number, number, number];
      starWarm: [number, number, number];
      starCool: [number, number, number];
    } = {
      base:        [0, 0, 0],
      bgDepth:     [0, 0, 0],
      atmosphere1: [0, 0, 0],
      atmosphere2: [0, 0, 0],
      band1:       [0, 0, 0],
      band2:       [0, 0, 0],
      band3:       [0, 0, 0],
      band4:       [0, 0, 0],
      band5:       [0, 0, 0],
      cursorTint:  [0, 0, 0],
      starWarm:    [0, 0, 0],
      starCool:    [0, 0, 0],
    };

    const refreshColours = (p: AuroraPalette) => {
      if (p === cachedPalette) return;
      cachedPalette = p;
      c.base        = hex(p.base);
      c.bgDepth     = hex(p.bgDepth);
      c.atmosphere1 = hex(p.atmosphere1);
      c.atmosphere2 = hex(p.atmosphere2);
      c.band1       = hex(p.band1);
      c.band2       = hex(p.band2);
      c.band3       = hex(p.band3);
      c.band4       = hex(p.band4);
      c.band5       = hex(p.band5);
      c.cursorTint  = hex(p.cursorTint);
      c.starWarm    = hex(p.starWarm);
      c.starCool    = hex(p.starCool);
    };

    const state = {
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      w: 0, h: 0,
      mouseX: 0, mouseY: 0,
      time: 0,
      lastTime: performance.now(),
    };

    const resize = () => {
      state.w = window.innerWidth;
      state.h = window.innerHeight;
      canvas.style.width  = `${state.w}px`;
      canvas.style.height = `${state.h}px`;
      canvas.width  = Math.floor(state.w * state.dpr);
      canvas.height = Math.floor(state.h * state.dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMove = (e: PointerEvent) => {
      state.mouseX = e.clientX * state.dpr;
      state.mouseY = (state.h - e.clientY) * state.dpr;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    resize();

    const draw = () => {
      const p = paletteRef.current;
      refreshColours(p);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.uniform2f(uL.res, canvas.width, canvas.height);
      gl.uniform1f(uL.time, state.time);
      gl.uniform2f(uL.mouse, state.mouseX, state.mouseY);
      gl.uniform3f(uL.base,        c.base[0], c.base[1], c.base[2]);
      gl.uniform3f(uL.bgDepth,     c.bgDepth[0], c.bgDepth[1], c.bgDepth[2]);
      gl.uniform3f(uL.atmosphere1, c.atmosphere1[0], c.atmosphere1[1], c.atmosphere1[2]);
      gl.uniform3f(uL.atmosphere2, c.atmosphere2[0], c.atmosphere2[1], c.atmosphere2[2]);
      gl.uniform1f(uL.atmosphereStrength, p.atmosphereStrength);
      gl.uniform1f(uL.atmosphereMix,      p.atmosphereMix);
      gl.uniform3f(uL.band1,       c.band1[0], c.band1[1], c.band1[2]);
      gl.uniform3f(uL.band2,       c.band2[0], c.band2[1], c.band2[2]);
      gl.uniform3f(uL.band3,       c.band3[0], c.band3[1], c.band3[2]);
      gl.uniform3f(uL.band4,       c.band4[0], c.band4[1], c.band4[2]);
      gl.uniform3f(uL.band5,       c.band5[0], c.band5[1], c.band5[2]);
      gl.uniform1f(uL.band5Alpha,     p.band5Alpha);
      gl.uniform1f(uL.auroraStrength, p.auroraStrength);
      gl.uniform3f(uL.cursorTint,  c.cursorTint[0], c.cursorTint[1], c.cursorTint[2]);
      gl.uniform1f(uL.cursorStrength, p.cursorStrength);
      gl.uniform3f(uL.starWarm,    c.starWarm[0], c.starWarm[1], c.starWarm[2]);
      gl.uniform3f(uL.starCool,    c.starCool[0], c.starCool[1], c.starCool[2]);
      gl.uniform1f(uL.starIntensity,  p.starIntensity);
      gl.uniform1f(uL.bloomStrength,  p.bloomStrength);
      gl.uniform1f(uL.vignetteMin,    p.vignetteMin);
      gl.uniform1f(uL.grainAmount,    p.grainAmount);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    };

    let rafId = 0;
    const loop = () => {
      const now = performance.now();
      const dt  = Math.min(0.033, (now - state.lastTime) / 1000);
      state.lastTime = now;
      state.time += dt;
      draw();
      rafId = requestAnimationFrame(loop);
    };

    if (reducedMotion) draw();
    else rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // NOTE: loseContext() runs only on true unmount (empty deps).
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 w-screen h-screen pointer-events-none select-none ${className}`}
      style={{ zIndex, background: palette.base }}
    />
  );
}

export default PolarisAurora;
