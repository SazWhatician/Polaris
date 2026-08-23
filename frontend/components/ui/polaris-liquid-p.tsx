"use client";

/**
 * PolarisLiquidP — two-pass Navier-Stokes-ish fluid shader stencilled to the
 * Polaris logo mask.
 *
 *   Pass 1  (simulation) — writes velocity + height into a ping-pong RGBA16F FBO,
 *                          integrating mouse impulses and letting the mask act as
 *                          a container so fluid stays inside the P.
 *   Pass 2  (display)    — reads the fluid FBO, distorts a chromatic trigonometric
 *                          field with the local velocity, applies the mask as
 *                          premultiplied alpha, outputs to screen.
 *
 * Shader logic ported from the user's Three.js implementation to raw GLSL 3.00 ES.
 * Requires WebGL2 + EXT_color_buffer_half_float (widely available).
 */

import { useEffect, useRef } from "react";

/* ─────────────────────────────  GLSL  ───────────────────────────── */

const VS = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/* ---------- Simulation ---------- */

const FS_SIM = /* glsl */ `#version 300 es
precision highp float;

uniform float     iTime;
uniform vec2      iResolution;
uniform vec4      iMouse;              // xy = current px, zw = previous px
uniform int       iFrame;
uniform sampler2D iPreviousFrame;
uniform sampler2D uMask;
uniform vec2      uMaskScale;
uniform vec2      uMaskOffset;
uniform float     uBrushSize;
uniform float     uBrushStrength;
uniform float     uFluidDecay;
uniform float     uTrailLength;
uniform float     uStopDecay;

in  vec2 vUv;
out vec4 outColor;

vec2 ur, U;

float ln(vec2 p, vec2 a, vec2 b) {
  vec2 ba = b - a;
  float d2 = dot(ba, ba);
  if (d2 < 1e-6) return length(p - a);
  float t = clamp(dot(p - a, ba) / d2, 0.0, 1.0);
  return length(p - a - ba * t);
}

vec4 tOff(vec2 v, int a, int b) {
  return texture(iPreviousFrame, fract((v + vec2(float(a), float(b))) / ur));
}
vec4 tAt(vec2 v) {
  return texture(iPreviousFrame, fract(v / ur));
}

float area(vec2 a, vec2 b, vec2 c) {
  float A = length(b - c), B = length(c - a), C = length(a - b);
  float s = 0.5 * (A + B + C);
  return sqrt(max(0.0, s * (s - A) * (s - B) * (s - C)));
}

vec2 toMaskUv(vec2 uv) {
  return (uv - 0.5) / uMaskScale + uMaskOffset;
}
float sampleMask(vec2 uv) {
  vec2 m = toMaskUv(uv);
  if (m.x < 0.0 || m.x > 1.0 || m.y < 0.0 || m.y > 1.0) return 0.0;
  return texture(uMask, vec2(m.x, 1.0 - m.y)).a;
}

void main() {
  U  = vUv * iResolution;
  ur = iResolution;

  if (iFrame < 1) {
    outColor = vec4(0.0);
    return;
  }

  vec2 v = U;
  vec2 A = v + vec2( 1.0,  1.0);
  vec2 B = v + vec2( 1.0, -1.0);
  vec2 C = v + vec2(-1.0,  1.0);
  vec2 D = v + vec2(-1.0, -1.0);

  for (int i = 0; i < 8; i++) {
    v -= tAt(v).xy;
    A -= tAt(A).xy;
    B -= tAt(B).xy;
    C -= tAt(C).xy;
    D -= tAt(D).xy;
  }

  vec4 me = tAt(v);
  vec4 n  = tOff(v, 0,  1);
  vec4 e  = tOff(v, 1,  0);
  vec4 s  = tOff(v, 0, -1);
  vec4 w  = tOff(v,-1,  0);

  vec4 ne = 0.25 * (n + e + s + w);
  me = mix(tAt(v), ne, vec4(0.15, 0.15, 0.95, 0.0));
  me.z = me.z - 0.01 * ((area(A, B, C) + area(B, C, D)) - 4.0);

  vec4 pr = vec4(e.z, w.z, n.z, s.z);
  me.xy = me.xy + 100.0 * vec2(pr.x - pr.y, pr.z - pr.w) / ur;

  me.xy *= uFluidDecay;
  me.z  *= uTrailLength;

  if (iMouse.z > 0.0) {
    vec2 mousePos  = iMouse.xy;
    vec2 mousePrev = iMouse.zw;
    vec2 mouseVel  = mousePos - mousePrev;
    float velMag   = length(mouseVel);
    float q        = ln(U, mousePos, mousePrev);
    vec2 m         = mousePos - mousePrev;
    float l        = length(m);
    if (l > 0.0) m = min(l, 10.0) * m / l;

    float brushSizeFactor = 1e-4 / uBrushSize;
    float strengthFactor  = 0.03 * uBrushStrength;

    float falloff = exp(-brushSizeFactor * q * q * q);
    falloff = pow(falloff, 0.5);

    vec3 impulse = strengthFactor * falloff * vec3(m, 10.0);
    me.x += impulse.x;
    me.y += impulse.y;
    me.w += impulse.z;

    if (velMag < 2.0) {
      float distToCursor = length(U - mousePos);
      float influence    = exp(-distToCursor * 0.01);
      float cursorDecay  = mix(1.0, uStopDecay, influence);
      me.xy *= cursorDecay;
      me.z  *= cursorDecay;
    }
  }

  // Contain the fluid to the P mask (rigid boundary — zero outside).
  float mask = sampleMask(vUv);
  me *= smoothstep(0.02, 0.30, mask);

  outColor = clamp(me, vec4(-0.4), vec4(0.4));
}
`;

