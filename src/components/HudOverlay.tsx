"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Orbit,
  BarChart3,
  Compass,
  Crosshair,
  ShieldAlert,
  Moon,
  Menu,
  ArrowLeftRight,
  Sliders,
} from "lucide-react";
import { CandidateSite, ComparisonResponse, TimeStepTelemetry } from "@/lib/types";
import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { KpiRings } from "./KpiRings";
import { ElevationChart } from "./ElevationChart";
import { VisibilityTimeline } from "./VisibilityTimeline";
import { HorizonRadar } from "./HorizonRadar";
import { TradeOffExplainer } from "./TradeOffExplainer";
import { ExportReport } from "./ExportReport";
import { SoundWidget } from "./SoundWidget";
import { soundEngine } from "@/lib/sound-engine";
import type { CameraMode } from "./LunarScene3D";

type ViewMode = "3d" | "analytics";

interface HudOverlayProps {
  viewMode: ViewMode;
  cameraMode: CameraMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSelectSiteA: (site: CandidateSite) => void;
  onSelectSiteB: (site: CandidateSite) => void;
  onSwapSites: () => void;
  startDate: string;
  endDate: string;
  stepHours: number;
  isLoading: boolean;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onStepHoursChange: (h: number) => void;
  onRunAnalysis: () => void;
  onApplyPreset: (s: string, e: string) => void;
  comparisonData: ComparisonResponse | null;
  currentStepA: TimeStepTelemetry | null;
  currentStepB: TimeStepTelemetry | null;
}

