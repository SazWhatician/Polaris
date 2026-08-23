"use client";

/**
 * PolarisField — a restrained, GPU-rendered constellation field for the
 * Polaris landing page. Raw WebGL2 with GLSL shaders (no Three.js).
 *
 * Interaction surface:
 *   • cursor         → gravitational falloff (soft radius + spring return)
 *   • click          → tiny 4-point Polaris star + subtle ripple
 *   • scroll         → field gradually organises (scattered → lattice)
 *   • CTA hover      → attractor mode toward [data-polaris-cta] elements
 *   • reduced-motion → renders a single static frame
 */

import { useEffect, useRef } from "react";

/* ─────────────────────────────  GLSL  ───────────────────────────── */

const VS_POINT = /* glsl */ `#version 300 es
in vec2  aPos;
in float aSize;
in float aBright;
uniform vec2 uRes;
out float vBright;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position  = vec4(clip, 0.0, 1.0);
  gl_PointSize = aSize;
  vBright      = aBright;
}`;

const FS_POINT = /* glsl */ `#version 300 es
precision mediump float;
in  float vBright;
uniform vec3 uCore;
uniform vec3 uHalo;
out vec4 outColor;
void main() {
  vec2  c    = gl_PointCoord - 0.5;
  float d    = length(c);
  float halo = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.18, 0.0, d);
  vec3  col  = mix(uHalo, uCore, core);
  float a    = (halo * 0.55 + core * 0.90) * vBright;
  outColor   = vec4(col * a, a);
}`;

const VS_LINE = /* glsl */ `#version 300 es
in vec2  aPos;
in float aAlpha;
uniform vec2 uRes;
out float vAlpha;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  vAlpha      = aAlpha;
}`;

const FS_LINE = /* glsl */ `#version 300 es
precision mediump float;
in  float vAlpha;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  outColor = vec4(uColor * vAlpha, vAlpha);
}`;

const VS_STAR = /* glsl */ `#version 300 es
in vec2  aQuad;
in vec2  aCenter;
in float aSize;
in float aAlpha;
uniform vec2 uRes;
out vec2  vUV;
out float vAlpha;
void main() {
  vec2 pos  = aCenter + aQuad * aSize;
  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  vUV     = aQuad;
  vAlpha  = aAlpha;
}`;

const FS_STAR = /* glsl */ `#version 300 es
precision mediump float;
in  vec2  vUV;
in  float vAlpha;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  vec2  p     = vUV;
  float horiz = exp(-p.y * p.y * 110.0) * exp(-p.x * p.x * 3.5);
  float vert  = exp(-p.x * p.x * 110.0) * exp(-p.y * p.y * 3.5);
  float core  = exp(-(p.x * p.x + p.y * p.y) * 55.0);
  float halo  = exp(-(p.x * p.x + p.y * p.y) *  6.0) * 0.35;
  float s     = (horiz + vert + core + halo) * vAlpha;
  outColor    = vec4(uColor * s, s);
}`;

const VS_RIPPLE = /* glsl */ `#version 300 es
in vec2  aQuad;
in vec2  aCenter;
in float aRadius;
in float aAlpha;
uniform vec2 uRes;
out vec2  vUV;
out float vAlpha;
void main() {
  vec2 pos  = aCenter + aQuad * aRadius;
  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  vUV     = aQuad;
  vAlpha  = aAlpha;
}`;

const FS_RIPPLE = /* glsl */ `#version 300 es
precision mediump float;
in  vec2  vUV;
in  float vAlpha;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  float d    = length(vUV);
  // A thin ring at d ≈ 0.9, falling off both sides.
  float ring = exp(-pow((d - 0.9) * 14.0, 2.0));
  float a    = ring * vAlpha;
  outColor   = vec4(uColor * a, a);
}`;

/* ─────────────────────────────  Types  ───────────────────────────── */