/* ---------- Display ---------- */

const FS_DISPLAY = `#version 300 es
precision highp float;

uniform float     iTime;
uniform vec2      iResolution;
uniform sampler2D iFluid;
uniform sampler2D uMask;
uniform vec2      uMaskScale;
uniform vec2      uMaskOffset;
uniform float     uDistortionAmount;
uniform vec3      uColor1;
uniform vec3      uColor2;
uniform vec3      uColor3;
uniform vec3      uColor4;
uniform float     uColorIntensity;
uniform float     uSoftness;

in  vec2 vUv;
out vec4 outColor;

vec2 toMaskUv(vec2 uv) {
  return (uv - 0.5) / uMaskScale + uMaskOffset;
}

void main() {
  vec2 mUv = toMaskUv(vUv);
  if (mUv.x < 0.0 || mUv.x > 1.0 || mUv.y < 0.0 || mUv.y > 1.0) {
    outColor = vec4(0.0);
    return;
  }
  float mask = texture(uMask, vec2(mUv.x, 1.0 - mUv.y)).a;
  if (mask < 0.02) { outColor = vec4(0.0); return; }

  vec2  fragCoord = vUv * iResolution;
  vec4  fluid     = texture(iFluid, vUv);
  vec2  fluidVel  = fluid.xy;

  float mr = min(iResolution.x, iResolution.y);
  vec2  uv = (fragCoord * 2.0 - iResolution) / mr;

  uv += fluidVel * (0.5 * uDistortionAmount);

  float d = -iTime * 0.5;
  float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    a += cos(fi - d - a * uv.x);
    d += sin(uv.y * fi + a);
  }
  d += iTime * 0.5;

  float m1 = cos(uv.x * d) * 0.5 + 0.5;
  float m2 = cos(uv.y * a) * 0.5 + 0.5;
  float m3 = sin(d + a)    * 0.5 + 0.5;

  float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);
  m1 = mix(m1, 0.5, smoothAmount);
  m2 = mix(m2, 0.5, smoothAmount);
  m3 = mix(m3, 0.5, smoothAmount);

  vec3 col = mix(uColor1, uColor2, m1);
  col      = mix(col,     uColor3, m2);
  col      = mix(col,     uColor4, m3 * 0.4);
  col     *= uColorIntensity;

  float edge = smoothstep(0.02, 0.35, mask);
  outColor   = vec4(col * edge, edge);
}`;

/* ─────────────────────────────  Component  ───────────────────────────── */

interface PolarisLiquidPProps {
  className?: string;
  stencilSrc?: string;
  /* simulation */
  brushSize?: number;
  brushStrength?: number;
  fluidDecay?: number;
  trailLength?: number;
  stopDecay?: number;
  /* display */
  distortionAmount?: number;
  colorIntensity?: number;
  softness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  /* perf */
  simScale?: number; // fraction of canvas resolution to simulate at (0.25–1.0)
}

