"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// --- GLSL Shaders ---

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fluidShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec4 iMouse;
uniform int iFrame;
uniform sampler2D iPreviousFrame;
uniform float uBrushSize;
uniform float uBrushStrength;
uniform float uFluidDecay;
uniform float uTrailLength;
uniform float uStopDecay;

varying vec2 vUv;

vec2 ur, U;

float ln(vec2 p, vec2 a, vec2 b) {
    return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
}

vec4 t(vec2 v, int a, int b) {
    return texture2D(iPreviousFrame, fract((v+vec2(float(a),float(b)))/ur));
}

vec4 t(vec2 v) {
    return texture2D(iPreviousFrame, fract(v/ur));
}

float area(vec2 a, vec2 b, vec2 c) {
    float A = length(b-c), B = length(c-a), C = length(a-b), s = 0.5*(A+B+C);
    return sqrt(s*(s-A)*(s-B)*(s-C));
}

void main() {
    U = vUv * iResolution;
    ur = iResolution.xy;

    if (iFrame < 1) {
        float w = 0.5+sin(0.2*U.x)*0.5;
        float q = length(U-0.5*ur);
        gl_FragColor = vec4(0.1*exp(-0.001*q*q),0,0,w);
    } else {
        vec2 v = U,
        A = v + vec2( 1, 1),
        B = v + vec2( 1,-1),
        C = v + vec2(-1, 1),
        D = v + vec2(-1,-1);

        for (int i = 0; i < 8; i++) {
            v -= t(v).xy;
            A -= t(A).xy;
            B -= t(B).xy;
            C -= t(C).xy;
            D -= t(D).xy;
        }

        vec4 me = t(v);
        vec4 n = t(v, 0, 1),
        e = t(v, 1, 0),
        s = t(v, 0,-1),
        w = t(v,-1, 0);

        vec4 ne = .25*(n+e+s+w);
        me = mix(t(v), ne, vec4(0.15,0.15,0.95,0.));
        me.z = me.z - 0.01*((area(A,B,C)+area(B,C,D))-4.);

        vec4 pr = vec4(e.z,w.z,n.z,s.z);
        me.xy = me.xy + 100.*vec2(pr.x-pr.y, pr.z-pr.w)/ur;

        me.xy *= uFluidDecay;
        me.z *= uTrailLength;

        if (iMouse.z > 0.0) {
            vec2 mousePos = iMouse.xy;
            vec2 mousePrev = iMouse.zw;
            vec2 mouseVel = mousePos - mousePrev;
            float velMagnitude = length(mouseVel);
            float q = ln(U, mousePos, mousePrev);
            vec2 m = mousePos - mousePrev;
            float l = length(m);
            if (l > 0.0) m = min(l, 10.0) * m / l;

            float brushSizeFactor = 1e-4 / uBrushSize;
            float strengthFactor = 0.03 * uBrushStrength;

            float falloff = exp(-brushSizeFactor*q*q*q);
            falloff = pow(falloff, 0.5);

            me.xyw += strengthFactor * falloff * vec3(m, 10.);
            if (velMagnitude < 2.0) {
                float distToCursor = length(U - mousePos);
                float influence = exp(-distToCursor * 0.01);
                float cursorDecay = mix(1.0, uStopDecay, influence);
                me.xy *= cursorDecay;
                me.z *= cursorDecay;
            }
        }

        gl_FragColor = clamp(me, -0.4, 0.4);
    }
}
`;

const displayShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform sampler2D iFluid;
uniform float uDistortionAmount;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform float uColorIntensity;
uniform float uSoftness;

varying vec2 vUv;

void main() {
    vec2 fragCoord = vUv * iResolution;

    vec4 fluid = texture2D(iFluid, vUv);
    vec2 fluidVel = fluid.xy;

    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mr;

    uv += fluidVel * (0.5 * uDistortionAmount);

    float d = -iTime * 0.5;
    float a = 0.0;
    for (float i = 0.0; i < 8.0; ++i) {
        a += cos(i - d - a * uv.x);
        d += sin(uv.y * i + a);
    }
    d += iTime * 0.5;

    float mixer1 = cos(uv.x * d) * 0.5 + 0.5;
    float mixer2 = cos(uv.y * a) * 0.5 + 0.5;
    float mixer3 = sin(d + a) * 0.5 + 0.5;

    float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);
    mixer1 = mix(mixer1, 0.5, smoothAmount);
    mixer2 = mix(mixer2, 0.5, smoothAmount);
    mixer3 = mix(mixer3, 0.5, smoothAmount);

    vec3 col = mix(uColor1, uColor2, mixer1);
    col = mix(col, uColor3, mixer2);
    col = mix(col, uColor4, mixer3 * 0.4);

    col *= uColorIntensity;

    gl_FragColor = vec4(col, 1.0);
}
`;

