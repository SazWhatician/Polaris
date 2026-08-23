"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Move3d, Loader2 } from "lucide-react";

interface ReactorFooterProps {
  /** Custom 3D model URL (e.g. "/models/bouche_a_levres.glb") */
  customModelUrl?: string;
  /** Scale factor for custom 3D model (default: 1.0) */
  modelScale?: number;
}

export function ReactorFooter({
  customModelUrl = "/models/bouche_a_levres.glb",
  modelScale = 1.0,
}: ReactorFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const canvasEl = canvasContainerRef.current;
    const footerEl = footerRef.current;
    const contentEl = contentContainerRef.current;

    if (!canvasEl || !footerEl || !contentEl) return;

    const getWidth = () => footerEl.clientWidth || window.innerWidth;
    const getHeight = () => footerEl.clientHeight || window.innerHeight || 800;

    let width = getWidth();
    let height = getHeight();

    // 1. Scene & WebGL Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 4.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    canvasEl.innerHTML = "";
    canvasEl.appendChild(renderer.domElement);

    // 2. Passive OrbitControls — no user interaction, just autorotation.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.enableRotate = false;
    controls.enableZoom   = false;
    controls.enablePan    = false;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 3. Studio PBR Lighting Setup for High Contrast & Definition
    // Soft ambient for base visibility without washing out shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Key directional light (Clean Cool White from top-right)
    const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.6);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    // Fill light (Soft Neutral from left)
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.5);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    // Polaris Emerald Rim Light (Backlighting to create sharp glowing silhouettes)
    const rimLight = new THREE.DirectionalLight(0x10b981, 3.4);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Cyan Bottom Bounce Light for rich underside highlights
    const bottomLight = new THREE.DirectionalLight(0x06b6d4, 1.6);
    bottomLight.position.set(0, -3, 2);
    scene.add(bottomLight);

    // 4. 3D Model Root Group
    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0, 0);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Glowing core point light
    const corePointLight = new THREE.PointLight(0x10b981, 2.0, 15);
    corePointLight.position.set(0, 0, 0);
    modelGroup.add(corePointLight);

    let innerMesh: THREE.Object3D | null = null;
    let outerCage: THREE.Mesh | null = null;

    if (customModelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        customModelUrl,
        (gltf) => {
          const model = gltf.scene;

          // Apply high-contrast metallic titanium shader with emerald specular response
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              const prevMat = mesh.material as THREE.MeshStandardMaterial;
              if (prevMat && prevMat.map) {
                // If model has texture map, keep textures and enhance PBR response
                prevMat.roughness = 0.28;
                prevMat.metalness = 0.65;
                prevMat.needsUpdate = true;
              } else {
                // Cyber titanium material: sharp specular highlights, deep shadows, crisp definition
                mesh.material = new THREE.MeshStandardMaterial({
                  color: new THREE.Color("#94a3b8"), // sleek titanium silver
                  roughness: 0.22,
                  metalness: 0.85,
                  emissive: new THREE.Color("#064e3b"), // deep emerald core glow
                  emissiveIntensity: 0.15,
                  side: THREE.DoubleSide,
                });
              }
            }
          });

          // Auto-Fit Bounding Box & Center
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scaleFactor = (3.6 / maxDim) * modelScale;

          model.position.sub(center.multiplyScalar(scaleFactor));
          model.scale.setScalar(scaleFactor);

          innerMesh = model;
          modelGroup.add(model);
          setIsLoading(false);
        },
        (xhr) => {
          if (xhr.total > 0) {
            setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (error) => {
          console.warn("Failed to load custom 3D model, falling back to reactor crystal:", error);
          createDefaultCrystal();
          setIsLoading(false);
        }
      );
    } else {
      createDefaultCrystal();
      setIsLoading(false);
    }

    function createDefaultCrystal() {
      const innerGeo = new THREE.OctahedronGeometry(1.2, 0);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x064e3b,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.85,
      });
      const crystal = new THREE.Mesh(innerGeo, innerMat);
      innerMesh = crystal;
      modelGroup.add(crystal);

      const outerGeo = new THREE.IcosahedronGeometry(1.6, 0);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      outerCage = new THREE.Mesh(outerGeo, outerMat);
      modelGroup.add(outerCage);
    }

    // Floating Stardust Particles (600 Points)
    const particleCount = 600;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 14;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.022,
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    modelGroup.add(particles);

    // 5. GSAP Parallax ScrollTrigger
    let scrollProgress = 0;
    gsap.set(contentEl, { yPercent: 0, opacity: 1 });

    const trigger = ScrollTrigger.create({
      trigger: footerEl,
      start: "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollProgress = self.progress;
        gsap.set(contentEl, {
          yPercent: -6 * (1 - scrollProgress),
          opacity: 0.6 + 0.4 * scrollProgress,
        });
      },
    });

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    // 6. Resize Handler
    const handleResize = () => {
      if (!canvasEl || !footerEl) return;
      width = getWidth();
      height = getHeight();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(footerEl);

    // 7. 60fps Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      // Update Orbit Controls with damping
      controls.update();

      if (outerCage) {
        outerCage.rotation.y -= 0.004;
        outerCage.rotation.z += 0.002;
      }

      particles.rotation.y += 0.0008;
      particles.rotation.x = Math.sin(time * 0.4) * 0.04;

      if (innerMesh) {
        innerMesh.position.y = Math.sin(time * 1.5) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Cleanup on Unmount
    return () => {
      clearTimeout(refreshTimer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      trigger.kill();

      controls.dispose();
      renderer.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();

      if (canvasEl.contains(renderer.domElement)) {
        canvasEl.removeChild(renderer.domElement);
      }
    };
  }, [customModelUrl, modelScale]);

  return (
    <div className="relative z-20 w-full min-h-screen bg-black overflow-hidden select-none flex flex-col justify-between">
      <footer
        ref={footerRef}
        className="reactor-zone relative z-20 w-full min-h-screen overflow-hidden bg-black flex flex-col justify-between"
      >
        {/* 3D Canvas Layer — purely decorative, non-interactive */}
        <div
          id="footer-canvas"
          ref={canvasContainerRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none transition-opacity duration-500">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 shadow-2xl">
              <Loader2 className="w-5 h-5 text-[#2BA648] animate-spin" />
              <span className="text-xs font-mono text-white/80 tracking-wider">
                Loading 3D Chamber {loadProgress > 0 ? `(${loadProgress}%)` : "..."}
              </span>
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div
          ref={contentContainerRef}
          className="relative w-full min-h-screen flex flex-col justify-between p-8 sm:p-14 lg:p-20 pointer-events-none z-10"
        >
          {/* Top Section: ENIGMA Connect With Us + Socials + Menu */}
          <div className="w-full pt-10 sm:pt-14 flex flex-col md:flex-row items-start justify-between gap-10 pointer-events-none">
            {/* Left: Giant Heading */}
            <div className="pointer-events-auto">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tighter uppercase leading-none">
                connect<br />WITH<br />US
              </h1>
            </div>

            {/* Right: Socials & Menu */}
            <div className="flex gap-12 sm:gap-24 pointer-events-auto">
              {/* Socials Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="text-base sm:text-xl font-normal text-slate-400 uppercase tracking-wider mb-2">
                  SOCIALS
                </h3>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  INSTAGRAM
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  X
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  LINKEDIN
                </a>
              </div>

              {/* Menu Column */}
              <div className="flex flex-col gap-3 text-right">
                <h3 className="text-base sm:text-xl font-normal text-slate-400 uppercase tracking-wider mb-2">
                  MENU
                </h3>
                <Link
                  href="/"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  HOME
                </Link>
                <Link
                  href="/dashboard"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  WORKSPACE
                </Link>
                <Link
                  href="/login"
                  className="text-xl sm:text-3xl font-light text-white hover:text-[#2BA648] transition-colors"
                >
                  CONTACT
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="w-full pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50 border-t border-white/10 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-2">
                <Move3d className="w-3.5 h-3.5 text-[#2BA648]" />
                <span className="text-[10px] tracking-widest uppercase">3D CORE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2BA648] animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase">
              <div className="relative h-6 w-28 sm:w-36 opacity-80 hover:opacity-100 transition-opacity">
                <Image
                  src="/polaris-monochrome.png"
                  alt="Polaris Logo"
                  fill
                  className="object-contain invert"
                />
              </div>
              <span className="hidden sm:inline border-l border-white/20 pl-3">
                MADE WITH LOVE <span className="text-[#2BA648] font-bold">POLARIS.</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
