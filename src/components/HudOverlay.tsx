"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers,
  Sparkles,
  BookOpen,
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
import { StoryGuide } from "./StoryGuide";
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
  isAnalysisMode: boolean;
  onToggleAnalysisMode: () => void;
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
  isAnalysisMode,
  onToggleAnalysisMode,
  comparisonData,
  currentStepA,
  currentStepB,
}: HudOverlayProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
  const [leftTab, setLeftTab] = useState<"story" | "manual">("story");

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
      {/* ── FLOATING DETACHED ISLAND NAVBAR (TOP CENTER) ───────────────────── */}
      <div className="absolute top-4 left-0 right-0 z-30 flex justify-center items-center pointer-events-none px-3 sm:px-6">
        <motion.header
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
          className="pointer-events-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 rounded-full bg-slate-950/60 backdrop-blur-3xl border border-white/10 px-3.5 py-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          {/* Brand & Mission Badge */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500/30 to-cyan-500/30 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Moon className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-white text-xs tracking-tight">LunarOps</span>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  v2.6
                </span>
              </div>
              <div className="text-[8px] font-mono tracking-widest-xl text-slate-400 uppercase hidden sm:block">
                NASA Space Apps
              </div>
            </div>
          </div>

          {/* View Switcher: 🌌 3D Orbital HUD vs 📊 Full Analytics (Sliding Magnetic Pill) */}
          <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/[0.08] relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange("3d")}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-medium transition-colors light-sheen ${
                viewMode === "3d" ? "text-space-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              {viewMode === "3d" && (
                <motion.div
                  layoutId="activeNavView"
                  className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_16px_rgba(245,158,11,0.5)] z-[-1]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Orbit className="w-3.5 h-3.5" />
              <span>3D Orbital HUD</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange("analytics")}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-medium transition-colors light-sheen ${
                viewMode === "analytics" ? "text-space-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              {viewMode === "analytics" && (
                <motion.div
                  layoutId="activeNavView"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full shadow-[0_0_16px_rgba(0,240,255,0.5)] z-[-1]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full Analytics</span>
            </motion.button>
          </div>

          {/* Camera Modes (in 3D mode) */}
          {viewMode === "3d" && (
            <div className="hidden lg:flex items-center bg-black/30 rounded-full p-0.5 border border-white/[0.06]">
              {cameraModes.map((cm) => (
                <button
                  key={cm.key}
                  onClick={() => handleCameraChange(cm.key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
                    cameraMode === cm.key
                      ? "bg-white/15 text-white font-bold border border-white/20 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={`Switch camera to ${cm.label}`}
                >
                  {cm.icon}
                  <span>{cm.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Holographic 3D Analysis Mode Toggle */}
          {viewMode === "3d" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundEngine?.playClick();
                onToggleAnalysisMode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all border light-sheen ${
                isAnalysisMode
                  ? "bg-cyan-500 text-space-950 border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.7)] animate-pulse"
                  : "bg-white/[0.04] text-cyan-300 border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10"
              }`}
              title="Toggle Holographic Blueprint / X-Ray Wireframe Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAnalysisMode ? "Holo: ON" : "Analysis Mode"}</span>
            </motion.button>
          )}

          {/* Actions Right Group */}
          <div className="flex items-center gap-1.5 pl-1">
            <SoundWidget />

            <button
              onClick={() => {
                soundEngine?.playClick();
                setShowFullDisclaimer((p) => !p);
              }}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[10px] font-mono text-amber-300 border border-amber-500/25 transition-colors"
              title="Click to view NASA scientific disclaimer"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="hidden xl:inline">Disclaimer</span>
            </button>

            {viewMode === "3d" && comparisonData && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundEngine?.playClick();
                  setRightOpen((p) => !p);
                }}
                className={`rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-mono transition-all border ${
                  rightOpen
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Drawer</span>
              </motion.button>
            )}
          </div>
        </motion.header>
      </div>

      {/* ── EXPANDABLE SCIENTIFIC DISCLAIMER MODAL / BANNER ───────────────── */}
      {showFullDisclaimer && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bento-card rounded-2xl p-4 border border-amber-500/40 shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-fadeIn">
          <div className="flex items-start justify-between gap-3 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold block mb-1 text-[11px] tracking-wider uppercase">
                  NASA Space Apps Scientific Disclaimer:
                </strong>
                <p className="text-slate-200 leading-relaxed text-[11px] font-sans">
                  "Seeing the Sun does not directly calculate electrical power, and seeing Earth does not guarantee a successful radio connection. LunarOps measures potential illumination and line-of-sight windows above local LOLA lunar terrain."
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFullDisclaimer(false)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors"
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
            className={`absolute left-3 top-18 bottom-24 z-20 w-84 hud-slide-left flex flex-col gap-2.5 ${
              leftOpen ? "translate-x-0 opacity-100" : "-translate-x-88 opacity-0 pointer-events-none"
            }`}
          >
            {/* Collapse toggle */}
            <button
              onClick={() => {
                soundEngine?.playClick();
                setLeftOpen(false);
              }}
              className="absolute -right-8 top-2 bento-card w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
              title="Collapse Dock"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Dock Tab Selector: Story Mode vs Manual Telemetry */}
            <div className="flex items-center bento-card rounded-full p-1 gap-1 shrink-0">
              <button
                onClick={() => {
                  soundEngine?.playClick();
                  setLeftTab("story");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                  leftTab === "story"
                    ? "bg-gradient-to-r from-amber-500/25 to-sky-500/25 text-white font-bold border border-white/20 shadow-solar-glow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Story Guide</span>
              </button>
              <button
                onClick={() => {
                  soundEngine?.playClick();
                  setLeftTab("manual");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                  leftTab === "manual"
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Manual HUD</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {leftTab === "story" ? (
                <StoryGuide
                  selectedSiteA={selectedSiteA}
                  selectedSiteB={selectedSiteB}
                  onSelectSiteA={handleSiteSelectA}
                  onSelectSiteB={handleSiteSelectB}
                  onCameraModeChange={handleCameraChange}
                  startDate={startDate}
                  endDate={endDate}
                  stepHours={stepHours}
                  onStartDateChange={onStartDateChange}
                  onEndDateChange={onEndDateChange}
                  onApplyPreset={handlePreset}
                  onRunAnalysis={handleTriggerAnalysis}
                  isAnalysisMode={isAnalysisMode}
                  onToggleAnalysisMode={onToggleAnalysisMode}
                  isLoading={isLoading}
                  onOpenAnalyticsDrawer={() => setRightOpen(true)}
                />
              ) : (
                <>
                  {/* Site A Card */}
                  <div className="bento-card rounded-2xl p-3.5 border-l-2 border-l-amber-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-amber-400 font-semibold tracking-widest-xl uppercase">
                        Site A — Target
                      </span>
                      <button
                        onClick={handleSwap}
                        className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                        title="Swap Site A and Site B"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-sm font-display font-bold text-white truncate">{selectedSiteA.name}</div>
                    <div className="text-[10px] font-mono text-amber-300 mt-0.5">{selectedSiteA.coordinatesDisplay}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{selectedSiteA.targetMission}</div>

                    {/* Candidate Sites Dropdown / Picker */}
                    <select
                      value={selectedSiteA.id}
                      onChange={(e) => {
                        const found = CANDIDATE_SITES.find((s) => s.id === e.target.value);
                        if (found) handleSiteSelectA(found);
                      }}
                      className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      {CANDIDATE_SITES.map((site) => (
                        <option key={site.id} value={site.id} className="bg-slate-900 text-white">
                          {site.badge}: {site.name} ({site.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Site B Card */}
                  <div className="bento-card rounded-2xl p-3.5 border-l-2 border-l-cyan-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-widest-xl uppercase">
                        Site B — Benchmark
                      </span>
                    </div>
                    <div className="text-sm font-display font-bold text-white truncate">{selectedSiteB.name}</div>
                    <div className="text-[10px] font-mono text-cyan-300 mt-0.5">{selectedSiteB.coordinatesDisplay}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{selectedSiteB.targetMission}</div>

                    <select
                      value={selectedSiteB.id}
                      onChange={(e) => {
                        const found = CANDIDATE_SITES.find((s) => s.id === e.target.value);
                        if (found) handleSiteSelectB(found);
                      }}
                      className="w-full mt-2 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      {CANDIDATE_SITES.map((site) => (
                        <option key={site.id} value={site.id} className="bg-slate-900 text-white">
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
                  <div className="bento-card rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tracking-widest-xl uppercase">
                      <span>Mission Ephemeris</span>
                      <Sliders className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-mono tracking-widest uppercase text-slate-500 block mb-0.5">START UTC</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => onStartDateChange(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono tracking-widest uppercase text-slate-500 block mb-0.5">END UTC</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => onEndDateChange(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
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
                          className="py-1 rounded-full text-[9px] font-mono bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-center"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Run Analysis Trigger */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTriggerAnalysis}
                      disabled={isLoading}
                      className={`w-full py-2.5 rounded-full font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all light-sheen ${
                        isLoading
                          ? "bg-amber-600/40 text-amber-200/60 cursor-not-allowed border border-amber-500/20"
                          : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-space-950 shadow-[0_0_20px_rgba(245,158,11,0.45)]"
                      }`}
                    >
                      {isLoading ? "CALCULATING LOLA MASKS…" : "▶ RUN ANALYSIS"}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Left Dock Open Button (when collapsed) */}
          {!leftOpen && (
            <button
              onClick={() => {
                soundEngine?.playClick();
                setLeftOpen(true);
              }}
              className="absolute left-3 top-18 z-20 bento-card w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-glass"
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
          className={`absolute right-3 top-18 bottom-24 z-20 w-[560px] max-w-[92vw] hud-slide-right flex flex-col gap-3 bento-card rounded-3xl p-4.5 border border-white/[0.08] shadow-[0_16px_48px_0_rgba(0,0,0,0.9)] ${
            rightOpen ? "translate-x-0 opacity-100" : "translate-x-[580px] opacity-0 pointer-events-none"
          }`}
        >
          <button
            onClick={() => {
              soundEngine?.playClick();
              setRightOpen(false);
            }}
            className="absolute -left-8 top-3 bento-card w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
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
