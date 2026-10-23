"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere, Line, Ring } from "@react-three/drei";
import * as THREE from "three";
import type { CandidateSite } from "@/lib/types";
import { getSubSolarPoint, getSubEarthPoint, toJulianDate } from "@/lib/astronomical";

// ─── Shared Types ────────────────────────────────────────────────────────────

export type CameraMode = "system" | "southPole" | "siteA" | "siteB";

interface SceneProps {
  cameraMode: CameraMode;
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  currentDate: Date;
  isSunVisibleA: boolean;
  isSunVisibleB: boolean;
  isEarthVisibleA: boolean;
  isEarthVisibleB: boolean;
  onSiteClick?: (site: CandidateSite, slot: "A" | "B") => void;
  sites: CandidateSite[];
}

// ─── Scale constants ──────────────────────────────────────────────────────────
const EARTH_RADIUS = 1.0;
const MOON_RADIUS = 0.32;
const SUN_RADIUS = 3.6;
const AU = 55; // Scaled AU in world units
const MOON_ORBIT_RADIUS = 8.5;
const SUN_POS = new THREE.Vector3(-AU, 0, 0);

// Convert lunar lat/lon to 3D point on the Moon sphere surface
export function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Procedural Lunar Surface Texture ─────────────────────────────────────────
function createProceduralLunarTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(new OffscreenCanvas(64, 32) as unknown as HTMLCanvasElement);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Base lunar anorthositic highlands (medium-bright slate gray)
  ctx.fillStyle = "#8a94a6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Multi-octave highlands noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const nx = x / 1024;
      const ny = y / 512;
      const n1 = Math.sin(nx * 32) * Math.cos(ny * 24);
      const n2 = Math.sin(nx * 64 + ny * 64) * 0.5;
      const noise = (n1 + n2) * 16;
      data[idx] = Math.max(80, Math.min(180, data[idx] + noise));
      data[idx + 1] = Math.max(85, Math.min(185, data[idx + 1] + noise));
      data[idx + 2] = Math.max(95, Math.min(195, data[idx + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Basaltic Lunar Maria (Dark smooth lava plains on near side)
  const drawMare = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.filter = "blur(12px)";
    ctx.fill();
    ctx.restore();
  };

  // Near side is around x = 512 (0° longitude)
  // Oceanus Procellarum & Mare Imbrium
  drawMare(450, 180, 80, 70, "#3a4150");
  drawMare(490, 170, 55, 45, "#323946");
  // Mare Serenitatis & Tranquillitatis
  drawMare(560, 200, 45, 40, "#333b49");
  drawMare(580, 240, 50, 42, "#373e4d");
  // Mare Crisium (Distinct circular dark basin in NE limb)
  drawMare(680, 200, 32, 28, "#2e3542");
  // South Pole - Aitken Basin (far side / south polar depression)
  drawMare(512, 460, 120, 40, "#3f4654");

  // 4. Prominent Craters (bright rays and ejecta blankets)
  const drawCrater = (x: number, y: number, r: number, name?: string) => {
    ctx.save();
    // Bright ejecta halo
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(230, 238, 255, 0.12)";
    ctx.filter = "blur(4px)";
    ctx.fill();

    // Crater rim
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#a8b3c5";
    ctx.fill();

    // Crater shadow/floor
    ctx.beginPath();
    ctx.arc(x + r * 0.18, y + r * 0.18, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = "#252b36";
    ctx.fill();
    ctx.restore();
  };

  // Tycho
  drawCrater(470, 360, 12, "Tycho");
  // Copernicus
  drawCrater(460, 215, 10, "Copernicus");
  // Kepler
  drawCrater(400, 220, 6, "Kepler");
  // Shackleton (exact south pole near y = 508)
  drawCrater(512, 505, 8, "Shackleton");

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ─── Sun Object with Corona Glow ─────────────────────────────────────────────
function SunObject() {
  const coronaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coronaRef.current) {
      const s = 1 + 0.04 * Math.sin(clock.elapsedTime * 2);
      coronaRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={SUN_POS}>
      {/* Sun Core */}
      <Sphere args={[SUN_RADIUS, 32, 32]}>
        <meshBasicMaterial color="#FFFAED" />
      </Sphere>
      {/* Volumetric Corona Pulses */}
      <Sphere args={[SUN_RADIUS * 1.15, 32, 32]} ref={coronaRef}>
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.25} />
      </Sphere>
      <Sphere args={[SUN_RADIUS * 1.45, 32, 32]}>
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.08} />
      </Sphere>
      {/* Directional sunlight beam toward origin */}
      <pointLight intensity={6.5} distance={1500} color="#FFF8E7" castShadow={false} />
    </group>
  );
}

