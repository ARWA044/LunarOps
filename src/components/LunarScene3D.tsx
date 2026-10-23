"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
  onSiteClick?: (site: CandidateSite, slot: "A" | "B") => void;
  sites: CandidateSite[];
}

// ─── Scale constants ──────────────────────────────────────────────────────────
const EARTH_RADIUS = 1.0;
const MOON_RADIUS = 0.32;
const SUN_RADIUS = 3.6;
const AU = 55;
const MOON_ORBIT_RADIUS = 8.5;
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

// ─── Procedural Lunar Texture ─────────────────────────────────────────────────
function createProceduralLunarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base highlands
  ctx.fillStyle = "#8892a4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Surface roughness noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const nx = x / 1024;
      const ny = y / 512;
      const noise = (Math.sin(nx * 32) * Math.cos(ny * 24) + Math.sin(nx * 64 + ny * 64) * 0.5) * 16;
      data[idx] = Math.max(70, Math.min(180, data[idx] + noise));
      data[idx + 1] = Math.max(75, Math.min(185, data[idx + 1] + noise));
      data[idx + 2] = Math.max(85, Math.min(195, data[idx + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Basaltic Lunar Maria
  const drawMare = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.filter = "blur(12px)";
    ctx.fill();
    ctx.restore();
  };

  drawMare(450, 180, 80, 70, "#3a4150"); // Procellarum
  drawMare(490, 170, 55, 45, "#323946"); // Imbrium
  drawMare(560, 200, 45, 40, "#333b49"); // Serenitatis
  drawMare(580, 240, 50, 42, "#373e4d"); // Tranquillitatis
  drawMare(680, 200, 32, 28, "#2e3542"); // Mare Crisium
  drawMare(512, 460, 120, 40, "#3f4654"); // South Pole Aitken

  // Craters
  const drawCrater = (x: number, y: number, r: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(230, 238, 255, 0.12)";
    ctx.filter = "blur(4px)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#a8b3c5";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + r * 0.18, y + r * 0.18, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = "#252b36";
    ctx.fill();
    ctx.restore();
  };

  drawCrater(470, 360, 12); // Tycho
  drawCrater(460, 215, 10); // Copernicus
  drawCrater(512, 505, 8); // Shackleton

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable refs to pass live state to the Three.js animation loop without rebuilding the scene
  const liveStateRef = useRef({
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
  });

  // Keep liveStateRef in sync with incoming props
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
    onSiteClick,
    sites,
  ]);

  // Main native Three.js mount effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04070d);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 3000);
    camera.position.set(14, 9, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.25;
    controls.maxDistance = 150;

    // 2. Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 400 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.cos(phi);
      starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 3. Sun & Light
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(SUN_POS);

    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfffaed })
    );
    sunGroup.add(sunMesh);

    const coronaMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.15, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.22 })
    );
    sunGroup.add(coronaMesh);

    const sunLight = new THREE.PointLight(0xfff8e7, 5.0, 2000, 0.2);
    sunGroup.add(sunLight);
    scene.add(sunGroup);

    const ambientLight = new THREE.AmbientLight(0x222634, 0.4);
    scene.add(ambientLight);

    // 4. Earth
    const earthGroup = new THREE.Group();
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1b4974,
        emissive: 0x0b1e32,
        emissiveIntensity: 0.4,
        roughness: 0.7,
        metalness: 0.1,
      })
    );
    earthGroup.add(earthMesh);

    const earthAtmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
      })
    );
    earthGroup.add(earthAtmosphere);
    scene.add(earthGroup);

    // Moon Orbit Path Ring
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(a) * MOON_ORBIT_RADIUS, 0, Math.sin(a) * MOON_ORBIT_RADIUS));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x1d3557, transparent: true, opacity: 0.4 }));
    scene.add(orbitLine);

    // 5. Moon
    const moonGroup = new THREE.Group();
    const lunarTexture = createProceduralLunarTexture();
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 64, 64),
      new THREE.MeshStandardMaterial({
        map: lunarTexture,
        roughness: 0.94,
        metalness: 0.02,
      })
    );
    moonGroup.add(moonMesh);
    scene.add(moonGroup);

    // Site Beacon Markers
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
        const color = isA ? 0xf59e0b : isB ? 0x38bdf8 : 0x94a3b8;
        const surfPos = latLonToVec3(site.latitude, site.longitude, MOON_RADIUS * 1.015);
        const normal = surfPos.clone().normalize();

        const bGroup = new THREE.Group();
        bGroup.position.copy(surfPos);

        // Core marker sphere
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(isA || isB ? 0.012 : 0.007, 12, 12),
          new THREE.MeshBasicMaterial({ color })
        );
        marker.userData = { site };
        bGroup.add(marker);
        beaconMeshes.push(marker);

        // LOLA terrain ring
        const ringQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.016, 0.020, 32),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isA || isB ? 0.8 : 0.25, side: THREE.DoubleSide })
        );
        ring.quaternion.copy(ringQuat);
        ring.userData = { site };
        bGroup.add(ring);
        beaconMeshes.push(ring);

        beaconGroup.add(bGroup);
      });
    };

    rebuildBeacons(liveStateRef.current.sites, liveStateRef.current.selectedSiteA, liveStateRef.current.selectedSiteB);

    // 6. Line-of-Sight Raycast Beams
    const createBeamLine = (colorHex: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2, transparent: true, opacity: 0.85 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return line;
    };

    const solarRayA = createBeamLine(0xf59e0b);
    const solarRayB = createBeamLine(0xf59e0b);
    const commsRayA = createBeamLine(0x38bdf8);
    const commsRayB = createBeamLine(0x38bdf8);

    // 7. Raycaster for clicking 3D beacons
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

    // 8. Camera flight animation
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
        Math.sin(a * 0.08) * 0.3,
        Math.sin(a) * MOON_ORBIT_RADIUS
      );

      if (st.cameraMode === "system") {
        targetCamPos = new THREE.Vector3(14, 9, 14);
        targetCamLook = new THREE.Vector3(0, 0, 0);
      } else if (st.cameraMode === "southPole") {
        targetCamPos = curMoonPos.clone().add(new THREE.Vector3(0.05, -MOON_RADIUS * 2.4, 0.35));
        targetCamLook = curMoonPos.clone().add(new THREE.Vector3(0, -MOON_RADIUS * 0.95, 0));
      } else if (st.cameraMode === "siteA") {
        const local = latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS * 2.2);
        targetCamPos = curMoonPos.clone().add(local);
        targetCamLook = curMoonPos.clone().add(latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS * 0.9));
      } else {
        const local = latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS * 2.2);
        targetCamPos = curMoonPos.clone().add(local);
        targetCamLook = curMoonPos.clone().add(latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS * 0.9));
      }
    };

    setupCameraTarget();

    // 9. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const st = liveStateRef.current;

      // Check if site selection changed to rebuild beacons
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

      // Rotate Earth & Sun Corona Pulse
      earthMesh.rotation.y = elapsedTime * 0.05;
      const coronaScale = 1 + 0.04 * Math.sin(elapsedTime * 2);
      coronaMesh.scale.setScalar(coronaScale);

      // Compute Moon orbital position
      const synodicPeriod = 29.530588853 * 24 * 3600;
      const tSec = st.currentDate.getTime() / 1000;
      const moonAngle = ((tSec % synodicPeriod) / synodicPeriod) * Math.PI * 2;
      const moonPos = new THREE.Vector3(
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle * 0.08) * 0.3,
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS
      );
      moonGroup.position.copy(moonPos);

      // World positions of Site A and Site B
      const siteALocal = latLonToVec3(st.selectedSiteA.latitude, st.selectedSiteA.longitude, MOON_RADIUS);
      const siteBLocal = latLonToVec3(st.selectedSiteB.latitude, st.selectedSiteB.longitude, MOON_RADIUS);
      const siteAWorld = siteALocal.clone().add(moonPos);
      const siteBWorld = siteBLocal.clone().add(moonPos);
      const earthCenter = new THREE.Vector3(0, 0, 0);

      // Update Solar Ray Beams
      const updateLine = (line: THREE.Line, start: THREE.Vector3, end: THREE.Vector3, isVisible: boolean, clearColor: number) => {
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, start.x, start.y, start.z);
        posAttr.setXYZ(1, end.x, end.y, end.z);
        posAttr.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).color.setHex(isVisible ? clearColor : 0xef4444);
        (line.material as THREE.LineBasicMaterial).opacity = isVisible ? 0.85 : 0.45;
      };

      updateLine(solarRayA, SUN_POS, siteAWorld, st.isSunVisibleA, 0xf59e0b);
      updateLine(solarRayB, SUN_POS, siteBWorld, st.isSunVisibleB, 0xf59e0b);
      updateLine(commsRayA, earthCenter, siteAWorld, st.isEarthVisibleA, 0x38bdf8);
      updateLine(commsRayB, earthCenter, siteBWorld, st.isEarthVisibleB, 0x38bdf8);

      // Smooth camera interpolation towards target
      if (targetCamPos && targetCamLook) {
        camera.position.lerp(targetCamPos, 0.04);
        controls.target.lerp(targetCamLook, 0.04);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 11. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full select-none" />;
}