function hex(c: string): [number, number, number] {
  const s = c.replace("#", "");
  const v = s.length === 3
    ? s.split("").map((ch) => parseInt(ch + ch, 16))
    : [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return [v[0]! / 255, v[1]! / 255, v[2]! / 255];
}

export function PolarisLiquidP({
  className = "",
  stencilSrc = "/polaris-p-stencil.png",
  brushSize      = 25.0,
  brushStrength  = 0.6,
  fluidDecay     = 0.985,
  trailLength    = 0.94,
  stopDecay      = 0.88,
  distortionAmount = 2.6,
  colorIntensity   = 1.05,
  softness         = 1.0,
  color1 = "#050816",
  color2 = "#3B5BDB",
  color3 = "#7C3AED",
  color4 = "#E8ECFA",
  simScale = 0.5,
}: PolarisLiquidPProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live palette + params via ref so theme swaps don't rebuild the WebGL pipeline.
  const paramsRef = useRef({
    brushSize, brushStrength, fluidDecay, trailLength, stopDecay,
    distortionAmount, colorIntensity, softness,
    color1, color2, color3, color4,
  });
  paramsRef.current = {
    brushSize, brushStrength, fluidDecay, trailLength, stopDecay,
    distortionAmount, colorIntensity, softness,
    color1, color2, color3, color4,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;
    if (!gl) return;

    const halfFloatExt = gl.getExtension("EXT_color_buffer_half_float");
    const floatExt     = gl.getExtension("EXT_color_buffer_float");
    if (!halfFloatExt && !floatExt) {
      console.warn("[PolarisLiquidP] no float FBO extension — falling back to RGBA8");
    }

    /* ── shader plumbing ── */
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src.trim());
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(sh);
        console.error("[PolarisLiquidP] shader compile failed:", info || "(no log)");
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
        console.error("[PolarisLiquidP] link:", gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    };

    const vs    = compile(gl.VERTEX_SHADER, VS);
    const fsSim = compile(gl.FRAGMENT_SHADER, FS_SIM);
    const fsDsp = compile(gl.FRAGMENT_SHADER, FS_DISPLAY);
    if (!vs || !fsSim || !fsDsp) return;

    const progSim  = link(vs, fsSim);
    const progDisp = link(vs, fsDsp);
    if (!progSim || !progDisp) return;

    /* ── quad ── */
    const quad = new Float32Array([
      -1, -1,  1, -1, -1, 1,
      -1,  1,  1, -1,  1, 1,
    ]);
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const makeVao = (prog: WebGLProgram) => {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      return vao;
    };
    const vaoSim  = makeVao(progSim);
    const vaoDisp = makeVao(progDisp);

    /* ── uniform locs ── */
    const uS = {
      iTime:          gl.getUniformLocation(progSim, "iTime"),
      iRes:           gl.getUniformLocation(progSim, "iResolution"),
      iMouse:         gl.getUniformLocation(progSim, "iMouse"),
      iFrame:         gl.getUniformLocation(progSim, "iFrame"),
      iPrev:          gl.getUniformLocation(progSim, "iPreviousFrame"),
      uMask:          gl.getUniformLocation(progSim, "uMask"),
      uMaskScale:     gl.getUniformLocation(progSim, "uMaskScale"),
      uMaskOffset:    gl.getUniformLocation(progSim, "uMaskOffset"),
      uBrushSize:     gl.getUniformLocation(progSim, "uBrushSize"),
      uBrushStrength: gl.getUniformLocation(progSim, "uBrushStrength"),
      uFluidDecay:    gl.getUniformLocation(progSim, "uFluidDecay"),
      uTrailLength:   gl.getUniformLocation(progSim, "uTrailLength"),
      uStopDecay:     gl.getUniformLocation(progSim, "uStopDecay"),
    };
    const uD = {
      iTime:            gl.getUniformLocation(progDisp, "iTime"),
      iRes:             gl.getUniformLocation(progDisp, "iResolution"),
      iFluid:           gl.getUniformLocation(progDisp, "iFluid"),
      uMask:            gl.getUniformLocation(progDisp, "uMask"),
      uMaskScale:       gl.getUniformLocation(progDisp, "uMaskScale"),
      uMaskOffset:      gl.getUniformLocation(progDisp, "uMaskOffset"),
      uDistortionAmount:gl.getUniformLocation(progDisp, "uDistortionAmount"),
      uColor1:          gl.getUniformLocation(progDisp, "uColor1"),
      uColor2:          gl.getUniformLocation(progDisp, "uColor2"),
      uColor3:          gl.getUniformLocation(progDisp, "uColor3"),
      uColor4:          gl.getUniformLocation(progDisp, "uColor4"),
      uColorIntensity:  gl.getUniformLocation(progDisp, "uColorIntensity"),
      uSoftness:        gl.getUniformLocation(progDisp, "uSoftness"),
    };

    /* colour cache — refreshed on-demand when paramsRef points at new hex strings */
    let cKey = "";
    let c1: [number, number, number] = [0, 0, 0];
    let c2: [number, number, number] = [0, 0, 0];
    let c3: [number, number, number] = [0, 0, 0];
    let c4: [number, number, number] = [0, 0, 0];
    const refreshColours = () => {
      const p = paramsRef.current;
      const k = p.color1 + p.color2 + p.color3 + p.color4;
      if (k === cKey) return;
      cKey = k;
      c1 = hex(p.color1);
      c2 = hex(p.color2);
      c3 = hex(p.color3);
      c4 = hex(p.color4);
    };
    refreshColours();

    /* ── FBO ping-pong ── */
    const makeFbo = (w: number, h: number) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const useHalf = !!halfFloatExt || !!floatExt;
      if (useHalf) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fb };
    };

    let simW = 1, simH = 1;
    let fboA = makeFbo(2, 2);
    let fboB = makeFbo(2, 2);

    const resizeFbos = (w: number, h: number) => {
      simW = w; simH = h;
      const rebuild = (obj: { tex: WebGLTexture; fb: WebGLFramebuffer }) => {
        gl.deleteTexture(obj.tex);
        gl.deleteFramebuffer(obj.fb);
      };
      rebuild(fboA); rebuild(fboB);
      fboA = makeFbo(w, h);
      fboB = makeFbo(w, h);
      // Clear both to zero
      for (const f of [fboA, fboB]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    /* ── state ── */
    const state = {
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      imgW: 1, imgH: 1,
      time: 0,
      frame: 0,
      lastTime: performance.now(),
      // canvas-pixel mouse coords
      mouseX: -1e6, mouseY: -1e6,
      prevX: -1e6,  prevY: -1e6,
      // simulation-space mouse (scaled to simW/simH)
      simMouseX: -1e6, simMouseY: -1e6,
      simPrevX: -1e6,  simPrevY: -1e6,
      active: false,
    };

    let rafId = 0;
    let disposed = false;
    let maskTex: WebGLTexture | null = null;
    let alphaData: Uint8ClampedArray | null = null;

    const computeMaskTransform = () => {
      const cw = canvas.width, ch = canvas.height;
      if (!cw || !ch || !state.imgW || !state.imgH) return { sx: 1, sy: 1, ox: 0.5, oy: 0.5 };
      const canvasAspect = cw / ch;
      const imgAspect    = state.imgW / state.imgH;
      let sx = 1.0, sy = 1.0;
      if (canvasAspect > imgAspect) sx = imgAspect / canvasAspect;
      else                          sy = canvasAspect / imgAspect;
      return { sx, sy, ox: 0.5, oy: 0.5 };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width  = Math.floor(w * state.dpr);
      canvas.height = Math.floor(h * state.dpr);
      const sw = Math.max(64, Math.floor(canvas.width  * simScale));
      const sh = Math.max(64, Math.floor(canvas.height * simScale));
      resizeFbos(sw, sh);
      state.frame = 0; // reseed
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top)  / rect.height;
      const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
      if (!inside) { state.active = false; return; }

      // check mask alpha at the mapped stencil pixel
      if (!alphaData) { state.active = false; return; }
      const t = computeMaskTransform();
      const mx = (nx - 0.5) / t.sx + t.ox;
      const my = (ny - 0.5) / t.sy + t.oy;
      if (mx < 0 || mx > 1 || my < 0 || my > 1) { state.active = false; return; }
      const px = Math.floor(mx * state.imgW);
      const py = Math.floor(my * state.imgH);
      const idx = (py * state.imgW + px) * 4 + 3;
      const alpha = alphaData[idx] ?? 0;
      const nowInside = alpha > 32;

      if (!nowInside) {
        state.active = false;
        return;
      }

      // Convert canvas-pixel mouse into sim-space pixels
      const sx = nx * simW;
      const sy = (1 - ny) * simH; // Y inverted — texture y grows upward in our shader logic
      if (!state.active) {
        state.simPrevX = sx;
        state.simPrevY = sy;
      } else {
        state.simPrevX = state.simMouseX;
        state.simPrevY = state.simMouseY;
      }
      state.simMouseX = sx;
      state.simMouseY = sy;
      state.active = true;
    };

    const onLeave = () => { state.active = false; };

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (disposed) return;
      state.imgW = img.width;
      state.imgH = img.height;

      const off = document.createElement("canvas");
      off.width = img.width;
      off.height = img.height;
      const oc = off.getContext("2d");
      if (oc) {
        oc.drawImage(img, 0, 0);
        alphaData = oc.getImageData(0, 0, img.width, img.height).data;
      }

      maskTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      resize();

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
      window.addEventListener("resize", resize, { passive: true });

      if (reducedMotion) {
        drawOnce();
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };
    img.onerror = () => console.error("[PolarisLiquidP] mask load failed");
    img.src = stencilSrc;

    const drawSim = (writeFbo: WebGLFramebuffer, readTex: WebGLTexture) => {
      const t = computeMaskTransform();
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
      gl.viewport(0, 0, simW, simH);
      gl.disable(gl.BLEND);
      gl.useProgram(progSim);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(uS.iPrev, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(uS.uMask, 1);

      const p = paramsRef.current;
      gl.uniform1f(uS.iTime, state.time);
      gl.uniform2f(uS.iRes, simW, simH);
      gl.uniform1i(uS.iFrame, state.frame);
      gl.uniform2f(uS.uMaskScale, t.sx, t.sy);
      gl.uniform2f(uS.uMaskOffset, t.ox, t.oy);
      gl.uniform1f(uS.uBrushSize,     p.brushSize);
      gl.uniform1f(uS.uBrushStrength, p.brushStrength);
      gl.uniform1f(uS.uFluidDecay,    p.fluidDecay);
      gl.uniform1f(uS.uTrailLength,   p.trailLength);
      gl.uniform1f(uS.uStopDecay,     p.stopDecay);

      if (state.active) {
        gl.uniform4f(uS.iMouse, state.simMouseX, state.simMouseY, state.simPrevX, state.simPrevY);
      } else {
        gl.uniform4f(uS.iMouse, 0, 0, 0, 0);
      }

      gl.bindVertexArray(vaoSim);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    };

    const drawDisplay = (fluidTex: WebGLTexture) => {
      const t = computeMaskTransform();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(progDisp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fluidTex);
      gl.uniform1i(uD.iFluid, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(uD.uMask, 1);

      refreshColours();
      const p = paramsRef.current;
      gl.uniform1f(uD.iTime, state.time);
      gl.uniform2f(uD.iRes, canvas.width, canvas.height);
      gl.uniform2f(uD.uMaskScale, t.sx, t.sy);
      gl.uniform2f(uD.uMaskOffset, t.ox, t.oy);
      gl.uniform1f(uD.uDistortionAmount, p.distortionAmount);
      gl.uniform3f(uD.uColor1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uD.uColor2, c2[0], c2[1], c2[2]);
      gl.uniform3f(uD.uColor3, c3[0], c3[1], c3[2]);
      gl.uniform3f(uD.uColor4, c4[0], c4[1], c4[2]);
      gl.uniform1f(uD.uColorIntensity, p.colorIntensity);
      gl.uniform1f(uD.uSoftness, p.softness);

      gl.bindVertexArray(vaoDisp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    };

    const drawOnce = () => {
      drawSim(fboB.fb, fboA.tex);
      [fboA, fboB] = [fboB, fboA];
      drawDisplay(fboA.tex);
      state.frame++;
    };

    const loop = () => {
      const now = performance.now();
      const dt  = Math.min(0.033, (now - state.lastTime) / 1000);
      state.lastTime = now;
      state.time += dt;

      // decay "previous" toward "current" when inactive so the fluid coasts to rest.
      if (!state.active) {
        // no mouse input — fluid decays on its own via uFluidDecay
      } else {
        // ensure prev converges to curr each frame so instantaneous still shows motion
        // (real prev is captured on pointermove)
      }

      drawSim(fboB.fb, fboA.tex);
      [fboA, fboB] = [fboB, fboA];
      drawDisplay(fboA.tex);

      state.frame++;
      rafId = requestAnimationFrame(loop);
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      if (maskTex) gl.deleteTexture(maskTex);
      gl.deleteBuffer(quadBuf);
      gl.deleteVertexArray(vaoSim);
      gl.deleteVertexArray(vaoDisp);
      gl.deleteProgram(progSim);
      gl.deleteProgram(progDisp);
      gl.deleteShader(vs);
      gl.deleteShader(fsSim);
      gl.deleteShader(fsDsp);
      gl.deleteTexture(fboA.tex);
      gl.deleteTexture(fboB.tex);
      gl.deleteFramebuffer(fboA.fb);
      gl.deleteFramebuffer(fboB.fb);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
    // Only rebuild the pipeline if the stencil URL or the sim resolution scale
    // actually changes. All colours and sim params live in `paramsRef` and are
    // read live inside the draw loop, so theme swaps do NOT touch WebGL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stencilSrc, simScale]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block w-full h-full select-none ${className}`}
    />
  );
}

export default PolarisLiquidP;