// ─── Earth Orbit Path ─────────────────────────────────────────────────────────
function OrbitPath({ radius, color = "#1e3a5f" }: { radius: number; color?: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  return <Line points={points} color={color} lineWidth={0.8} transparent opacity={0.35} />;
}

// ─── Earth Object ─────────────────────────────────────────────────────────────
function EarthObject() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.08;
  });

  return (
    <group ref={ref}>
      {/* Ocean Core */}
      <Sphere args={[EARTH_RADIUS, 48, 48]}>
        <meshStandardMaterial
          color="#1b4974"
          emissive="#0b1e32"
          emissiveIntensity={0.4}
          roughness={0.7}
          metalness={0.1}
        />
      </Sphere>
      {/* Atmosphere Rim Shader */}
      <Sphere args={[EARTH_RADIUS * 1.05, 48, 48]}>
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.18}
          roughness={1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

// ─── 3D Lunar Sphere with LOLA Rings & Beacons ───────────────────────────────
function MoonGlobe({
  position,
  sites,
  selectedSiteA,
  selectedSiteB,
  onSiteClick,
  lunarTexture,
}: {
  position: THREE.Vector3;
  sites: CandidateSite[];
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSiteClick?: (site: CandidateSite, slot: "A" | "B") => void;
  lunarTexture: THREE.CanvasTexture;
}) {
  return (
    <group position={position}>
      {/* Textured Moon Sphere */}
      <Sphere args={[MOON_RADIUS, 64, 64]}>
        <meshStandardMaterial
          map={lunarTexture}
          roughness={0.94}
          metalness={0.02}
          bumpScale={0.03}
        />
      </Sphere>

      {/* Candidate Site Beacons & LOLA Terrain Rings */}
      {sites.map((site) => {
        const isA = site.id === selectedSiteA.id;
        const isB = site.id === selectedSiteB.id;
        const surfacePos = latLonToVec3(site.latitude, site.longitude, MOON_RADIUS * 1.015);
        const normal = surfacePos.clone().normalize();

        const color = isA ? "#F59E0B" : isB ? "#38BDF8" : "#94A3B8";
        const ringColor = isA ? "rgba(245, 158, 11, 0.4)" : isB ? "rgba(56, 189, 248, 0.4)" : "rgba(148, 163, 184, 0.15)";

        // Compute quaternion to orient ring tangent to surface
        const ringQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

        return (
          <group key={site.id} position={surfacePos}>
            {/* Pulsing Beacon Core */}
            <Sphere
              args={[isA || isB ? 0.012 : 0.007, 12, 12]}
              onClick={(e) => {
                e.stopPropagation();
                if (onSiteClick) onSiteClick(site, isA ? "B" : "A");
              }}
            >
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
            </Sphere>

            {/* 3D LOLA Terrain Elevation Ring (Horizontal terrain mask circle) */}
            <mesh quaternion={ringQuat}>
              <ringGeometry args={[0.018, 0.022, 32]} />
              <meshBasicMaterial color={color} transparent opacity={isA || isB ? 0.7 : 0.25} side={THREE.DoubleSide} />
            </mesh>

            {/* Pulsing Outer Shield for Selected Sites */}
            {(isA || isB) && (
              <mesh quaternion={ringQuat}>
                <ringGeometry args={[0.032, 0.035, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D Raycast Vector (Line-of-Sight Beam) ───────────────────────────────────
function RaycastLoSBeam({
  from,
  to,
  clearColor,
  isVisible,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  clearColor: string;
  isVisible: boolean;
}) {
  if (!isVisible) {
    // Blocked by terrain: Dashed red line
    return (
      <Line
        points={[from, to]}
        color="#EF4444"
        lineWidth={1.2}
        dashed
        dashSize={1.2}
        dashOffset={0}
        gapSize={0.8}
        transparent
        opacity={0.65}
      />
    );
  }

  // Clear LoS: Solid glowing ray
  return (
    <Line
      points={[from, to]}
      color={clearColor}
      lineWidth={1.6}
      transparent
      opacity={0.8}
    />
  );
}

// ─── Camera Controller with Fly-To Lerp ───────────────────────────────────────
function CameraFlightController({
  mode,
  selectedSiteA,
  selectedSiteB,
  moonPos,
}: {
  mode: CameraMode;
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  moonPos: THREE.Vector3;
}) {
  const { camera } = useThree();

  useEffect(() => {
    let targetPos: THREE.Vector3;
    let lookTarget: THREE.Vector3;

    if (mode === "system") {
      targetPos = new THREE.Vector3(14, 9, 14);
      lookTarget = new THREE.Vector3(0, 0, 0);
    } else if (mode === "southPole") {
      // Zoom in directly underneath the Moon's South Pole (where Shackleton sits)
      targetPos = moonPos.clone().add(new THREE.Vector3(0.05, -MOON_RADIUS * 2.4, 0.35));
      lookTarget = moonPos.clone().add(new THREE.Vector3(0, -MOON_RADIUS * 0.95, 0));
    } else if (mode === "siteA") {
      const siteLocal = latLonToVec3(selectedSiteA.latitude, selectedSiteA.longitude, MOON_RADIUS * 2.2);
      targetPos = moonPos.clone().add(siteLocal);
      lookTarget = moonPos.clone().add(latLonToVec3(selectedSiteA.latitude, selectedSiteA.longitude, MOON_RADIUS * 0.9));
    } else {
      // siteB
      const siteLocal = latLonToVec3(selectedSiteB.latitude, selectedSiteB.longitude, MOON_RADIUS * 2.2);
      targetPos = moonPos.clone().add(siteLocal);
      lookTarget = moonPos.clone().add(latLonToVec3(selectedSiteB.latitude, selectedSiteB.longitude, MOON_RADIUS * 0.9));
    }

    const startPos = camera.position.clone();
    let step = 0;
    const animateLerp = () => {
      step = Math.min(step + 0.035, 1);
      const eased = 1 - Math.pow(1 - step, 3);
      camera.position.lerpVectors(startPos, targetPos, eased);
      camera.lookAt(lookTarget);
      if (step < 1) requestAnimationFrame(animateLerp);
    };
    animateLerp();
  }, [mode, selectedSiteA, selectedSiteB, moonPos, camera]);

  return null;
}

// ─── Main WebGL Scene Component ──────────────────────────────────────────────
export function LunarScene3D({
  cameraMode,
  selectedSiteA,
  selectedSiteB,
  currentDate,
  isSunVisibleA,
  isSunVisibleB,
  isEarthVisibleA,
  isEarthVisibleB,
  onSiteClick,
  sites,
}: SceneProps) {
  const lunarTexture = useMemo(() => createProceduralLunarTexture(), []);

  // Compute Moon's orbital position around Earth based on synodic month
  const synodicPeriod = 29.530588853 * 24 * 3600;
  const tSec = currentDate.getTime() / 1000;
  const moonAngle = ((tSec % synodicPeriod) / synodicPeriod) * Math.PI * 2;

  const moonPos = useMemo(
    () =>
      new THREE.Vector3(
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle * 0.08) * 0.3,
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS
      ),
    [moonAngle]
  );

  const earthPos = new THREE.Vector3(0, 0, 0);

  // Compute 3D world positions of Site A and Site B on the Moon's surface
  const siteAWorld = useMemo(() => {
    const local = latLonToVec3(selectedSiteA.latitude, selectedSiteA.longitude, MOON_RADIUS);
    return local.clone().add(moonPos);
  }, [selectedSiteA, moonPos]);

  const siteBWorld = useMemo(() => {
    const local = latLonToVec3(selectedSiteB.latitude, selectedSiteB.longitude, MOON_RADIUS);
    return local.clone().add(moonPos);
  }, [selectedSiteB, moonPos]);

  return (
    <Canvas
      camera={{
        position: [14, 9, 14],
        fov: 50,
        near: 0.01,
        far: 2500,
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ background: "radial-gradient(ellipse at 35% 45%, #080d19, #03060c)" }}
    >
      <CameraFlightController
        mode={cameraMode}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        moonPos={moonPos}
      />

      {/* Deep Space Environment & Stars */}
      <ambientLight intensity={0.12} />
      <Stars radius={700} depth={150} count={6000} factor={5} fade speed={0.2} />

      {/* Orbit Track of Moon around Earth */}
      <OrbitPath radius={MOON_ORBIT_RADIUS} color="#1d3557" />

      {/* Sun with Corona Glow */}
      <SunObject />

      {/* Rotating Earth */}
      <EarthObject />

      {/* Moon with Craters, Maria, and Site Beacons */}
      <MoonGlobe
        position={moonPos}
        sites={sites}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        onSiteClick={onSiteClick}
        lunarTexture={lunarTexture}
      />

      {/* ── 3D Raycast Beams (Line-of-Sight) ── */}
      {/* 1. Solar Rays (Amber `#F59E0B` when clear, Dashed Red `#EF4444` when shadowed) */}
      <RaycastLoSBeam from={SUN_POS} to={siteAWorld} clearColor="#F59E0B" isVisible={isSunVisibleA} />
      <RaycastLoSBeam from={SUN_POS} to={siteBWorld} clearColor="#F59E0B" isVisible={isSunVisibleB} />

      {/* 2. Direct-to-Earth Comms Beams (Cyan `#38BDF8` when clear, Dashed Red when blocked) */}
      <RaycastLoSBeam from={earthPos} to={siteAWorld} clearColor="#38BDF8" isVisible={isEarthVisibleA} />
      <RaycastLoSBeam from={earthPos} to={siteBWorld} clearColor="#38BDF8" isVisible={isEarthVisibleB} />

      {/* OrbitControls for user interaction */}
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={0.3}
        maxDistance={120}
        makeDefault
      />
    </Canvas>
  );
}