// --- Config: Polaris dark indigo/purple palette ---

const config = {
  brushSize: 25.0,
  brushStrength: 0.5,
  distortionAmount: 2.5,
  fluidDecay: 0.98,
  trailLength: 0.8,
  stopDecay: 0.85,
  color1: "#ff0000ff",   // pure black base
  color2: "#180b59ff",   // deep indigo
  color3: "#1a0a3e",   // dark purple
  color4: "#c93e17ff",   // near-black violet
  colorIntensity: 1.0,
  softness: 1.0,
};

function hexToVec3(hex: string): THREE.Vector3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new THREE.Vector3(r, g, b);
}

export function ShaderBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Ping-pong render targets
    const rtParams: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    let fluidTarget1 = new THREE.WebGLRenderTarget(width, height, rtParams);
    let fluidTarget2 = new THREE.WebGLRenderTarget(width, height, rtParams);
    let currentTarget = fluidTarget1;
    let previousTarget = fluidTarget2;
    let frameCount = 0;

    // Fluid simulation material
    const fluidMat = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        iFrame: { value: 0 },
        iPreviousFrame: { value: null },
        uBrushSize: { value: config.brushSize },
        uBrushStrength: { value: config.brushStrength },
        uFluidDecay: { value: config.fluidDecay },
        uTrailLength: { value: config.trailLength },
        uStopDecay: { value: config.stopDecay },
      },
      vertexShader,
      fragmentShader: fluidShader,
    });

    // Display material
    const displayMat = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iFluid: { value: null },
        uDistortionAmount: { value: config.distortionAmount },
        uColor1: { value: hexToVec3(config.color1) },
        uColor2: { value: hexToVec3(config.color2) },
        uColor3: { value: hexToVec3(config.color3) },
        uColor4: { value: hexToVec3(config.color4) },
        uColorIntensity: { value: config.colorIntensity },
        uSoftness: { value: config.softness },
      },
      vertexShader,
      fragmentShader: displayShader,
    });

    const fluidMesh = new THREE.Mesh(geometry, fluidMat);
    const displayMesh = new THREE.Mesh(geometry, displayMat);

    // Mouse state
    let mouseX = 0, mouseY = 0, prevMouseX = 0, prevMouseY = 0;
    let lastMoveTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
      lastMoveTime = performance.now();
      fluidMat.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
    };

    const onMouseLeave = () => {
      fluidMat.uniforms.iMouse.value.set(0, 0, 0, 0);
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      fluidMat.uniforms.iResolution.value.set(width, height);
      displayMat.uniforms.iResolution.value.set(width, height);
      fluidTarget1.setSize(width, height);
      fluidTarget2.setSize(width, height);
      frameCount = 0;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    container.addEventListener("mouseleave", onMouseLeave);

    let rafId: number;

    const render = () => {
      rafId = requestAnimationFrame(render);
      const time = performance.now() * 0.001;

      fluidMat.uniforms.iTime.value = time;
      displayMat.uniforms.iTime.value = time;
      fluidMat.uniforms.iFrame.value = frameCount;

      // Decay mouse if idle
      if (performance.now() - lastMoveTime > 100) {
        fluidMat.uniforms.iMouse.value.set(0, 0, 0, 0);
      }

      // Fluid simulation pass → FBO
      fluidMat.uniforms.iPreviousFrame.value = previousTarget.texture;
      renderer.setRenderTarget(currentTarget);
      renderer.render(fluidMesh, camera);

      // Display pass → screen
      displayMat.uniforms.iFluid.value = currentTarget.texture;
      renderer.setRenderTarget(null);
      renderer.render(displayMesh, camera);

      // Swap ping-pong
      const tmp = currentTarget;
      currentTarget = previousTarget;
      previousTarget = tmp;
      frameCount++;
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mouseleave", onMouseLeave);
      renderer.dispose();
      fluidTarget1.dispose();
      fluidTarget2.dispose();
      geometry.dispose();
      fluidMat.dispose();
      displayMat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen z-0"
      style={{ pointerEvents: "auto" }}
    />
  );
}
