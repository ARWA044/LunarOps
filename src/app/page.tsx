"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense, Component, ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { analyzeSiteVisibility } from "@/lib/astronomical";
import { generateNarrativeSummary } from "@/lib/narrative";
import { CandidateSite, ComparisonResponse, TimeStepTelemetry } from "@/lib/types";

import { HudOverlay } from "@/components/HudOverlay";
import { TimePlayer } from "@/components/TimePlayer";
import { SiteSelector } from "@/components/SiteSelector";
import { LunarMap } from "@/components/LunarMap";
import { Controls } from "@/components/Controls";
import { KpiCards } from "@/components/KpiCards";
import { ElevationChart } from "@/components/ElevationChart";
import { VisibilityTimeline } from "@/components/VisibilityTimeline";
import { HorizonRadar } from "@/components/HorizonRadar";
import { TradeOffExplainer } from "@/components/TradeOffExplainer";
import { ExportReport } from "@/components/ExportReport";
import { soundEngine } from "@/lib/sound-engine";
import type { CameraMode } from "@/components/LunarScene3D";

// Error Boundary to prevent any WebGL context crash from breaking the UI
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D WebGL scene error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-space-950 text-slate-400 font-mono text-xs p-4 text-center">
          <div>
            <p className="text-amber-400 font-bold mb-1">3D WebGL Context Suspended</p>
            <p>Switch to "📊 Full Analytics" mode to view all 2D charts and mission datasets.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamic import of the pure native Three.js 3D canvas (client-only, SSR disabled)
