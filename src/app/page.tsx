"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense, Component, ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { analyzeSiteVisibility } from "@/lib/astronomical";
import { generateNarrativeSummary } from "@/lib/narrative";
import { evaluateLunarSite, fetchComparison } from "@/lib/api";
import { CandidateSite, ComparisonResponse, LunarEvaluationResult, TimeStepTelemetry } from "@/lib/types";

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
  () => import("@/components/LunarScene3D").then((mod) => mod.LunarScene3D || mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-cyan-400 font-mono text-sm tracking-widest">
        [ INITIALIZING 3D CELESTIAL ENGINE... ]
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
  const [spiceEvaluationA, setSpiceEvaluationA] = useState<LunarEvaluationResult | null>(null);
  const [spiceEvaluationB, setSpiceEvaluationB] = useState<LunarEvaluationResult | null>(null);

  // ── View & camera mode ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [cameraMode, setCameraMode] = useState<CameraMode>("system");
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  // ── Time player ───────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(10);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch NASA JPL SPICE Single-Site Evaluation ─────────────────────────────
  const fetchSpiceEvaluation = useCallback(async (siteA: CandidateSite, siteB: CandidateSite, dateStr: string) => {
    try {
      const ts = `${dateStr}T12:00:00Z`;
      const [resA, resB] = await Promise.all([
        evaluateLunarSite(siteA.latitude, siteA.longitude, ts),
        evaluateLunarSite(siteB.latitude, siteB.longitude, ts),
      ]);
      setSpiceEvaluationA(resA);
      setSpiceEvaluationB(resB);
    } catch (err) {
      console.warn("[LunarOps] SPICE evaluation fetch error:", err);
    }
  }, []);

  // ── Compute analysis ───────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setIsPlaying(false);
    try {
      // 1. Fetch side-by-side time-series data from FastAPI /api/compare
      const comp = await fetchComparison(selectedSiteA, selectedSiteB, startDate, endDate, stepHours);
      setComparisonData(comp);

      // 2. Fetch NASA JPL SPICE evaluations from FastAPI POST /api/lunar-evaluation
      await fetchSpiceEvaluation(selectedSiteA, selectedSiteB, startDate);
    } catch (err) {
      console.error("Analysis calculation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSiteA, selectedSiteB, startDate, endDate, stepHours, fetchSpiceEvaluation]);

  // Initial run on mount
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch SPICE evaluation when candidate site selection changes
  useEffect(() => {
    fetchSpiceEvaluation(selectedSiteA, selectedSiteB, startDate);
  }, [selectedSiteA, selectedSiteB, startDate, fetchSpiceEvaluation]);

  // ── Playback ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (playInterval.current) clearInterval(playInterval.current);
    if (!isPlaying || !comparisonData?.siteA?.telemetry?.length) return;
    const total = comparisonData.siteA.telemetry.length;

    // Calculate tick delay and step based on speed multiplier
    let tickDelay = 120;
    let stepIncrement = 1;
    if (playSpeed === 0.5) {
      tickDelay = 240;
      stepIncrement = 1;
    } else if (playSpeed === 1) {
      tickDelay = 150;
      stepIncrement = 1;
    } else if (playSpeed === 2) {
      tickDelay = 80;
      stepIncrement = 1;
    } else {
      tickDelay = 100;
      stepIncrement = Math.max(1, Math.floor(playSpeed / 10));
    }

    playInterval.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + stepIncrement;
        if (next >= total) {
          setIsPlaying(false);
          return total - 1;
        }
        return next;
      });
    }, tickDelay);
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
        spiceEvaluationA={spiceEvaluationA}
        spiceEvaluationB={spiceEvaluationB}
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
