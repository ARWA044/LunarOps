"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Trail, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";
import type { CandidateSite } from "@/lib/types";
import { getSubSolarPoint, getSubEarthPoint, toJulianDate } from "@/lib/astronomical";

// ─── Shared Types ────────────────────────────────────────────────────────────

interface SceneProps {
  cameraMode: "system" | "globe" | "siteA" | "siteB";
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
const MOON_RADIUS = 0.27;
const SUN_RADIUS = 4.0;
const AU = 60; // Compressed AU in world units
const MOON_ORBIT_RADIUS = 8.0;
const SUN_POS = new THREE.Vector3(-AU, 0, 0);

// Convert lunar lat/lon to 3D point on the Moon sphere surface
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Sun Object ──────────────────────────────────────────────────────────────
function SunObject() {
  const ref = useRef<THREE.Group>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.05;
    if (coronaRef.current) {
      const s = 1 + 0.05 * Math.sin(clock.elapsedTime * 1.5);
      coronaRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={SUN_POS} ref={ref}>
      {/* Core */}
      <Sphere args={[SUN_RADIUS, 32, 32]}>
        <meshStandardMaterial color="#FDE68A" emissive="#F59E0B" emissiveIntensity={2.5} roughness={1} />
      </Sphere>
      {/* Corona glow layers */}
      <Sphere args={[SUN_RADIUS * 1.15, 32, 32]} ref={coronaRef}>
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={1.5} transparent opacity={0.12} roughness={1} />
      </Sphere>
      <Sphere args={[SUN_RADIUS * 1.35, 32, 32]}>
        <meshStandardMaterial color="#FCD34D" emissive="#FCD34D" emissiveIntensity={0.5} transparent opacity={0.05} roughness={1} />
      </Sphere>
      {/* Point light */}
      <pointLight intensity={6} distance={1000} color="#FDE68A" castShadow={false} />
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

  return <Line points={points} color={color} lineWidth={0.5} transparent opacity={0.3} />;
}

// ─── Earth ───────────────────────────────────────────────────────────────────
function EarthObject() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.12;
  });

  return (
    <group ref={ref}>
      {/* Ocean */}
      <Sphere args={[EARTH_RADIUS, 40, 40]}>
        <meshStandardMaterial color="#1a4d7a" emissive="#0d2340" emissiveIntensity={0.3} roughness={0.85} metalness={0.1} />
      </Sphere>
      {/* Atmosphere rim */}
      <Sphere args={[EARTH_RADIUS * 1.04, 40, 40]}>
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.08} roughness={1} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