type Particle = {
  homeX: number;
  homeY: number;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  orbitR: number;
  orbitSpeed: number;
  size: number;
  baseBright: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

type Ripple = { x: number; y: number; age: number; maxAge: number };
type Star   = { x: number; y: number; age: number; maxAge: number };

interface PolarisFieldProps {
  className?: string;
  /** CSS selector used to look up CTA elements the field should attract toward. */
  ctaSelector?: string;
  /** Optional z-index override. Defaults to 0 (behind everything with z-10+). */
  zIndex?: number;
}

/* ─────────────────────────────  Component  ───────────────────────────── */

export function PolarisField({
  className = "",
  ctaSelector = "[data-polaris-cta]",
  zIndex = 0,
}: PolarisFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches;

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      // Graceful no-op if WebGL2 is unavailable.
      canvas.style.background = "#050816";
      return;
    }

    /* ───────── shader plumbing ───────── */

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("[PolarisField] shader:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const link = (vs: WebGLShader, fs: WebGLShader) => {
      const p = gl.createProgram();
      if (!p) return null;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("[PolarisField] link:", gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    };

    const vsPoint  = compile(gl.VERTEX_SHADER, VS_POINT);
    const fsPoint  = compile(gl.FRAGMENT_SHADER, FS_POINT);
    const vsLine   = compile(gl.VERTEX_SHADER, VS_LINE);
    const fsLine   = compile(gl.FRAGMENT_SHADER, FS_LINE);
    const vsStar   = compile(gl.VERTEX_SHADER, VS_STAR);
    const fsStar   = compile(gl.FRAGMENT_SHADER, FS_STAR);
    const vsRipple = compile(gl.VERTEX_SHADER, VS_RIPPLE);
    const fsRipple = compile(gl.FRAGMENT_SHADER, FS_RIPPLE);

    if (!vsPoint || !fsPoint || !vsLine || !fsLine || !vsStar || !fsStar || !vsRipple || !fsRipple) return;

    const progPoint  = link(vsPoint,  fsPoint);
    const progLine   = link(vsLine,   fsLine);
    const progStar   = link(vsStar,   fsStar);
    const progRipple = link(vsRipple, fsRipple);
    if (!progPoint || !progLine || !progStar || !progRipple) return;

    /* ───────── palette (deep navy / cool violet) ───────── */

    const BG_R = 0.020, BG_G = 0.030, BG_B = 0.086;             // #050816
    const CORE_COL = [0.86, 0.90, 0.98] as const;                // pale ice
    const HALO_COL = [0.30, 0.36, 0.62] as const;                // indigo halo
    const LINE_COL = [0.32, 0.42, 0.78] as const;                // #5266C7-ish
    const STAR_COL = [1.00, 0.96, 0.85] as const;                // Polaris warm white
    const RIPPLE_COL = [0.42, 0.48, 0.85] as const;              // soft violet ring

    /* ───────── state ───────── */

    const MAX_LINES     = mobile ? 220 : 480;
    const PARTICLE_N    = mobile ?  90 : 180;
    const CONNECT_MIN   = 90;
    const CONNECT_RANGE = 60;

    const state = {
      dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2.0),
      w: 0,
      h: 0,
      t: 0,
      lastFrame: performance.now(),
      pointer: { x: -9999, y: -9999, active: false },
      pointerVel: 0,
      scrollProgress: 0,
      cta: null as { cx: number; cy: number } | null,
      particles: [] as Particle[],
      ripples:   [] as Ripple[],
      stars:     [] as Star[],
    };

    /* ───────── buffers ───────── */

    // Point buffer: [x, y, size, bright] * N
    const pointData = new Float32Array(PARTICLE_N * 4);
    const pointBuf = gl.createBuffer()!;

    // Line buffer: 2 verts * [x, y, alpha] * MAX_LINES
    const lineData = new Float32Array(MAX_LINES * 2 * 3);
    const lineBuf  = gl.createBuffer()!;

    // Star quad: 6 verts * (aQuad.xy, aCenter.xy, aSize, aAlpha) → interleaved but simpler to keep static aQuad in one buffer, per-instance in another.
    // For simplicity, expand per-star to 6 vertices in one interleaved buffer each frame.
    // Layout per vertex: [quadX, quadY, centerX, centerY, size, alpha]  → 6 floats
    const MAX_STARS = 24;
    const starData = new Float32Array(MAX_STARS * 6 * 6);
    const starBuf  = gl.createBuffer()!;

    // Ripple quad: same interleaved approach
    // Layout per vertex: [quadX, quadY, centerX, centerY, radius, alpha]  → 6 floats
    const MAX_RIPPLES = 12;
    const rippleData = new Float32Array(MAX_RIPPLES * 6 * 6);
    const rippleBuf  = gl.createBuffer()!;

    /* ───────── VAOs ───────── */

    const vaoPoint = gl.createVertexArray()!;
    gl.bindVertexArray(vaoPoint);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
    {
      const stride = 4 * 4;
      const locPos    = gl.getAttribLocation(progPoint, "aPos");
      const locSize   = gl.getAttribLocation(progPoint, "aSize");
      const locBright = gl.getAttribLocation(progPoint, "aBright");
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locSize);
      gl.vertexAttribPointer(locSize, 1, gl.FLOAT, false, stride, 2 * 4);
      gl.enableVertexAttribArray(locBright);
      gl.vertexAttribPointer(locBright, 1, gl.FLOAT, false, stride, 3 * 4);
    }

    const vaoLine = gl.createVertexArray()!;
    gl.bindVertexArray(vaoLine);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    {
      const stride = 3 * 4;
      const locPos   = gl.getAttribLocation(progLine, "aPos");
      const locAlpha = gl.getAttribLocation(progLine, "aAlpha");
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locAlpha);
      gl.vertexAttribPointer(locAlpha, 1, gl.FLOAT, false, stride, 2 * 4);
    }

    const vaoStar = gl.createVertexArray()!;
    gl.bindVertexArray(vaoStar);
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
    {
      const stride = 6 * 4;
      const locQuad   = gl.getAttribLocation(progStar, "aQuad");
      const locCenter = gl.getAttribLocation(progStar, "aCenter");
      const locSize   = gl.getAttribLocation(progStar, "aSize");
      const locAlpha  = gl.getAttribLocation(progStar, "aAlpha");
      gl.enableVertexAttribArray(locQuad);
      gl.vertexAttribPointer(locQuad, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locCenter);
      gl.vertexAttribPointer(locCenter, 2, gl.FLOAT, false, stride, 2 * 4);
      gl.enableVertexAttribArray(locSize);
      gl.vertexAttribPointer(locSize, 1, gl.FLOAT, false, stride, 4 * 4);
      gl.enableVertexAttribArray(locAlpha);
      gl.vertexAttribPointer(locAlpha, 1, gl.FLOAT, false, stride, 5 * 4);
    }

    const vaoRipple = gl.createVertexArray()!;
    gl.bindVertexArray(vaoRipple);
    gl.bindBuffer(gl.ARRAY_BUFFER, rippleBuf);
    {
      const stride = 6 * 4;
      const locQuad   = gl.getAttribLocation(progRipple, "aQuad");
      const locCenter = gl.getAttribLocation(progRipple, "aCenter");
      const locRadius = gl.getAttribLocation(progRipple, "aRadius");
      const locAlpha  = gl.getAttribLocation(progRipple, "aAlpha");
      gl.enableVertexAttribArray(locQuad);
      gl.vertexAttribPointer(locQuad, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(locCenter);
      gl.vertexAttribPointer(locCenter, 2, gl.FLOAT, false, stride, 2 * 4);
      gl.enableVertexAttribArray(locRadius);
      gl.vertexAttribPointer(locRadius, 1, gl.FLOAT, false, stride, 4 * 4);
      gl.enableVertexAttribArray(locAlpha);
      gl.vertexAttribPointer(locAlpha, 1, gl.FLOAT, false, stride, 5 * 4);
    }

    gl.bindVertexArray(null);

    /* ───────── uniform locations ───────── */

    const uPointRes  = gl.getUniformLocation(progPoint, "uRes");
    const uPointCore = gl.getUniformLocation(progPoint, "uCore");
    const uPointHalo = gl.getUniformLocation(progPoint, "uHalo");
    const uLineRes   = gl.getUniformLocation(progLine, "uRes");
    const uLineCol   = gl.getUniformLocation(progLine, "uColor");
    const uStarRes   = gl.getUniformLocation(progStar, "uRes");
    const uStarCol   = gl.getUniformLocation(progStar, "uColor");
    const uRipRes    = gl.getUniformLocation(progRipple, "uRes");
    const uRipCol    = gl.getUniformLocation(progRipple, "uColor");

    /* ───────── resize / DPR ───────── */

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      state.w = w;
      state.h = h;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width  = Math.floor(w * state.dpr);
      canvas.height = Math.floor(h * state.dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Update grid positions for organised state.
      const cols = Math.round(Math.sqrt(PARTICLE_N * (w / h)));
      const rows = Math.ceil(PARTICLE_N / cols);
      const cellW = w / cols;
      const cellH = h / rows;
      let i = 0;
      for (let r = 0; r < rows && i < state.particles.length; r++) {
        for (let c = 0; c < cols && i < state.particles.length; c++) {
          const jitterX = (Math.sin((r * 13.37 + c * 7.71) * 12.9898) * 43758.5453 % 1) * cellW * 0.35;
          const jitterY = (Math.cos((r * 5.13 + c * 11.31) * 78.233) * 43758.5453 % 1) * cellH * 0.35;
          const p = state.particles[i]!;
          p.gridX = cellW * (c + 0.5) + jitterX;
          p.gridY = cellH * (r + 0.5) + jitterY;
          i++;
        }
      }
    };

    /* ───────── particle init ───────── */

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const initParticles = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < PARTICLE_N; i++) {
        const px = rand(0, w);
        const py = rand(0, h);
        state.particles.push({
          homeX: px,
          homeY: py,
          gridX: px,
          gridY: py,
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          phase: rand(0, Math.PI * 2),
          orbitR: rand(6, 22),
          orbitSpeed: rand(0.10, 0.28),
          size: rand(1.6, 3.4) * state.dpr,
          baseBright: rand(0.55, 1.00),
          twinklePhase: rand(0, Math.PI * 2),
          twinkleSpeed: rand(0.4, 1.4),
        });
      }
    };

    /* ───────── pointer / scroll / click / CTA ───────── */

    const onPointerMove = (e: PointerEvent) => {
      const nx = e.clientX;
      const ny = e.clientY;
      const dx = nx - state.pointer.x;
      const dy = ny - state.pointer.y;
      state.pointerVel = Math.min(60, Math.hypot(dx, dy));
      state.pointer.x = nx;
      state.pointer.y = ny;
      state.pointer.active = true;
    };
    const onPointerLeave = () => {
      state.pointer.active = false;
      state.pointer.x = -9999;
      state.pointer.y = -9999;
      state.pointerVel = 0;
    };

    const onClick = (e: MouseEvent) => {
      // Suppress the "ambient" click FX on interactive elements to keep it tasteful.
      const t = e.target as HTMLElement | null;
      const onInteractive = t?.closest("a, button, input, textarea, select, [role='button']");
      if (state.stars.length < MAX_STARS && !onInteractive) {
        state.stars.push({ x: e.clientX, y: e.clientY, age: 0, maxAge: 1.6 });
      }
      if (state.ripples.length < MAX_RIPPLES) {
        state.ripples.push({ x: e.clientX, y: e.clientY, age: 0, maxAge: 1.4 });
      }
    };

    const onScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scrollProgress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    };

    const updateCta = () => {
      const el = document.querySelector<HTMLElement>(ctaSelector);
      if (!el) { state.cta = null; return; }
      const r = el.getBoundingClientRect();
      const off =
        r.bottom < 0 || r.top > window.innerHeight ||
        r.right < 0  || r.left > window.innerWidth;
      state.cta = off ? null : { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    let ctaHover = false;
    const onCtaEnter = () => { ctaHover = true; };
    const onCtaLeave = () => { ctaHover = false; };

    const bindCta = () => {
      const el = document.querySelector<HTMLElement>(ctaSelector);
      if (!el) return () => {};
      el.addEventListener("mouseenter", onCtaEnter);
      el.addEventListener("mouseleave", onCtaLeave);
      return () => {
        el.removeEventListener("mouseenter", onCtaEnter);
        el.removeEventListener("mouseleave", onCtaLeave);
      };
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    let unbindCta = bindCta();
    const ctaObserver = new MutationObserver(() => {
      unbindCta();
      unbindCta = bindCta();
    });
    ctaObserver.observe(document.body, { childList: true, subtree: true });

    /* ───────── init ───────── */

    initParticles();
    resize();
    onScroll();

    /* ───────── frame ───────── */

    const CURSOR_RADIUS = 220;
    const CTA_RADIUS    = 260;

    const draw = () => {
      const now = performance.now();
      const dt  = Math.min(0.033, (now - state.lastFrame) / 1000);
      state.lastFrame = now;
      state.t += dt;

      /* update CTA rect every frame (cheap) */
      if (ctaHover) updateCta();

      /* simulate */
      const p = state.scrollProgress;                      // 0..1 → scattered → organised
      const connectDist = CONNECT_MIN + p * CONNECT_RANGE;
      const connectDist2 = connectDist * connectDist;
      const lineBaseAlpha = 0.05 + p * 0.10;

      for (let i = 0; i < state.particles.length; i++) {
        const pt = state.particles[i]!;

        // ambient anchor: blend between random home and lattice cell
        const anchorX = pt.homeX + (pt.gridX - pt.homeX) * p;
        const anchorY = pt.homeY + (pt.gridY - pt.homeY) * p;

        // tiny orbit around anchor
        const ambX = anchorX + Math.cos(pt.phase + state.t * pt.orbitSpeed) * pt.orbitR;
        const ambY = anchorY + Math.sin(pt.phase + state.t * pt.orbitSpeed * 0.83) * pt.orbitR;

        // cursor gravity
        if (state.pointer.active) {
          const dx = state.pointer.x - pt.x;
          const dy = state.pointer.y - pt.y;
          const d2 = dx * dx + dy * dy;
          const R2 = CURSOR_RADIUS * CURSOR_RADIUS;
          if (d2 < R2 && d2 > 4) {
            const d = Math.sqrt(d2);
            const falloff = 1 - d / CURSOR_RADIUS;
            const force = falloff * falloff * 32;
            pt.vx += (dx / d) * force * dt;
            pt.vy += (dy / d) * force * dt;
          }
        }

        // CTA attraction
        if (ctaHover && state.cta) {
          const dx = state.cta.cx - pt.x;
          const dy = state.cta.cy - pt.y;
          const d2 = dx * dx + dy * dy;
          const R2 = CTA_RADIUS * CTA_RADIUS;
          if (d2 < R2 && d2 > 4) {
            const d = Math.sqrt(d2);
            const falloff = 1 - d / CTA_RADIUS;
            const force = falloff * 45;
            pt.vx += (dx / d) * force * dt;
            pt.vy += (dy / d) * force * dt;
          }
        }

        // ripple push
        for (let ri = 0; ri < state.ripples.length; ri++) {
          const r = state.ripples[ri]!;
          const life = r.age / r.maxAge;
          const rmax = 380;
          const rr = life * rmax;
          const dx = pt.x - r.x;
          const dy = pt.y - r.y;
          const d = Math.hypot(dx, dy);
          const band = Math.exp(-Math.pow((d - rr) / 30, 2));
          if (band > 0.001 && d > 1) {
            const force = band * 55 * (1 - life);
            pt.vx += (dx / d) * force * dt;
            pt.vy += (dy / d) * force * dt;
          }
        }

        // spring toward ambient home + damping
        const springK = 3.2;
        pt.vx += (ambX - pt.x) * springK * dt;
        pt.vy += (ambY - pt.y) * springK * dt;
        pt.vx *= Math.pow(0.02, dt);   // damping
        pt.vy *= Math.pow(0.02, dt);
        pt.x  += pt.vx * dt;
        pt.y  += pt.vy * dt;
      }

      /* age ephemerals */
      for (let i = state.ripples.length - 1; i >= 0; i--) {
        const rp = state.ripples[i]!;
        rp.age += dt;
        if (rp.age >= rp.maxAge) state.ripples.splice(i, 1);
      }
      for (let i = state.stars.length - 1; i >= 0; i--) {
        const st = state.stars[i]!;
        st.age += dt;
        if (st.age >= st.maxAge) state.stars.splice(i, 1);
      }

      /* fill point buffer */
      for (let i = 0; i < state.particles.length; i++) {
        const pt = state.particles[i]!;
        const twinkle = 0.75 + 0.25 * Math.sin(pt.twinklePhase + state.t * pt.twinkleSpeed);
        pointData[i * 4 + 0] = pt.x;
        pointData[i * 4 + 1] = pt.y;
        pointData[i * 4 + 2] = pt.size;
        pointData[i * 4 + 3] = pt.baseBright * twinkle;
      }

      /* build connections (O(n²) — n is small) */
      let linePairs = 0;
      for (let i = 0; i < state.particles.length && linePairs < MAX_LINES; i++) {
        const a = state.particles[i]!;
        for (let j = i + 1; j < state.particles.length && linePairs < MAX_LINES; j++) {
          const b = state.particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < connectDist2) {
            let alpha = (1 - d2 / connectDist2) * lineBaseAlpha;
            // Cursor proximity bump — connections nearest to the pointer glow a touch.
            if (state.pointer.active) {
              const mx = (a.x + b.x) * 0.5;
              const my = (a.y + b.y) * 0.5;
              const mdx = state.pointer.x - mx;
              const mdy = state.pointer.y - my;
              const md2 = mdx * mdx + mdy * mdy;
              if (md2 < CURSOR_RADIUS * CURSOR_RADIUS) {
                alpha += (1 - md2 / (CURSOR_RADIUS * CURSOR_RADIUS)) * 0.10;
              }
            }
            const base = linePairs * 6;
            lineData[base + 0] = a.x;
            lineData[base + 1] = a.y;
            lineData[base + 2] = alpha;
            lineData[base + 3] = b.x;
            lineData[base + 4] = b.y;
            lineData[base + 5] = alpha;
            linePairs++;
          }
        }
      }

      /* build ripple quads (6 verts / ripple, triangle list) */
      let ripCount = 0;
      for (let i = 0; i < state.ripples.length && ripCount < MAX_RIPPLES; i++) {
        const r = state.ripples[i]!;
        const life = r.age / r.maxAge;
        const radius = life * 420;
        const alpha  = Math.pow(1 - life, 1.4) * 0.85;
        writeQuad(rippleData, ripCount * 6 * 6, r.x, r.y, radius, alpha, /*ripple*/ true);
        ripCount++;
      }

      /* build star quads (6 verts / star) */
      let starCount = 0;
      for (let i = 0; i < state.stars.length && starCount < MAX_STARS; i++) {
        const s = state.stars[i]!;
        const life = s.age / s.maxAge;
        const size = 30 + (1 - Math.pow(1 - life, 3)) * 22;
        const alpha = Math.pow(1 - life, 1.2);
        writeQuad(starData, starCount * 6 * 6, s.x, s.y, size, alpha, /*ripple*/ false);
        starCount++;
      }

      /* ───────── render ───────── */

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(BG_R, BG_G, BG_B, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied additive-ish

      // Lines first (softest layer)
      if (linePairs > 0) {
        gl.useProgram(progLine);
        gl.uniform2f(uLineRes, state.w, state.h);
        gl.uniform3f(uLineCol, LINE_COL[0], LINE_COL[1], LINE_COL[2]);
        gl.bindVertexArray(vaoLine);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
        gl.bufferData(gl.ARRAY_BUFFER, lineData.subarray(0, linePairs * 6), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.LINES, 0, linePairs * 2);
      }

      // Ripple rings
      if (ripCount > 0) {
        gl.useProgram(progRipple);
        gl.uniform2f(uRipRes, state.w, state.h);
        gl.uniform3f(uRipCol, RIPPLE_COL[0], RIPPLE_COL[1], RIPPLE_COL[2]);
        gl.bindVertexArray(vaoRipple);
        gl.bindBuffer(gl.ARRAY_BUFFER, rippleBuf);
        gl.bufferData(gl.ARRAY_BUFFER, rippleData.subarray(0, ripCount * 6 * 6), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, ripCount * 6);
      }

      // Particles
      gl.useProgram(progPoint);
      gl.uniform2f(uPointRes, state.w, state.h);
      gl.uniform3f(uPointCore, CORE_COL[0], CORE_COL[1], CORE_COL[2]);
      gl.uniform3f(uPointHalo, HALO_COL[0], HALO_COL[1], HALO_COL[2]);
      gl.bindVertexArray(vaoPoint);
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pointData, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, state.particles.length);

      // Polaris stars (on top of everything)
      if (starCount > 0) {
        gl.useProgram(progStar);
        gl.uniform2f(uStarRes, state.w, state.h);
        gl.uniform3f(uStarCol, STAR_COL[0], STAR_COL[1], STAR_COL[2]);
        gl.bindVertexArray(vaoStar);
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
        gl.bufferData(gl.ARRAY_BUFFER, starData.subarray(0, starCount * 6 * 6), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, starCount * 6);
      }

      gl.bindVertexArray(null);
    };

    /* helper: write two triangles for a quad centred at (cx, cy) with size / radius */
    function writeQuad(
      arr: Float32Array,
      offset: number,
      cx: number, cy: number,
      sizeOrRadius: number,
      alpha: number,
      _isRipple: boolean
    ) {
      // Vertex layout is 6 floats:
      //   [quadX, quadY, centerX, centerY, sizeOrRadius, alpha]
      // Two triangles forming a quad in aQuad-space [-1, 1].
      const V: readonly number[] = [
        -1, -1,   1, -1,   1, 1,
        -1, -1,   1,  1,  -1, 1,
      ];
      for (let i = 0; i < 6; i++) {
        const b = offset + i * 6;
        arr[b + 0] = V[i * 2 + 0]!;
        arr[b + 1] = V[i * 2 + 1]!;
        arr[b + 2] = cx;
        arr[b + 3] = cy;
        arr[b + 4] = sizeOrRadius;
        arr[b + 5] = alpha;
      }
    }

    /* ───────── loop ───────── */

    let rafId = 0;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };

    if (reducedMotion) {
      // Render exactly one static frame; no animation loop.
      draw();
    } else {
      rafId = requestAnimationFrame(loop);
    }

    /* ───────── cleanup ───────── */

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      unbindCta();
      ctaObserver.disconnect();

      gl.deleteBuffer(pointBuf);
      gl.deleteBuffer(lineBuf);
      gl.deleteBuffer(starBuf);
      gl.deleteBuffer(rippleBuf);
      gl.deleteVertexArray(vaoPoint);
      gl.deleteVertexArray(vaoLine);
      gl.deleteVertexArray(vaoStar);
      gl.deleteVertexArray(vaoRipple);
      gl.deleteProgram(progPoint);
      gl.deleteProgram(progLine);
      gl.deleteProgram(progStar);
      gl.deleteProgram(progRipple);
      gl.deleteShader(vsPoint); gl.deleteShader(fsPoint);
      gl.deleteShader(vsLine);  gl.deleteShader(fsLine);
      gl.deleteShader(vsStar);  gl.deleteShader(fsStar);
      gl.deleteShader(vsRipple); gl.deleteShader(fsRipple);

      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, [ctaSelector]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 w-screen h-screen pointer-events-none select-none ${className}`}
      style={{
        zIndex,
        background: "#050816",
      }}
    />
  );
}

export default PolarisField;
