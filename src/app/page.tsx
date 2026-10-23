"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";

import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { analyzeSiteVisibility } from "@/lib/astronomical";
import { generateNarrativeSummary } from "@/lib/narrative";
import { CandidateSite, ComparisonResponse, TimeStepTelemetry } from "@/lib/types";

import { HudOverlay } from "@/components/HudOverlay";
import { TimePlayer } from "@/components/TimePlayer";
import { KpiCards } from "@/components/KpiCards";
import { ElevationChart } from "@/components/ElevationChart";
import { VisibilityTimeline } from "@/components/VisibilityTimeline";
import { HorizonRadar } from "@/components/HorizonRadar";
import { TradeOffExplainer } from "@/components/TradeOffExplainer";
import { ExportReport } from "@/components/ExportReport";

// Dynamic import of the heavy 3D canvas (client-only, SSR disabled)
const LunarScene3D = dynamic(
  () => import("@/components/LunarScene3D").then((m) => ({ default: m.LunarScene3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Initialising 3D WebGL Engine…</p>
        </div>
      </div>
    ),
  }
);

type ViewMode = "3d" | "analytics";
type CameraMode = "system" | "globe" | "siteA" | "siteB";

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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, [selectedSiteA, selectedSiteB, startDate, endDate, stepHours]);

  // Initial run
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (playInterval.current) clearInterval(playInterval.current);
    if (!isPlaying || !comparisonData) return;
    const total = comparisonData.siteA.telemetry.length;
    playInterval.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + playSpeed;
        if (next >= total) {
          setIsPlaying(false);
          return total - 1;
        }
        return next;
      });
    }, 250);
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, playSpeed, comparisonData]);

  // ── Derived current telemetry step ────────────────────────────────────────
  const currentStepA: TimeStepTelemetry | null =
    comparisonData?.siteA.telemetry[currentIndex] ?? null;
  const currentStepB: TimeStepTelemetry | null =
    comparisonData?.siteB.telemetry[currentIndex] ?? null;

  // Current date for 3D scene (driven by timeline scrubber)
  const currentDate =
    currentStepA ? new Date(currentStepA.timestamp) : new Date(`${startDate}T00:00:00Z`);

  // Swap sites
  const handleSwapSites = useCallback(() => {
    setSelectedSiteA(selectedSiteB);
    setSelectedSiteB(selectedSiteA);
  }, [selectedSiteA, selectedSiteB]);

  // 3D scene site click
  const handleSiteClick = useCallback((site: CandidateSite, slot: "A" | "B") => {
    if (slot === "A") setSelectedSiteA(site);
    else setSelectedSiteB(site);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-space-950">
      {/* ── 3D VIEWPORT (full-screen background) ─────────────────────────── */}
      {viewMode === "3d" && (
        <div className="absolute inset-0 z-0">
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
              onSiteClick={handleSiteClick}
              sites={CANDIDATE_SITES}
            />
          </Suspense>
        </div>
      )}

      {/* ── ANALYTICS VIEW (full-screen scrollable panel) ─────────────────── */}
      {viewMode === "analytics" && (
        <div className="absolute inset-0 z-0 overflow-y-auto bg-telemetry-grid bg-space-950">
          <div className="max-w-6xl mx-auto px-4 py-24 space-y-6">
            {comparisonData ? (
              <>
                <KpiCards siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                <ElevationChart siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                <VisibilityTimeline siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                <HorizonRadar siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
                <TradeOffExplainer
                  summary={comparisonData.summaryNarrative}
                  siteA={comparisonData.siteA}
                  siteB={comparisonData.siteB}
                />
                <ExportReport data={comparisonData} />
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-sm">
                {isLoading ? "Computing mission telemetry…" : "Run analysis to view charts."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING COCKPIT HUD OVERLAY ─────────────────────────────────── */}
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
        comparisonData={comparisonData}
        currentStepA={currentStepA}
        currentStepB={currentStepB}
      />

      {/* ── BOTTOM TIME PLAYER ────────────────────────────────────────────── */}
      {comparisonData && (
        <div className="absolute bottom-3 left-3 right-3 z-30">
          <TimePlayer
            telemetryA={comparisonData.siteA.telemetry}
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