export function HudOverlay({
  viewMode,
  cameraMode,
  onViewModeChange,
  onCameraModeChange,
  selectedSiteA,
  selectedSiteB,
  onSelectSiteA,
  onSelectSiteB,
  onSwapSites,
  startDate,
  endDate,
  stepHours,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onStepHoursChange,
  onRunAnalysis,
  onApplyPreset,
  comparisonData,
  currentStepA,
  currentStepB,
}: HudOverlayProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  const cameraModes: { key: CameraMode; label: string; icon: React.ReactNode }[] = [
    { key: "system", label: "System Orbit", icon: <Orbit className="w-3.5 h-3.5" /> },
    { key: "southPole", label: "Lunar South Pole", icon: <Compass className="w-3.5 h-3.5" /> },
    { key: "siteA", label: "Site A Lock", icon: <Crosshair className="w-3.5 h-3.5" /> },
    { key: "siteB", label: "Site B Lock", icon: <Crosshair className="w-3.5 h-3.5" /> },
  ];

  const handleCameraChange = (key: CameraMode) => {
    soundEngine?.playClick();
    onCameraModeChange(key);
  };

  const handleViewChange = (mode: ViewMode) => {
    soundEngine?.playClick();
    onViewModeChange(mode);
  };

  const handleSwap = () => {
    soundEngine?.playClick();
    onSwapSites();
  };

  const handleSiteSelectA = (site: CandidateSite) => {
    soundEngine?.playBeaconSelect();
    onSelectSiteA(site);
  };

  const handleSiteSelectB = (site: CandidateSite) => {
    soundEngine?.playBeaconSelect();
    onSelectSiteB(site);
  };

  const handlePreset = (s: string, e: string) => {
    soundEngine?.playClick();
    onApplyPreset(s, e);
  };

  const handleTriggerAnalysis = () => {
    soundEngine?.playBeaconSelect();
    onRunAnalysis();
  };

  return (
    <>
      {/* ── TOP FLOATING HEADER BAR ───────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-2.5 glass-panel rounded-xl px-3 py-1.5 shadow-glass">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/25 via-sky-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm tracking-tight leading-none">LunarOps</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v2.6 3D
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 leading-none mt-1">
              NASA Space Apps 2026 • CLPS Browser
            </div>
          </div>
        </div>

        {/* View Switcher: 🌌 3D Orbital HUD vs 📊 Full Analytics */}
        <div className="flex items-center glass-panel rounded-xl p-1 gap-1 shadow-glass">
          <button
            onClick={() => handleViewChange("3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === "3d"
                ? "bg-amber-500 text-space-950 font-bold shadow-solar-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>🌌 3D Orbital HUD</span>
          </button>
          <button
            onClick={() => handleViewChange("analytics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              viewMode === "analytics"
                ? "bg-sky-500 text-space-950 font-bold shadow-earth-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 Full Analytics</span>
          </button>
        </div>

        {/* Camera Mode Toggles (System Orbit, Lunar South Pole, Site A Lock, Site B Lock) */}
        {viewMode === "3d" && (
          <div className="flex items-center glass-panel rounded-xl p-1 gap-0.5 shadow-glass">
            {cameraModes.map((cm) => (
              <button
                key={cm.key}
                onClick={() => handleCameraChange(cm.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                  cameraMode === cm.key
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "text-slate-400 hover:text-white"
                }`}
                title={`Switch camera to ${cm.label}`}
              >
                {cm.icon}
                <span className="hidden md:inline">{cm.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Sound Synthesizer Engine Widget */}
          <SoundWidget />

          {/* Scientific Disclaimer Toggle Badge */}
          <button
            onClick={() => {
              soundEngine?.playClick();
              setShowFullDisclaimer((p) => !p);
            }}
            className="flex items-center gap-1.5 glass-panel rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-amber-300 border border-amber-500/30 hover:border-amber-500/60 transition-colors shadow-glass"
            title="Click to view full NASA scientific disclaimer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Scientific Disclaimer</span>
          </button>

          {/* Right Analytics Drawer Toggle Button (in 3D mode) */}
          {viewMode === "3d" && comparisonData && (
            <button
              onClick={() => {
                soundEngine?.playClick();
                setRightOpen((p) => !p);
              }}
              className={`glass-panel rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono transition-all shadow-glass ${
                rightOpen ? "bg-sky-500/20 text-sky-300 border-sky-500/50" : "text-slate-300 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Analytics Drawer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── EXPANDABLE SCIENTIFIC DISCLAIMER MODAL / BANNER ───────────────── */}
      {showFullDisclaimer && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl glass-panel rounded-xl p-3.5 border-2 border-amber-500/50 shadow-solar-glow animate-fadeIn">
          <div className="flex items-start justify-between gap-3 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold block mb-1">
                  NASA SPACE APPS SCIENTIFIC DISCLAIMER:
                </strong>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  "Seeing the Sun does not directly calculate electrical power, and seeing Earth does not guarantee a successful radio connection. LunarOps measures potential illumination and line-of-sight windows above local LOLA lunar terrain."
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFullDisclaimer(false)}
              className="px-2 py-0.5 rounded bg-space-800 text-slate-400 hover:text-white border border-space-700 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── LEFT COLLAPSIBLE DOCK (Site Selector, Dates, Presets, KPI Rings) ─ */}
      {viewMode === "3d" && (
        <>
          <div
            className={`absolute left-3 top-16 bottom-24 z-20 w-80 hud-slide-left flex flex-col gap-2.5 ${
              leftOpen ? "translate-x-0 opacity-100" : "-translate-x-84 opacity-0 pointer-events-none"
            }`}
          >
            {/* Collapse toggle */}
            <button
              onClick={() => {
                soundEngine?.playClick();
                setLeftOpen(false);
              }}
              className="absolute -right-8 top-2 glass-panel w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
              title="Collapse Dock"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {/* Site A Card */}
              <div className="glass-panel rounded-xl p-3 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Site A — Target
                  </span>
                  <button
                    onClick={handleSwap}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Swap Site A and Site B"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-bold text-white truncate">{selectedSiteA.name}</div>
                <div className="text-[10px] font-mono text-amber-300 mt-0.5">{selectedSiteA.coordinatesDisplay}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{selectedSiteA.targetMission}</div>

                {/* Candidate Sites Dropdown / Picker */}
                <select
                  value={selectedSiteA.id}
                  onChange={(e) => {
                    const found = CANDIDATE_SITES.find((s) => s.id === e.target.value);
                    if (found) handleSiteSelectA(found);
                  }}
                  className="w-full mt-2 bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {CANDIDATE_SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.badge}: {site.name} ({site.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Site B Card */}
              <div className="glass-panel rounded-xl p-3 border-l-4 border-l-sky-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                    Site B — Benchmark
                  </span>
                </div>
                <div className="text-sm font-bold text-white truncate">{selectedSiteB.name}</div>
                <div className="text-[10px] font-mono text-sky-300 mt-0.5">{selectedSiteB.coordinatesDisplay}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{selectedSiteB.targetMission}</div>

                <select
                  value={selectedSiteB.id}
                  onChange={(e) => {
                    const found = CANDIDATE_SITES.find((s) => s.id === e.target.value);
                    if (found) handleSiteSelectB(found);
                  }}
                  className="w-full mt-2 bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {CANDIDATE_SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.badge}: {site.name} ({site.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Side-by-Side KPI Rings */}
              {comparisonData && (
                <div className="grid grid-cols-2 gap-2">
                  <KpiRings
                    sunPct={comparisonData.siteA.sunVisiblePct}
                    earthPct={comparisonData.siteA.earthVisiblePct}
                    dualPct={comparisonData.siteA.dualVisiblePct}
                    siteLabel={`A: ${comparisonData.siteA.site.name.split(" ")[0]}`}
                    siteColor="amber"
                    currentStep={currentStepA}
                  />
                  <KpiRings
                    sunPct={comparisonData.siteB.sunVisiblePct}
                    earthPct={comparisonData.siteB.earthVisiblePct}
                    dualPct={comparisonData.siteB.dualVisiblePct}
                    siteLabel={`B: ${comparisonData.siteB.site.name.split(" ")[0]}`}
                    siteColor="sky"
                    currentStep={currentStepB}
                  />
                </div>
              )}

              {/* UTC Dates & Presets Control Panel */}
              <div className="glass-panel rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <span>Mission Ephemeris Time</span>
                  <Sliders className="w-3 h-3 text-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 block mb-0.5">START UTC</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 block mb-0.5">END UTC</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: "7-Day", start: "2027-01-01", end: "2027-01-07" },
                    { label: "14-Day", start: "2027-01-01", end: "2027-01-15" },
                    { label: "29.5-Day", start: "2027-01-01", end: "2027-01-30" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePreset(preset.start, preset.end)}
                      className="py-1 rounded-lg text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-center"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Run Analysis Trigger */}
                <button
                  onClick={handleTriggerAnalysis}
                  disabled={isLoading}
                  className={`w-full py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-solar-glow ${
                    isLoading
                      ? "bg-amber-600/50 text-amber-200 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-400 text-space-950 active:scale-95"
                  }`}
                >
                  {isLoading ? "CALCULATING LOLA MASKS…" : "▶ RUN ANALYSIS"}
                </button>
              </div>
            </div>
          </div>

          {/* Left Dock Open Button (when collapsed) */}
          {!leftOpen && (
            <button
              onClick={() => {
                soundEngine?.playClick();
                setLeftOpen(true);
              }}
              className="absolute left-3 top-16 z-20 glass-panel w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-glass"
              title="Open Mission Controls"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {/* ── RIGHT EXPANDABLE ANALYTICS DRAWER (in 3D mode) ────────────────── */}
      {viewMode === "3d" && comparisonData && (
        <div
          className={`absolute right-3 top-16 bottom-24 z-20 w-[540px] max-w-[90vw] hud-slide-right flex flex-col gap-3 ${
            rightOpen ? "translate-x-0 opacity-100" : "translate-x-[560px] opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => {
              soundEngine?.playClick();
              setRightOpen(false);
            }}
            className="absolute -left-8 top-3 glass-panel w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
            title="Close Drawer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            <ElevationChart siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
            <VisibilityTimeline siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
            <HorizonRadar siteA={comparisonData.siteA} siteB={comparisonData.siteB} />
            <TradeOffExplainer
              summary={comparisonData.summaryNarrative}
              siteA={comparisonData.siteA}
              siteB={comparisonData.siteB}
            />
            <ExportReport data={comparisonData} />
          </div>
        </div>
      )}
    </>
  );
}