const LunarScene3D = dynamic(
  () => import("@/components/LunarScene3D").then((m) => ({ default: m.LunarScene3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-space-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading 3D Celestial Engine…</p>
        </div>
      </div>
    ),
  }
);

type ViewMode = "3d" | "analytics";

export default function Home() {
  // ── Site selection ─────────────────────────────────────────────────────────
  const [selectedSiteA, setSelectedSiteA] = useState<CandidateSite>(CANDIDATE_SITES[0]);
  const [selectedSiteB, setSelectedSiteB] = useState<CandidateSite>(CANDIDATE_SITES[1]);

  // ── Date / step controls ───────────────────────────────────────────────────
  const [startDate, setStartDate] = useState("2027-01-01");
  const [endDate, setEndDate] = useState("2027-01-07");
  const [stepHours, setStepHours] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // ── Comparison data ────────────────────────────────────────────────────────
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);

  // ── View & camera mode ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [cameraMode, setCameraMode] = useState<CameraMode>("system");
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  // ── Time player ───────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(10);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Compute analysis ───────────────────────────────────────────────────────
  const runAnalysis = useCallback(() => {
    setIsLoading(true);
    setCurrentIndex(0);
    setIsPlaying(false);
    setTimeout(() => {
      try {
        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T23:59:59Z`);
        const siteAResult = analyzeSiteVisibility(selectedSiteA, start, end, stepHours);
        const siteBResult = analyzeSiteVisibility(selectedSiteB, start, end, stepHours);
        const narrative = generateNarrativeSummary(siteAResult, siteBResult, startDate, endDate);
        setComparisonData({
          siteA: siteAResult,
          siteB: siteBResult,
          dateRange: { start: start.toISOString(), end: end.toISOString(), stepHours },
          generatedAt: new Date().toISOString(),
          summaryNarrative: narrative,
          engine: "typescript-client",
        });
      } catch (err) {
        console.error("Analysis calculation error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 150);
  }, [selectedSiteA, selectedSiteB, startDate, endDate, stepHours]);

  // Initial run on mount
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (playInterval.current) clearInterval(playInterval.current);
    if (!isPlaying || !comparisonData?.siteA?.telemetry?.length) return;
    const total = comparisonData.siteA.telemetry.length;
    playInterval.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + Math.max(1, Math.floor(playSpeed / 10));
        if (next >= total) {
          setIsPlaying(false);
          return total - 1;
        }
        return next;
      });
    }, 120);
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, playSpeed, comparisonData]);

  // ── Derived current telemetry step (fully defensive) ──────────────────────
  const currentStepA: TimeStepTelemetry | null =
    comparisonData?.siteA?.telemetry?.[currentIndex] ?? null;
  const currentStepB: TimeStepTelemetry | null =
    comparisonData?.siteB?.telemetry?.[currentIndex] ?? null;

  // Current date for 3D scene (driven by timeline scrubber)
  const currentDate =
    currentStepA?.timestamp
      ? new Date(currentStepA.timestamp)
      : new Date(`${startDate}T00:00:00Z`);

  // Swap sites
  const handleSwapSites = useCallback(() => {
    setSelectedSiteA((prevA) => {
      setSelectedSiteB(prevA);
      return selectedSiteB;
    });
  }, [selectedSiteB]);

  // 3D scene site click
  const handleSiteClick = useCallback((site: CandidateSite, slot: "A" | "B") => {
    soundEngine?.playBeaconSelect();
    if (slot === "A") setSelectedSiteA(site);
    else setSelectedSiteB(site);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-space-950">
      {/* ── 3D VIEWPORT (full-screen background) ─────────────────────────── */}
      {viewMode === "3d" && (
        <div className="absolute inset-0 z-0">
          <WebGLErrorBoundary>
            <Suspense fallback={null}>
              <LunarScene3D
                cameraMode={cameraMode}
                selectedSiteA={selectedSiteA}
                selectedSiteB={selectedSiteB}
                currentDate={currentDate}
                isSunVisibleA={currentStepA?.isSunVisible ?? false}
                isSunVisibleB={currentStepB?.isSunVisible ?? false}
                isEarthVisibleA={currentStepA?.isEarthVisible ?? false}
                isEarthVisibleB={currentStepB?.isEarthVisible ?? false}
                isAnalysisMode={isAnalysisMode}
                onSiteClick={handleSiteClick}
                sites={CANDIDATE_SITES}
              />
            </Suspense>
          </WebGLErrorBoundary>
        </div>
      )}

      {/* ── FULL ANALYTICS VIEW (scrollable split-view) ──────────────────── */}
      {viewMode === "analytics" && (
        <div className="absolute inset-0 z-10 overflow-y-auto bg-[#04070D] bg-telemetry-grid text-slate-100">
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.06),rgba(255,255,255,0))]" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 pt-24 pb-24 space-y-6 relative z-10"
          >
            {/* Controls Bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.05 }}
            >
              <Controls
                startDate={startDate}
                endDate={endDate}
                stepHours={stepHours}
                isLoading={isLoading}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onStepHoursChange={setStepHours}
                onRunAnalysis={runAnalysis}
                onApplyPreset={(s, e) => { setStartDate(s); setEndDate(e); }}
              />
            </motion.div>

            {/* Site Selector & Interactive 2D Lunar Map */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-7">
                <SiteSelector
                  sites={CANDIDATE_SITES}
                  selectedSiteA={selectedSiteA}
                  selectedSiteB={selectedSiteB}
                  onSelectSiteA={setSelectedSiteA}
                  onSelectSiteB={setSelectedSiteB}
                  onSwapSites={handleSwapSites}
                />
              </div>
              <div className="lg:col-span-5">
                <LunarMap
                  sites={CANDIDATE_SITES}
                  selectedSiteA={selectedSiteA}
                  selectedSiteB={selectedSiteB}
                  onSelectSiteA={setSelectedSiteA}
                  onSelectSiteB={setSelectedSiteB}
                />
              </div>
            </motion.div>

            {/* Comparison Charts & Dashboards */}
            {comparisonData ? (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.15 }}
                >
                  <KpiCards siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.2 }}
                >
                  <ElevationChart siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.25 }}
                >
                  <VisibilityTimeline siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.3 }}
                >
                  <HorizonRadar siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.35 }}
                >
                  <TradeOffExplainer
                    summary={comparisonData.summaryNarrative}
                    siteA={comparisonData.siteA}
                    siteB={comparisonData.siteB}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 120, delay: 0.4 }}
                >
                  <ExportReport data={comparisonData} />
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 font-mono text-sm">
                {isLoading ? "Computing mission telemetry…" : "Run analysis to view charts."}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── FLOATING COCKPIT HUD OVERLAY (Header, Dock, Drawer) ──────────── */}
      <HudOverlay
        viewMode={viewMode}
        cameraMode={cameraMode}
        onViewModeChange={setViewMode}
        onCameraModeChange={setCameraMode}
        selectedSiteA={selectedSiteA}
        selectedSiteB={selectedSiteB}
        onSelectSiteA={setSelectedSiteA}
        onSelectSiteB={setSelectedSiteB}
        onSwapSites={handleSwapSites}
        startDate={startDate}
        endDate={endDate}
        stepHours={stepHours}
        isLoading={isLoading}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onStepHoursChange={setStepHours}
        onRunAnalysis={runAnalysis}
        onApplyPreset={(s, e) => { setStartDate(s); setEndDate(e); }}
        isAnalysisMode={isAnalysisMode}
        onToggleAnalysisMode={() => setIsAnalysisMode((p) => !p)}
        comparisonData={comparisonData}
        currentStepA={currentStepA}
        currentStepB={currentStepB}
      />

      {/* ── BOTTOM INTERACTIVE TIME PLAYER (in 3D mode) ─────────────────── */}
      {viewMode === "3d" && comparisonData && (
        <div className="absolute bottom-3 left-3 right-3 z-30">
          <TimePlayer
            telemetryA={comparisonData?.siteA?.telemetry ?? []}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            playSpeed={playSpeed}
            onIndexChange={setCurrentIndex}
            onPlayToggle={() => setIsPlaying((p) => !p)}
            onSpeedChange={setPlaySpeed}
            currentStepA={currentStepA}
            currentStepB={currentStepB}
          />
        </div>
      )}
    </div>
  );
}
