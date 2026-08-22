"use client";

import React, { useRef, useEffect } from "react";
import { useTheme } from "next-themes";

const geminiShaderSource = `#version 300 es
/*********
* Polaris Multi-Theme WebGL Shader
* 0 = Cosmic Obsidian (Purple/Red/Blue)
* 1 = Pink Aurora (Light Mode Pastel Clouds)
* 2 = Cyber Gold (Gold/Amber/Orange)
* 3 = Ocean Sapphire (Deep Blue/Cyan)
* 4 = Deep Emerald (Jade/Mint/Violet)
* 5 = Crimson Plasma (Ruby/Rose/Fire)
*/
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform int themeMode;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}

void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5,-st.y));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv;
		float d=length(p);

		// Dynamic theme color palette
		vec3 colorVec = cos(sin(i) * vec3(1.5, 0.4, 2.8)) + vec3(1.1, 0.5, 1.4);
		if (themeMode == 2) {
			// Cyber Gold (Amber & Gold)
			colorVec = cos(sin(i) * vec3(2.5, 1.2, 0.3)) + vec3(1.4, 0.9, 0.2);
		} else if (themeMode == 3) {
			// Ocean Sapphire (Deep Blue & Cyan)
			colorVec = cos(sin(i) * vec3(0.3, 1.5, 2.5)) + vec3(0.2, 0.8, 1.4);
		} else if (themeMode == 4) {
			// Deep Emerald (Jade & Mint)
			colorVec = cos(sin(i) * vec3(0.4, 2.5, 1.2)) + vec3(0.2, 1.3, 0.7);
		} else if (themeMode == 5) {
			// Crimson Plasma (Ruby & Fire)
			colorVec = cos(sin(i) * vec3(2.8, 0.3, 0.8)) + vec3(1.5, 0.3, 0.5);
		}

		col += .0014 / d * colorVec;
		float b = noise(i + p + bg * 1.731);
		col += .0025 * b / length(max(p, vec2(b * p.x * .02, p.y)));

		vec3 bgGlow = vec3(bg * 0.12, bg * 0.04, bg * 0.28);
		if (themeMode == 2) bgGlow = vec3(bg * 0.18, bg * 0.10, bg * 0.02);
		else if (themeMode == 3) bgGlow = vec3(bg * 0.02, bg * 0.10, bg * 0.22);
		else if (themeMode == 4) bgGlow = vec3(bg * 0.02, bg * 0.18, bg * 0.08);
		else if (themeMode == 5) bgGlow = vec3(bg * 0.22, bg * 0.02, bg * 0.06);

		col = mix(col, bgGlow, d);
	}

	if (themeMode == 1) {
		// Light Mode Pink Aurora
		vec3 skyBase = mix(vec3(0.98, 0.92, 0.95), vec3(0.95, 0.88, 0.96), st.y * 0.5 + 0.5);
		vec3 pinkSwirl = vec3(col.r * 1.1 + 0.2, col.g * 0.3 + 0.1, col.b * 0.7 + 0.3);
		vec3 cloudTint = mix(skyBase, vec3(0.98, 0.70, 0.85), bg * 0.6);
		vec3 finalCol = cloudTint + pinkSwirl * 0.35;
		O = vec4(finalCol, 1);
	} else {
		O = vec4(col, 1);
	}
}`;

export interface AnimatedShaderCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedShaderCard({
  children,
  className = "",
}: AnimatedShaderCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, resolvedTheme } = useTheme();

  let themeModeCode = 0; // default dark (Cosmic Obsidian)
  const activeTheme = theme || resolvedTheme;
  if (activeTheme === "light") themeModeCode = 1;
  else if (activeTheme === "theme-gold") themeModeCode = 2;
  else if (activeTheme === "theme-sapphire") themeModeCode = 3;
  else if (activeTheme === "theme-emerald") themeModeCode = 4;
  else if (activeTheme === "theme-crimson") themeModeCode = 5;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const vertexSrc = `#version 300 es
    precision highp float;
    in vec4 position;
    void main(){gl_Position=position;}`;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, geminiShaderSource);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, "resolution");
    const timeLoc = gl.getUniformLocation(program, "time");
    const themeLoc = gl.getUniformLocation(program, "themeMode");

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 300;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    let animationFrameId: number;
    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const now = performance.now() * 1e-3;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      if (resLoc) gl.uniform2f(resLoc, canvas.width, canvas.height);
      if (timeLoc) gl.uniform1f(timeLoc, now);
      if (themeLoc) gl.uniform1i(themeLoc, themeModeCode);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [themeModeCode]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl group transition-all duration-500 hover:border-[#2BA648]/40 hover:shadow-[0_25px_70px_-10px_rgba(43,166,72,0.3)] ${className}`}
    >
      {/* Exact Landing Page WebGL2 Shader Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-85 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Dark Luxury Vignette & Glass Blur Overlay for 100% Text Legibility */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] z-[1] pointer-events-none" />

      {/* Top Subtle Bevel Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#2BA648]/70 to-transparent group-hover:via-white transition-all duration-500 z-[2]" />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
