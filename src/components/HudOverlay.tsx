"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Orbit,
  BarChart3,
  Globe,
  Crosshair,
  ShieldAlert,
  Moon,
  Satellite,
  Menu,
} from "lucide-react";
import { CandidateSite, SiteAnalysisResult, ComparisonResponse } from "@/lib/types";
import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { KpiRings } from "./KpiRings";
import { Controls } from "./Controls";
import { ElevationChart } from "./ElevationChart";
import { VisibilityTimeline } from "./VisibilityTimeline";
import { HorizonRadar } from "./HorizonRadar";
import { TradeOffExplainer } from "./TradeOffExplainer";
import { ExportReport } from "./ExportReport";
import { TimeStepTelemetry } from "@/lib/types";

type ViewMode = "3d" | "analytics";
type CameraMode = "system" | "globe" | "siteA" | "siteB";

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

  const cameraModes: { key: CameraMode; label: string; icon: React.ReactNode }[] = [
    { key: "system", label: "System Orbit", icon: <Orbit className="w-3.5 h-3.5" /> },
    { key: "globe", label: "Moon Globe", icon: <Globe className="w-3.5 h-3.5" /> },
    { key: "siteA", label: "Site A Lock", icon: <Crosshair className="w-3.5 h-3.5" /> },
    { key: "siteB", label: "Site B Lock", icon: <Crosshair className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* ── TOP FLOATING HEADER BAR ───────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 glass-panel rounded-xl px-3.5 py-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/25 to-sky-500/25 border border-amber-500/40 flex items-center justify-center">
            <Moon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight leading-none">LunarOps</div>
            <div className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">NASA CLPS 2026</div>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center glass-panel rounded-xl p-1 gap-1">
          <button
            onClick={() => onViewModeChange("3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === "3d"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Orbital HUD</span>
          </button>
          <button
            onClick={() => onViewModeChange("analytics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              viewMode === "analytics"
                ? "bg-sky-500/15 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Analytics</span>
          </button>
        </div>

        {/* Camera mode tabs (only in 3D mode) */}
        {viewMode === "3d" && (
          <div className="flex items-center glass-panel rounded-xl p-1 gap-0.5">
            {cameraModes.map((cm) => (
              <button
                key={cm.key}
                onClick={() => onCameraModeChange(cm.key)}
                title={cm.label}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                  cameraMode === cm.key
                    ? "bg-white/10 text-white border border-white/15"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {cm.icon}
                <span className="hidden md:inline">{cm.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Disclaimer badge */}
        <div className="hidden xl:flex items-center gap-1.5 glass-panel rounded-xl px-3 py-1.5 text-[9px] font-mono text-amber-300/80 border border-amber-500/20 max-w-xs">
          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">LoS visibility only — not direct power/comms guarantee</span>
        </div>

        {/* Right panel toggle */}
        {comparisonData && (
          <button
            onClick={() => setRightOpen((p) => !p)}
            className="glass-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Charts</span>
          </button>
        )}
      </div>

      {/* ── LEFT COLLAPSIBLE DOCK ─────────────────────────────────────────── */}
      <div
        className={`absolute left-3 top-20 bottom-20 z-20 w-72 hud-slide-left flex flex-col gap-3 ${
          leftOpen ? "translate-x-0 opacity-100" : "-translate-x-80 opacity-0"
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setLeftOpen((p) => !p)}
          className="absolute -right-8 top-4 glass-panel w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {/* Site A slot */}
          <div className="glass-panel rounded-xl p-3">
            <div className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase mb-2">Site A — Target</div>
            <div className="text-sm font-semibold text-white truncate">{selectedSiteA.name}</div>
            <div className="text-[10px] font-mono text-amber-300 mt-0.5">{selectedSiteA.coordinatesDisplay}</div>
            <div className="text-[10px] text-slate-500 truncate">{selectedSiteA.targetMission}</div>
            {/* Quick select grid */}
            <div className="mt-2 grid grid-cols-1 gap-1">
              {CANDIDATE_SITES.filter((s) => s.id !== selectedSiteA.id).map((site) => (
                <button
                  key={site.id}
                  onClick={() => onSelectSiteA(site)}
                  className="text-left px-2 py-1 rounded-lg bg-white/4 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-[10px] font-mono text-slate-400 hover:text-amber-300 transition-all"
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          {/* Site B slot */}
          <div className="glass-panel rounded-xl p-3">
            <div className="text-[10px] font-mono text-sky-400 font-bold tracking-widest uppercase mb-2">Site B — Reference</div>
            <div className="text-sm font-semibold text-white truncate">{selectedSiteB.name}</div>
            <div className="text-[10px] font-mono text-sky-300 mt-0.5">{selectedSiteB.coordinatesDisplay}</div>
            <div className="text-[10px] text-slate-500 truncate">{selectedSiteB.targetMission}</div>
            {/* Quick select grid */}
            <div className="mt-2 grid grid-cols-1 gap-1">
              {CANDIDATE_SITES.filter((s) => s.id !== selectedSiteB.id).map((site) => (
                <button
                  key={site.id}
                  onClick={() => onSelectSiteB(site)}
                  className="text-left px-2 py-1 rounded-lg bg-white/4 hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 text-[10px] font-mono text-slate-400 hover:text-sky-300 transition-all"
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Rings */}
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

          {/* Controls */}
          <div className="glass-panel rounded-xl p-3 space-y-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Mission Time Window</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">START UTC</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">END UTC</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[{ l: "7D", s: "2027-01-01", e: "2027-01-07" }, { l: "14D", s: "2027-01-01", e: "2027-01-15" }, { l: "29.5D", s: "2027-01-01", e: "2027-01-30" }].map((p) => (
                <button
                  key={p.l}
                  onClick={() => onApplyPreset(p.s, p.e)}
                  className="py-1 rounded-lg text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/6 transition-colors"
                >
                  {p.l}
                </button>
              ))}
            </div>
            <button
              onClick={onRunAnalysis}
              disabled={isLoading}
              className={`w-full py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isLoading
                  ? "bg-amber-600/40 text-amber-300 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400 text-space-950 active:scale-95"
              }`}
            >
              {isLoading ? "COMPUTING…" : "▶ RUN ANALYSIS"}
            </button>
          </div>
        </div>
      </div>

      {/* Left dock open button (when collapsed) */}
      {!leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          className="absolute left-3 top-24 z-20 glass-panel w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* ── RIGHT ANALYTICS DRAWER ────────────────────────────────────────── */}
      {comparisonData && (
        <div
          className={`absolute right-3 top-20 bottom-20 z-20 w-[520px] max-w-[90vw] hud-slide-right flex flex-col gap-3 ${
            rightOpen ? "translate-x-0 opacity-100" : "translate-x-[540px] opacity-0"
          }`}
        >
          <button
            onClick={() => setRightOpen(false)}
            className="absolute -left-8 top-4 glass-panel w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
