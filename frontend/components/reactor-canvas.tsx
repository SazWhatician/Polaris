"use client";

import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

export type ModelColorway =
  | "emerald"
  | "amethyst"
  | "cyan"
  | "gold"
  | "crimson"
  | "chrome"
  | "aurora";

export interface ColorwayConfig {
  id: ModelColorway;
  label: string;
  dotColor: string;
  modelColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  rimColor: number;
  bottomColor: number;
  coreLightColor: number;
  particleColor: number;
}

export const MODEL_COLORWAYS: Record<ModelColorway, ColorwayConfig> = {
  emerald: {
    id: "emerald",
    label: "Cyber Emerald",
    dotColor: "#10b981",
    modelColor: "#94a3b8",
    emissiveColor: "#064e3b",
    emissiveIntensity: 0.28,
    roughness: 0.22,
    metalness: 0.85,
    rimColor: 0x10b981,
    bottomColor: 0x06b6d4,
    coreLightColor: 0x10b981,
    particleColor: 0x6ee7b7,
  },
  amethyst: {
    id: "amethyst",
    label: "Cosmic Amethyst",
    dotColor: "#a855f7",
    modelColor: "#475569",
    emissiveColor: "#581c87",
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.9,
    rimColor: 0xc084fc,
    bottomColor: 0xe879f9,
    coreLightColor: 0x9333ea,
    particleColor: 0xd8b4fe,
  },
  cyan: {
    id: "cyan",
    label: "Arctic Neon",
    dotColor: "#06b6d4",
    modelColor: "#64748b",
    emissiveColor: "#083344",
    emissiveIntensity: 0.32,
    roughness: 0.18,
    metalness: 0.88,
    rimColor: 0x22d3ee,
    bottomColor: 0x38bdf8,
    coreLightColor: 0x06b6d4,
    particleColor: 0xa5f3fc,
  },
  gold: {
    id: "gold",
    label: "Solar Gold",
    dotColor: "#f59e0b",
    modelColor: "#ca8a04",
    emissiveColor: "#78350f",
    emissiveIntensity: 0.3,
    roughness: 0.24,
    metalness: 0.92,
    rimColor: 0xfbbf24,
    bottomColor: 0xf97316,
    coreLightColor: 0xf59e0b,
    particleColor: 0xfde68a,
  },
  crimson: {
    id: "crimson",
    label: "Reactor Ruby",
    dotColor: "#f43f5e",
    modelColor: "#334155",
    emissiveColor: "#881337",
    emissiveIntensity: 0.38,
    roughness: 0.2,
    metalness: 0.9,
    rimColor: 0xf43f5e,
    bottomColor: 0xbe123c,
    coreLightColor: 0xf43f5e,
    particleColor: 0xfda4af,
  },
  chrome: {
    id: "chrome",
    label: "Chrome Mirror",
    dotColor: "#e2e8f0",
    modelColor: "#f8fafc",
    emissiveColor: "#0f172a",
    emissiveIntensity: 0.15,
    roughness: 0.08,
    metalness: 0.98,
    rimColor: 0xffffff,
    bottomColor: 0x94a3b8,
    coreLightColor: 0xe2e8f0,
    particleColor: 0xffffff,
  },
  aurora: {
    id: "aurora",
    label: "Prism Shift",
    dotColor: "#ec4899",
    modelColor: "#cbd5e1",
    emissiveColor: "#4338ca",
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.9,
    rimColor: 0x818cf8,
    bottomColor: 0x34d399,
    coreLightColor: 0xf472b6,
    particleColor: 0xfbcfe8,
  },
};

// --- Particles Field ---
function StardustParticles({ color }: { color: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 600;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 14;
    }
    return [pos];
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    pointsRef.current.rotation.y += 0.0008;
    pointsRef.current.rotation.x = Math.sin(time * 0.4) * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color={color}
        transparent
        opacity={0.65}
      />
    </points>
  );
}

