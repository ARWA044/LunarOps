"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { CandidateSite } from "@/lib/types";

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
  isAnalysisMode?: boolean;
  onSiteClick?: (site: CandidateSite, slot: "A" | "B") => void;
  sites: CandidateSite[];
}

// ─── Scale Constants ──────────────────────────────────────────────────────────
const EARTH_RADIUS = 1.05;
const MOON_RADIUS = 0.34;
const SUN_RADIUS = 3.8;
const AU = 58;
const MOON_ORBIT_RADIUS = 8.8;
const SUN_POS = new THREE.Vector3(-AU, 0, 0);

export function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Procedural High-Definition Earth Canvas ──────────────────────────────────
function createEarthDayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Deep Ocean base gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, "#0b2545");
  oceanGrad.addColorStop(0.5, "#0d3b66");
  oceanGrad.addColorStop(1, "#0b2545");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Continents (Americas, Africa, Europe, Asia, Australia)
  const drawContinent = (
    pts: [number, number][],
    fillColor = "#2d6a4f",
    strokeColor = "#40916c"
  ) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  };

  // North America
  drawContinent([
    [120, 90], [280, 80], [310, 160], [240, 220], [180, 240], [140, 180], [100, 130]
  ], "#2d6a4f");
  // South America
  drawContinent([
    [260, 240], [340, 270], [330, 390], [290, 440], [260, 360], [230, 270]
  ], "#1b4332");
  // Africa
  drawContinent([
    [480, 160], [580, 170], [610, 250], [560, 380], [510, 370], [470, 240]
  ], "#52b788");
  // Europe & Asia
  drawContinent([
    [480, 80], [640, 70], [860, 100], [920, 200], [820, 260], [680, 230], [540, 140]
  ], "#2d6a4f");
  // Australia
  drawContinent([
    [780, 320], [880, 330], [860, 410], [790, 400]
  ], "#b7791f");

  // Polar Ice Caps
  ctx.fillStyle = "rgba(240, 248, 255, 0.85)";
  ctx.fillRect(0, 0, canvas.width, 32);
  ctx.fillRect(0, canvas.height - 32, canvas.width, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ─── Procedural Clouds Canvas ────────────────────────────────────────────────
function createEarthCloudsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 70; i++) {
    const x = Math.random() * canvas.width;
    const y = 60 + Math.random() * (canvas.height - 120);
    const rx = 30 + Math.random() * 80;
    const ry = 10 + Math.random() * 25;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`;
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ─── Procedural High-Definition Lunar Surface Texture ────────────────────────
function createProceduralLunarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Base anorthositic highlands
  ctx.fillStyle = "#8a94a6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. High-frequency micro-cratering noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const nx = x / 1024;
      const ny = y / 512;
      const n = (Math.sin(nx * 40) * Math.cos(ny * 28) + Math.sin(nx * 80 + ny * 80) * 0.5) * 18;
      data[idx] = Math.max(60, Math.min(190, data[idx] + n));
      data[idx + 1] = Math.max(65, Math.min(195, data[idx + 1] + n));
      data[idx + 2] = Math.max(75, Math.min(205, data[idx + 2] + n));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Basaltic Lunar Maria (Dark plains)
  const drawMare = (cx: number, cy: number, rx: number, ry: number, color = "#2c3340") => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.filter = "blur(12px)";
    ctx.fill();
    ctx.restore();
  };

  drawMare(450, 180, 85, 75, "#2d3340"); // Oceanus Procellarum
  drawMare(490, 170, 60, 48, "#252b36"); // Mare Imbrium
  drawMare(560, 200, 48, 42, "#282e3a"); // Mare Serenitatis
  drawMare(580, 240, 52, 45, "#2a303d"); // Mare Tranquillitatis
  drawMare(680, 200, 36, 30, "#202530"); // Mare Crisium
  drawMare(512, 465, 130, 45, "#2a303d"); // South Pole - Aitken Basin

  // 4. Detailed impact craters with bright ray systems
  const drawCraterWithRays = (x: number, y: number, r: number, numRays = 8) => {
    ctx.save();
    // Ejecta rays
    ctx.strokeStyle = "rgba(240, 245, 255, 0.18)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const rayLen = r * (3 + Math.random() * 4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * rayLen, y + Math.sin(angle) * rayLen);
      ctx.stroke();
    }

    // Bright ejecta rim
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(235, 242, 255, 0.2)";
    ctx.filter = "blur(3px)";
    ctx.fill();

    // Crater Rim
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#a8b5c9";
    ctx.fill();

    // Crater Shadow
    ctx.beginPath();
    ctx.arc(x + r * 0.2, y + r * 0.2, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = "#1e242e";
    ctx.fill();
    ctx.restore();
  };

  drawCraterWithRays(470, 360, 13, 12); // Tycho
  drawCraterWithRays(460, 215, 11, 8);  // Copernicus
  drawCraterWithRays(400, 220, 7, 6);   // Kepler
  drawCraterWithRays(512, 505, 9, 8);   // Shackleton (South Pole)
  drawCraterWithRays(530, 490, 7, 5);   // Faustini

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ─── Procedural Sun Glow Texture ─────────────────────────────────────────────
function createSunCoronaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.2, "rgba(255, 215, 0, 0.85)");
  grad.addColorStop(0.5, "rgba(245, 158, 11, 0.4)");
  grad.addColorStop(0.8, "rgba(239, 68, 68, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

// ─── Main Native Three.js Component ──────────────────────────────────────────
export function LunarScene3D({
  cameraMode,
  selectedSiteA,
  selectedSiteB,
  currentDate,
  isSunVisibleA,
  isSunVisibleB,
  isEarthVisibleA,
  isEarthVisibleB,
  isAnalysisMode = false,
  onSiteClick,
  sites,
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Live state reference to prevent re-instantiating the WebGL context
  const liveStateRef = useRef({
    cameraMode,
    selectedSiteA,
    selectedSiteB,
    currentDate,
    isSunVisibleA,
    isSunVisibleB,
    isEarthVisibleA,
    isEarthVisibleB,
    isAnalysisMode,
    onSiteClick,
    sites,
  });

  useEffect(() => {
    liveStateRef.current = {
      cameraMode,
      selectedSiteA,
      selectedSiteB,
      currentDate,
      isSunVisibleA,
      isSunVisibleB,
      isEarthVisibleA,
      isEarthVisibleB,
      isAnalysisMode,
      onSiteClick,
      sites,
    };
  }, [
    cameraMode,
    selectedSiteA,
    selectedSiteB,
    currentDate,
    isSunVisibleA,
    isSunVisibleB,
    isEarthVisibleA,
    isEarthVisibleB,
    isAnalysisMode,
    onSiteClick,
    sites,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene, Camera, Renderer ───────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04070d); // Cosmic Obsidian

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 3500);
    camera.position.set(14, 9, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ── Post-Processing Pipeline (UnrealBloomPass) ───────────────────────────
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.15, // bloom strength
      0.45, // bloom radius
      0.22  // bloom threshold
    );
    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 0.25;
    controls.maxDistance = 180;

    // ── 2. Multi-Layer Starfield & Milky Way ──────────────────────────────────
    // Layer A: Deep field background stars
    const deepStarGeo = new THREE.BufferGeometry();
    const deepStarCount = 6000;
    const deepPos = new Float32Array(deepStarCount * 3);
    const deepCol = new Float32Array(deepStarCount * 3);

    for (let i = 0; i < deepStarCount; i++) {
      const r = 500 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      deepPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      deepPos[i * 3 + 1] = r * Math.cos(phi);
      deepPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Color temperature variation (blue-white to amber)
      const temp = Math.random();
      if (temp > 0.8) {
        deepCol[i * 3] = 0.7; deepCol[i * 3 + 1] = 0.85; deepCol[i * 3 + 2] = 1.0; // Cool Blue
      } else if (temp > 0.5) {
        deepCol[i * 3] = 1.0; deepCol[i * 3 + 1] = 1.0; deepCol[i * 3 + 2] = 1.0;  // Pure White
      } else {
        deepCol[i * 3] = 1.0; deepCol[i * 3 + 1] = 0.85; deepCol[i * 3 + 2] = 0.6; // Warm Amber
      }
    }
    deepStarGeo.setAttribute("position", new THREE.BufferAttribute(deepPos, 3));
    deepStarGeo.setAttribute("color", new THREE.BufferAttribute(deepCol, 3));
    const deepStarMat = new THREE.PointsMaterial({ size: 1.1, vertexColors: true, transparent: true, opacity: 0.85 });
    const deepStarField = new THREE.Points(deepStarGeo, deepStarMat);
    scene.add(deepStarField);

    // Layer B: Milky Way Galactic Belt (concentrated dense particles)
    const mwGeo = new THREE.BufferGeometry();
    const mwCount = 4000;
    const mwPos = new Float32Array(mwCount * 3);
    const mwCol = new Float32Array(mwCount * 3);
    for (let i = 0; i < mwCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 550 + Math.random() * 200;
      const spread = (Math.random() - 0.5) * 60;
      // Tilted galactic plane
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = spread + Math.sin(angle * 2) * 40;

      mwPos[i * 3] = x;
      mwPos[i * 3 + 1] = y;
      mwPos[i * 3 + 2] = z;

      mwCol[i * 3] = 0.6 + Math.random() * 0.3;
      mwCol[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      mwCol[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    }
    mwGeo.setAttribute("position", new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute("color", new THREE.BufferAttribute(mwCol, 3));
    const mwMat = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.6 });
    const mwField = new THREE.Points(mwGeo, mwMat);
    scene.add(mwField);

    // ── 3. Photorealistic Sun with Animated Corona & Lens Flare ───────────────
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(SUN_POS);

    const sunCoreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 36, 36),
      new THREE.MeshBasicMaterial({ color: 0xfffaed })
    );
    sunGroup.add(sunCoreMesh);

    // Pulsing corona shells
    const coronaTexture = createSunCoronaTexture();
    const coronaMesh1 = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.28 })
    );
    sunGroup.add(coronaMesh1);

    const coronaMesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.45, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.12 })
    );
    sunGroup.add(coronaMesh2);

    // Sprite flare
    const flareMat = new THREE.SpriteMaterial({ map: coronaTexture, color: 0xffeedd, transparent: true, opacity: 0.65 });
    const flareSprite = new THREE.Sprite(flareMat);
    flareSprite.scale.set(SUN_RADIUS * 6, SUN_RADIUS * 6, 1);
    sunGroup.add(flareSprite);

    // Sun directional sunlight & point light
    const sunLight = new THREE.PointLight(0xfff8eb, 5.5, 2500, 0.2);
    sunGroup.add(sunLight);
    scene.add(sunGroup);

    const spaceAmbient = new THREE.AmbientLight(0x283244, 0.45);
    scene.add(spaceAmbient);

    // ── 4. Photorealistic Earth with Clouds & Atmosphere ─────────────────────
    const earthGroup = new THREE.Group();

    const earthDayTex = createEarthDayTexture();
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 48, 48),
      new THREE.MeshStandardMaterial({
        map: earthDayTex,
        roughness: 0.65,
        metalness: 0.08,
      })
    );
    earthGroup.add(earthMesh);

    // Separate rotating cloud layer
    const earthCloudsTex = createEarthCloudsTexture();
    const cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.018, 48, 48),
      new THREE.MeshStandardMaterial({
        map: earthCloudsTex,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    );
    earthGroup.add(cloudsMesh);

    // Atmosphere Fresnel rim glow
    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.06, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
      })
    );
    earthGroup.add(atmosphereMesh);
    scene.add(earthGroup);

    // Moon Orbit Trajectory Path Ring
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 140; i++) {
      const a = (i / 140) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(a) * MOON_ORBIT_RADIUS, 0, Math.sin(a) * MOON_ORBIT_RADIUS));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitLine = new THREE.Line(
      orbitGeo,
      new THREE.LineBasicMaterial({ color: 0x1d3a60, transparent: true, opacity: 0.45 })
    );
    scene.add(orbitLine);

    // ── 5. High-Definition 3D Moon & Holographic Blueprint Materials ───────────
    const moonGroup = new THREE.Group();
    const lunarTex = createProceduralLunarTexture();

    // Standard realistic rock material
    const moonNormalMat = new THREE.MeshStandardMaterial({
      map: lunarTex,
      roughness: 0.95,
      metalness: 0.02,
    });

    // Holographic X-Ray blueprint wireframe material
    const moonHoloMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x0891b2,
      transparent: true,
      opacity: 0.22,
    });

    const moonNormalMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 64, 64),
      moonNormalMat
    );
    moonGroup.add(moonNormalMesh);

    const moonHoloMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 64, 64),
      moonHoloMat
    );
    moonHoloMesh.visible = false;
    moonGroup.add(moonHoloMesh);

    // Dark occlusion sphere inside the moon (prevents back-facing wireframe clutter in holo mode)
    const moonOcclusionMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS * 0.992, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x020817 })
    );
    moonOcclusionMesh.visible = false;
    moonGroup.add(moonOcclusionMesh);

    // Holographic cyan atmospheric rim glow in analysis mode
    const moonHoloGlow = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS * 1.045, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0891b2,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    moonHoloGlow.visible = false;
    moonGroup.add(moonHoloGlow);

    // ── High-Tech Holographic Reticles for Site A & Site B ────────────────────
    const createTargetingReticle = (colorHex: number) => {
      const g = new THREE.Group();

      // Outer radar ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.038, 0.042, 32),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      g.add(ring);

      // Inner dashed reticle ring
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.025, 24),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      g.add(innerRing);

      // 4 Crosshair tick bars
      const tickGeo = new THREE.BufferGeometry();
      const tickPts = new Float32Array([
        0, 0.028, 0,  0, 0.052, 0,
        0, -0.028, 0, 0, -0.052, 0,
        0.028, 0, 0,  0.052, 0, 0,
        -0.028, 0, 0, -0.052, 0, 0,
      ]);
      tickGeo.setAttribute("position", new THREE.BufferAttribute(tickPts, 3));
      const tickMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
      const ticks = new THREE.LineSegments(tickGeo, tickMat);
      g.add(ticks);

      g.visible = false;
      return g;
    };

    const reticleA = createTargetingReticle(0xf59e0b); // Amber for Site A
    const reticleB = createTargetingReticle(0x00f0ff); // Neon Cyan for Site B
    moonGroup.add(reticleA);
    moonGroup.add(reticleB);

    scene.add(moonGroup);

    // ── 6. Interactive 3D Beacons, Altitude Stalks & LOLA Rings ──────────────
    const beaconMeshes: THREE.Mesh[] = [];
    const beaconGroup = new THREE.Group();
    moonGroup.add(beaconGroup);

    const rebuildBeacons = (currentSites: CandidateSite[], siteA: CandidateSite, siteB: CandidateSite) => {
      while (beaconGroup.children.length > 0) {
        beaconGroup.remove(beaconGroup.children[0]);
      }
      beaconMeshes.length = 0;

      currentSites.forEach((site) => {
        const isA = site.id === siteA.id;
        const isB = site.id === siteB.id;
        const colorHex = isA ? 0xf59e0b : isB ? 0x00f0ff : 0x94a3b8;
        const surfPos = latLonToVec3(site.latitude, site.longitude, MOON_RADIUS * 1.015);
        const normal = surfPos.clone().normalize();
        const stalkTop = surfPos.clone().add(normal.clone().multiplyScalar(isA || isB ? 0.035 : 0.018));

        const bGroup = new THREE.Group();

        // 1. Altitude Stalk (line connecting surface to elevated beacon)
        const stalkGeo = new THREE.BufferGeometry().setFromPoints([surfPos, stalkTop]);
        const stalkMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: isA || isB ? 0.9 : 0.4 });
        bGroup.add(new THREE.Line(stalkGeo, stalkMat));

        // 2. Elevated Floating Holographic Beacon Core
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(isA || isB ? 0.011 : 0.006, 12, 12),
          new THREE.MeshBasicMaterial({ color: colorHex })
        );
        marker.position.copy(stalkTop);
        marker.userData = { site };
        bGroup.add(marker);
        beaconMeshes.push(marker);

        // 3. LOLA Terrain Ring on surface
        const ringQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.016, 0.022, 32),
          new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: isA || isB ? 0.85 : 0.25,
            side: THREE.DoubleSide,
          })
        );
        ring.position.copy(surfPos);
        ring.quaternion.copy(ringQuat);
        ring.userData = { site };
        bGroup.add(ring);
        beaconMeshes.push(ring);

        // 4. Secondary Outer Halo Ring for Selected Sites
        if (isA || isB) {
          const halo = new THREE.Mesh(
            new THREE.RingGeometry(0.030, 0.034, 32),
            new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
          );
          halo.position.copy(surfPos);
          halo.quaternion.copy(ringQuat);
          bGroup.add(halo);
        }

        beaconGroup.add(bGroup);
      });
    };

    rebuildBeacons(liveStateRef.current.sites, liveStateRef.current.selectedSiteA, liveStateRef.current.selectedSiteB);

    // ── 7. Dynamic Flowing Dashed Raycast Lines (Solar & Comms) ───────────────
    // Using LineDashedMaterial with animated dashOffset to show photon/signal flow
    const createFlowingRay = (colorHex: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const mat = new THREE.LineDashedMaterial({
        color: colorHex,
        dashSize: 0.8,
        gapSize: 0.4,
        scale: 1,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return line;
    };

    const solarRayA = createFlowingRay(0xf59e0b); // Amber
    const solarRayB = createFlowingRay(0xf59e0b);
    const commsRayA = createFlowingRay(0x00f0ff); // Earth Comms Cyan
    const commsRayB = createFlowingRay(0x00f0ff);

    // ── 8. Raycaster for 3D Marker Interaction ────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(beaconMeshes, false);
      if (intersects.length > 0) {
        const clickedSite: CandidateSite = intersects[0].object.userData.site;
        if (clickedSite && liveStateRef.current.onSiteClick) {
          const isA = clickedSite.id === liveStateRef.current.selectedSiteA.id;
          liveStateRef.current.onSiteClick(clickedSite, isA ? "B" : "A");
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // ── 9. Camera Flight Easing ───────────────────────────────────────────────
    let targetCamPos: THREE.Vector3 | null = null;
    let targetCamLook: THREE.Vector3 | null = null;
    let lastCameraMode = liveStateRef.current.cameraMode;
    let lastSiteAId = liveStateRef.current.selectedSiteA.id;
    let lastSiteBId = liveStateRef.current.selectedSiteB.id;

    const setupCameraTarget = () => {
      const st = liveStateRef.current;
      const synodicPeriod = 29.530588853 * 24 * 3600;
      const tSec = st.currentDate.getTime() / 1000;
      const a = ((tSec % synodicPeriod) / synodicPeriod) * Math.PI * 2;
      const curMoonPos = new THREE.Vector3(
        Math.cos(a) * MOON_ORBIT_RADIUS,
        Math.sin(a * 0.08) * 0.35,
        Math.sin(a) * MOON_ORBIT_RADIUS
      );

      if (st.cameraMode === "system") {
        targetCamPos = new THREE.Vector3(14, 9, 14);
        targetCamLook = new THREE.Vector3(0, 0, 0);
      } else if (st.cameraMode === "southPole") {
        // Dramatic view right below the South Pole crater rims with realistic depth
        targetCamPos = curMoonPos.clone().add(new THREE.Vector3(0.45, -MOON_RADIUS * 3.6, 1.25));
        targetCamLook = curMoonPos.clone().add(new THREE.Vector3(0, -MOON_RADIUS * 0.95, 0));
      } else if (st.cameraMode === "siteA") {
        const local = latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS * 2.2);
        targetCamPos = curMoonPos.clone().add(local);
        targetCamLook = curMoonPos.clone().add(latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS * 0.88));
      } else {
        const local = latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS * 2.2);
        targetCamPos = curMoonPos.clone().add(local);
        targetCamLook = curMoonPos.clone().add(latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS * 0.88));
      }
    };

    setupCameraTarget();

    // ── 10. Animation Loop ────────────────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const updateRay = (
      line: THREE.Line,
      start: THREE.Vector3,
      end: THREE.Vector3,
      isVisible: boolean,
      clearColorHex: number,
      flowTime: number
    ) => {
      const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, start.x, start.y, start.z);
      posAttr.setXYZ(1, end.x, end.y, end.z);
      posAttr.needsUpdate = true;

      // Recompute distance for dashes
      line.computeLineDistances();

      const mat = line.material as THREE.LineDashedMaterial;
      if (isVisible) {
        mat.color.setHex(clearColorHex);
        mat.dashSize = 0.8 + 0.15 * Math.sin(flowTime * 6);
        mat.gapSize = 0.35;
        mat.opacity = 0.9;
        // Animated photon travel along ray using dash scale
        mat.scale = 1 + ((flowTime * 1.5) % 1);
      } else {
        // Shadowed / Obstructed: Alert Red
        mat.color.setHex(0xef4444);
        mat.dashSize = 0.4;
        mat.gapSize = 0.4;
        mat.opacity = 0.5;
        mat.scale = 1;
      }
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const st = liveStateRef.current;

      // Check if site selections changed
      if (st.selectedSiteA.id !== lastSiteAId || st.selectedSiteB.id !== lastSiteBId) {
        lastSiteAId = st.selectedSiteA.id;
        lastSiteBId = st.selectedSiteB.id;
        rebuildBeacons(st.sites, st.selectedSiteA, st.selectedSiteB);
        setupCameraTarget();
      }

      // Check if camera mode changed
      if (st.cameraMode !== lastCameraMode) {
        lastCameraMode = st.cameraMode;
        setupCameraTarget();
      }

      // Rotations & Visual Pulsing
      earthMesh.rotation.y = elapsed * 0.04;
      cloudsMesh.rotation.y = elapsed * 0.052; // Slightly faster cloud drift

      const coronaScale = 1 + 0.035 * Math.sin(elapsed * 2.2);
      coronaMesh1.scale.setScalar(coronaScale);
      coronaMesh2.scale.setScalar(1 + 0.05 * Math.cos(elapsed * 1.8));

      // Compute Moon Position
      const synodicPeriod = 29.530588853 * 24 * 3600;
      const tSec = st.currentDate.getTime() / 1000;
      const moonAngle = ((tSec % synodicPeriod) / synodicPeriod) * Math.PI * 2;
      const moonPos = new THREE.Vector3(
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle * 0.08) * 0.35,
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS
      );
      moonGroup.position.copy(moonPos);

      // World positions of sites on Moon
      const siteALocal = latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS);
      const siteBLocal = latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS);
      const siteAWorld = siteALocal.clone().add(moonPos);
      const siteBWorld = siteBLocal.clone().add(moonPos);
      const earthCenter = new THREE.Vector3(0, 0, 0);

      // Update Flowing Raycast Beams
      updateRay(solarRayA, SUN_POS, siteAWorld, st.isSunVisibleA, 0xf59e0b, elapsed);
      updateRay(solarRayB, SUN_POS, siteBWorld, st.isSunVisibleB, 0xf59e0b, elapsed);
      updateRay(commsRayA, earthCenter, siteAWorld, st.isEarthVisibleA, 0x00f0ff, elapsed);
      updateRay(commsRayB, earthCenter, siteBWorld, st.isEarthVisibleB, 0x00f0ff, elapsed);

      // ── Analysis Mode toggling & Reticle animation ─────────────────────────
      const isHolo = !!st.isAnalysisMode;
      moonNormalMesh.visible = !isHolo;
      moonHoloMesh.visible = isHolo;
      moonOcclusionMesh.visible = isHolo;
      moonHoloGlow.visible = isHolo;
      reticleA.visible = isHolo;
      reticleB.visible = isHolo;

      if (isHolo) {
        const reticleAPos = siteALocal.clone().normalize().multiplyScalar(MOON_RADIUS * 1.022);
        reticleA.position.copy(reticleAPos);
        reticleA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), reticleAPos.clone().normalize());
        reticleA.rotateZ(elapsed * 0.5);

        const reticleBPos = siteBLocal.clone().normalize().multiplyScalar(MOON_RADIUS * 1.022);
        reticleB.position.copy(reticleBPos);
        reticleB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), reticleBPos.clone().normalize());
        reticleB.rotateZ(-elapsed * 0.5);

        bloomPass.strength = 0.72;
        bloomPass.threshold = 0.28;
      } else {
        bloomPass.strength = 0.85;
        bloomPass.threshold = 0.28;
      }

      // Camera Easing Lerp
      if (targetCamPos && targetCamLook) {
        camera.position.lerp(targetCamPos, 0.045);
        controls.target.lerp(targetCamLook, 0.045);
      }

      controls.update();
      composer.render();
    };

    animate();

    // ── 11. Resize Handler ────────────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── 12. Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      composer.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full select-none" />;
}