// ─── Moon with terminator-driven shadow ──────────────────────────────────────
function MoonObject({
  position,
  sunVec,
  sites,
  selectedSiteA,
  selectedSiteB,
  onSiteClick,
  cameraMode,
}: {
  position: THREE.Vector3;
  sunVec: THREE.Vector3;
  sites: CandidateSite[];
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSiteClick?: (site: CandidateSite, slot: "A" | "B") => void;
  cameraMode: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * 0.02;
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Moon sphere */}
      <Sphere args={[MOON_RADIUS, 64, 64]} ref={meshRef}>
        <meshStandardMaterial
          color="#8b9db5"
          roughness={0.98}
          metalness={0}
          emissive="#1a2030"
          emissiveIntensity={0.06}
        />
      </Sphere>

      {/* Landing site beacons */}
      {sites.map((site) => {
        const isA = site.id === selectedSiteA.id;
        const isB = site.id === selectedSiteB.id;
        const vec = latLonToVec3(site.latitude, site.longitude, MOON_RADIUS * 1.02);
        const color = isA ? "#f59e0b" : isB ? "#38bdf8" : "#94a3b8";
        const scale = isA || isB ? 1.8 : 1;

        return (
          <group key={site.id} position={vec}>
            {/* Beacon core */}
            <Sphere
              args={[MOON_RADIUS * 0.025 * scale, 8, 8]}
              onClick={(e) => {
                e.stopPropagation();
                if (onSiteClick) onSiteClick(site, isA ? "B" : "A");
              }}
            >
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
            </Sphere>
            {/* Pulsing ring */}
            {(isA || isB) && (
              <Sphere args={[MOON_RADIUS * 0.05, 8, 8]}>
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.2} />
              </Sphere>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── LoS Beam between two 3D world-space points ───────────────────────────────
function LoSBeam({
  from,
  to,
  color,
  visible: isVisible,
  dashed,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  visible: boolean;
  dashed?: boolean;
}) {
  const points = useMemo(() => [from, to], [from, to]);

  if (!isVisible) {
    // Blocked: dashed red
    return (
      <Line
        points={[from, to]}
        color="#ef4444"
        lineWidth={0.8}
        dashed
        dashSize={1.5}
        dashOffset={0}
        gapSize={0.8}
        transparent
        opacity={0.5}
      />
    );
  }

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.75}
    />
  );
}

// ─── Dynamic Moon Orbit + Scene ───────────────────────────────────────────────
function OrbitalScene({
  currentDate,
  selectedSiteA,
  selectedSiteB,
  isSunVisibleA,
  isSunVisibleB,
  isEarthVisibleA,
  isEarthVisibleB,
  sites,
  onSiteClick,
}: Omit<SceneProps, "cameraMode">) {
  const jd = toJulianDate(currentDate);

  // Moon orbital angle driven by synodic month
  const synodicPeriod = 29.530588853 * 24 * 3600; // seconds
  const tSec = currentDate.getTime() / 1000;
  const moonAngle = ((tSec % synodicPeriod) / synodicPeriod) * Math.PI * 2;

  const moonPos = useMemo(
    () =>
      new THREE.Vector3(
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle * 0.08) * 0.2,
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS
      ),
    [moonAngle]
  );

  const earthPos = new THREE.Vector3(0, 0, 0);

  // Sun vector from Earth perspective
  const sunVec = SUN_POS.clone().sub(earthPos).normalize();

  // Site world positions (on Moon surface)
  const siteAWorld = useMemo(() => {
    const local = latLonToVec3(selectedSiteA.latitude, selectedSiteA.longitude, MOON_RADIUS);
    return local.clone().add(moonPos);
  }, [selectedSiteA, moonPos]);

  const siteBWorld = useMemo(() => {
    const local = latLonToVec3(selectedSiteB.latitude, selectedSiteB.longitude, MOON_RADIUS);
    return local.clone().add(moonPos);
  }, [selectedSiteB, moonPos]);

  return (
    <>
      {/* Ambient + directional light from sun direction */}
      <ambientLight intensity={0.08} />
      <directionalLight position={SUN_POS} intensity={3} castShadow={false} />

      {/* Stars */}
      <Stars radius={600} depth={100} count={5000} factor={5} fade speed={0.3} />

      {/* Orbital paths */}
      <OrbitPath radius={MOON_ORBIT_RADIUS} color="#2d4a6e" />

      {/* Sun */}
      <SunObject />

      {/* Earth */}
      <EarthObject />

      {/* Moon */}
      <MoonObject
        position={moonPos}
        sunVec={sunVec}
        sites={sites}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        onSiteClick={onSiteClick}
        cameraMode="system"
      />

      {/* LoS Beams: Solar Rays to Site A & B */}
      <LoSBeam from={SUN_POS} to={siteAWorld} color="#f59e0b" visible={isSunVisibleA} />
      <LoSBeam from={SUN_POS} to={siteBWorld} color="#f59e0b" visible={isSunVisibleB} />

      {/* LoS Beams: Earth to Site A & B */}
      <LoSBeam from={earthPos} to={siteAWorld} color="#38bdf8" visible={isEarthVisibleA} />
      <LoSBeam from={earthPos} to={siteBWorld} color="#38bdf8" visible={isEarthVisibleB} />
    </>
  );
}

// ─── Close-up Globe Scene ─────────────────────────────────────────────────────
function GlobeScene({
  currentDate,
  selectedSiteA,
  selectedSiteB,
  sites,
  onSiteClick,
}: Omit<SceneProps, "cameraMode" | "isSunVisibleA" | "isSunVisibleB" | "isEarthVisibleA" | "isEarthVisibleB">) {
  const jd = toJulianDate(currentDate);
  const { lat: sunLat, lon: sunLon } = getSubSolarPoint(jd);
  const sunVec3 = latLonToVec3(sunLat, sunLon, 30).normalize();

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={sunVec3.clone().multiplyScalar(30)} intensity={3.5} />
      <Stars radius={200} depth={60} count={3000} factor={4} fade speed={0.2} />

      <MoonObject
        position={new THREE.Vector3(0, 0, 0)}
        sunVec={sunVec3}
        sites={sites}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        onSiteClick={onSiteClick}
        cameraMode="globe"
      />
    </>
  );
}

// ─── Camera controller ────────────────────────────────────────────────────────
function CameraController({
  mode,
  selectedSiteA,
  selectedSiteB,
  moonPos,
}: {
  mode: string;
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  moonPos: THREE.Vector3;
}) {
  const { camera } = useThree();

  useEffect(() => {
    let targetPos: THREE.Vector3;
    let lookAt = new THREE.Vector3(0, 0, 0);

    if (mode === "system") {
      targetPos = new THREE.Vector3(15, 8, 15);
    } else if (mode === "globe") {
      targetPos = new THREE.Vector3(0, 0.5, 0.85);
    } else if (mode === "siteA") {
      const siteVec = latLonToVec3(selectedSiteA.latitude, selectedSiteA.longitude, MOON_RADIUS * 1.5);
      targetPos = siteVec;
      lookAt = new THREE.Vector3(0, 0, 0);
    } else {
      const siteVec = latLonToVec3(selectedSiteB.latitude, selectedSiteB.longitude, MOON_RADIUS * 1.5);
      targetPos = siteVec;
      lookAt = new THREE.Vector3(0, 0, 0);
    }

    const startPos = camera.position.clone();
    let t = 0;
    const animate = () => {
      t = Math.min(t + 0.025, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos, targetPos, eased);
      camera.lookAt(lookAt);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [mode, selectedSiteA, selectedSiteB, moonPos, camera]);

  return null;
}

// ─── Main exported component (SSR-safe, loaded dynamically) ──────────────────
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
  const isGlobe = cameraMode !== "system";

  const synodicPeriod = 29.530588853 * 24 * 3600;
  const moonAngle = ((currentDate.getTime() / 1000) % synodicPeriod) / synodicPeriod * Math.PI * 2;
  const moonPos = new THREE.Vector3(
    Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
    Math.sin(moonAngle * 0.08) * 0.2,
    Math.sin(moonAngle) * MOON_ORBIT_RADIUS
  );

  return (
    <Canvas
      camera={{
        position: isGlobe ? [0, 0.5, 1.0] : [15, 8, 15],
        fov: isGlobe ? 45 : 55,
        near: 0.01,
        far: 2000,
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ background: "radial-gradient(ellipse at 30% 40%, #0a0e1a, #02040a)" }}
    >
      <CameraController
        mode={cameraMode}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        moonPos={moonPos}
      />

      {isGlobe ? (
        <GlobeScene
          currentDate={currentDate}
          selectedSiteA={selectedSiteA}
          selectedSiteB={selectedSiteB}
          sites={sites}
          onSiteClick={onSiteClick}
        />
      ) : (
        <OrbitalScene
          currentDate={currentDate}
          selectedSiteA={selectedSiteA}
          selectedSiteB={selectedSiteB}
          isSunVisibleA={isSunVisibleA}
          isSunVisibleB={isSunVisibleB}
          isEarthVisibleA={isEarthVisibleA}
          isEarthVisibleB={isEarthVisibleB}
          sites={sites}
          onSiteClick={onSiteClick}
        />
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={isGlobe ? 0.35 : 3}
        maxDistance={isGlobe ? 3 : 120}
        makeDefault
      />
    </Canvas>
  );
}