// --- Default Crystal Geometric Fallback ---
function DefaultCrystal({ config }: { config: ColorwayConfig }) {
  const cageRef = useRef<THREE.Mesh>(null);
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (cageRef.current) {
      cageRef.current.rotation.y -= 0.004;
      cageRef.current.rotation.z += 0.002;
    }
    if (crystalRef.current) {
      crystalRef.current.position.y = Math.sin(time * 1.5) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={crystalRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={config.modelColor}
          emissive={config.emissiveColor}
          emissiveIntensity={config.emissiveIntensity}
          roughness={config.roughness}
          metalness={config.metalness}
        />
      </mesh>
      <mesh ref={cageRef}>
        <icosahedronGeometry args={[1.6, 0]} />
        <meshBasicMaterial
          color={config.rimColor}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

// --- GLTF Model Mesh with Live PBR Materials ---
function GLTFModelMesh({
  url,
  config,
  scale = 1.0,
  onLoaded,
}: {
  url: string;
  config: ColorwayConfig;
  scale?: number;
  onLoaded?: () => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Clone scene so multiple instances don't mutate each other and attach materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const mats: THREE.MeshStandardMaterial[] = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(config.modelColor),
          roughness: config.roughness,
          metalness: config.metalness,
          emissive: new THREE.Color(config.emissiveColor),
          emissiveIntensity: config.emissiveIntensity,
          side: THREE.DoubleSide,
        });
        mesh.material = mat;
        mats.push(mat);
      }
    });

    materialsRef.current = mats;
    onLoaded?.();
    return clone;
  }, [scene, config, onLoaded]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.05;
    }

    if (config.id === "aurora") {
      const hue = (time * 0.15) % 1.0;
      const color = new THREE.Color().setHSL(hue, 0.85, 0.55);
      const emissive = new THREE.Color().setHSL((hue + 0.5) % 1.0, 0.9, 0.25);

      materialsRef.current.forEach((mat) => {
        mat.emissive.copy(emissive);
        mat.color.copy(color);
      });
    }
  });

  return (
    <group ref={groupRef}>
      <Center scale={scale * 1.1}>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

// Preload the model asset
useGLTF.preload("/models/bouche_a_levres.glb");

export interface ReactorCanvasProps {
  customModelUrl?: string;
  modelScale?: number;
  colorway?: ModelColorway;
  onLoaded?: () => void;
}

export function ReactorCanvas({
  customModelUrl = "/models/bouche_a_levres.glb",
  modelScale = 1.0,
  colorway = "emerald",
  onLoaded,
}: ReactorCanvasProps) {
  const config = MODEL_COLORWAYS[colorway] || MODEL_COLORWAYS.emerald;

  return (
    <Canvas
      camera={{ position: [0, 0.2, 4.2], fov: 50 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      dpr={[1, 1.5]}
      className="w-full h-full"
    >
      <fogExp2 attach="fog" args={[0x000000, 0.025]} />

      {/* Studio PBR Lighting Setup */}
      <ambientLight intensity={1.0} color={0xffffff} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} color={0xf8fafc} />
      <directionalLight position={[-4, 2, 3]} intensity={1.5} color={0x94a3b8} />
      <directionalLight position={[0, 4, -4]} intensity={3.4} color={config.rimColor} />
      <directionalLight position={[0, -3, 2]} intensity={1.6} color={config.bottomColor} />
      <pointLight position={[0, 0, 0]} intensity={2.0} distance={15} color={config.coreLightColor} />

      {/* Model & Floating Particles */}
      <Suspense fallback={<DefaultCrystal config={config} />}>
        {customModelUrl ? (
          <GLTFModelMesh
            url={customModelUrl}
            config={config}
            scale={modelScale}
            onLoaded={onLoaded}
          />
        ) : (
          <DefaultCrystal config={config} />
        )}
      </Suspense>

      <StardustParticles color={config.particleColor} />

      {/* Passive Controls with auto rotation */}
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        autoRotate
        autoRotateSpeed={1.1}
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
  );
}

export default ReactorCanvas;
