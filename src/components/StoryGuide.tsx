"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Orbit,
  ArrowRight,
  Crosshair,
  Activity,
  Layers,
  Radio,
  Sun,
  ShieldAlert,
} from "lucide-react";
import { CandidateSite } from "@/lib/types";
import { CANDIDATE_SITES } from "@/lib/lola-terrain";
import { soundEngine } from "@/lib/sound-engine";
import type { CameraMode } from "./LunarScene3D";

interface StoryGuideProps {
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSelectSiteA: (site: CandidateSite) => void;
  onSelectSiteB: (site: CandidateSite) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  startDate: string;
  endDate: string;
  stepHours: number;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onApplyPreset: (s: string, e: string) => void;
  onRunAnalysis: () => void;
  isAnalysisMode: boolean;
  onToggleAnalysisMode: () => void;
  isLoading: boolean;
  onOpenAnalyticsDrawer: () => void;
}

export function StoryGuide({
  selectedSiteA,
  selectedSiteB,
  onSelectSiteA,
  onSelectSiteB,
  onCameraModeChange,
  startDate,
  endDate,
  stepHours,
  onStartDateChange,
  onEndDateChange,
  onApplyPreset,
  onRunAnalysis,
  isAnalysisMode,
  onToggleAnalysisMode,
  isLoading,
  onOpenAnalyticsDrawer,
}: StoryGuideProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [diagnosticRan, setDiagnosticRan] = useState(false);

  const goToStep = (step: 1 | 2 | 3) => {
    soundEngine?.playWhoosh();
    setActiveStep(step);
  };

  const handleSelectSiteA = (site: CandidateSite) => {
    soundEngine?.playBeaconSelect();
    onSelectSiteA(site);
    onCameraModeChange("siteA");
  };

  const handleSelectSiteB = (site: CandidateSite) => {
    soundEngine?.playBeaconSelect();
    onSelectSiteB(site);
    onCameraModeChange("siteB");
  };

  const handleExecuteDiagnostics = () => {
    soundEngine?.playScanDiagnostic();
    setDiagnosticRan(true);
    if (!isAnalysisMode) {
      onToggleAnalysisMode();
    }
    onRunAnalysis();
    setTimeout(() => {
      onOpenAnalyticsDrawer();
    }, 600);
  };

  return (
    <div className="glass-panel rounded-2xl p-3.5 space-y-3 shadow-glass border border-white/10">
      {/* Story Mode Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500/20 to-sky-500/30 border border-amber-500/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>STORY MODE</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                GUIDED
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400">CLPS Mission Analysis Wizard</div>
          </div>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {[1, 2, 3].map((stepNum) => (
            <button
              key={stepNum}
              onClick={() => goToStep(stepNum as 1 | 2 | 3)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                activeStep === stepNum
                  ? "bg-amber-500 text-space-950 font-bold shadow-solar-glow scale-105"
                  : activeStep > stepNum
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {activeStep > stepNum ? "✓" : stepNum}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 1: MISSION TARGET ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> STEP 1: SELECT TARGET SITES
              </span>
              <span className="text-[9px] text-slate-500">Auto camera sweep</span>
            </div>

            {/* Site A Target */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-amber-300 uppercase tracking-widest block">
                Primary Target (Site A)
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                {CANDIDATE_SITES.map((site) => {
                  const isSelected = site.id === selectedSiteA.id;
                  return (
                    <button
                      key={site.id}
                      onClick={() => handleSelectSiteA(site)}
                      className={`text-left p-2 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500 text-white shadow-solar-glow"
                          : "bg-space-950/60 border-white/5 text-slate-300 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate">{site.name}</span>
                        <span className="text-[9px] font-mono text-amber-300">{site.badge}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                        {site.coordinatesDisplay} • {site.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Site B Benchmark */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <label className="text-[9px] font-mono text-sky-300 uppercase tracking-widest block">
                Benchmark Reference (Site B)
              </label>
              <select
                value={selectedSiteB.id}
                onChange={(e) => {
                  const found = CANDIDATE_SITES.find((s) => s.id === e.target.value);
                  if (found) handleSelectSiteB(found);
                }}
                className="w-full bg-space-950/80 border border-sky-500/30 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {CANDIDATE_SITES.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.badge}: {site.name} ({site.category})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => goToStep(2)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <span>Next: Temporal Window</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: TEMPORAL WINDOW ──────────────────────────────────────── */}
        {activeStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-sky-400 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> STEP 2: MISSION TIME WINDOW
              </span>
              <span className="text-[9px] text-slate-500">UTC Ephemeris</span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                NASA Mission Scenarios
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    name: "7-Day CLPS Landing Window",
                    start: "2027-01-01",
                    end: "2027-01-07",
                    desc: "Peak illumination for initial surface operations",
                  },
                  {
                    name: "14-Day Lunar Night Endurance",
                    start: "2027-01-01",
                    end: "2027-01-15",
                    desc: "Battery sizing & unbroken shadow stress test",
                  },
                  {
                    name: "29.5-Day Synodic Orbit Cycle",
                    start: "2027-01-01",
                    end: "2027-01-30",
                    desc: "Full lunar day/night cycle comparison",
                  },
                ].map((preset) => {
                  const isCurrent = startDate === preset.start && endDate === preset.end;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        soundEngine?.playClick();
                        onApplyPreset(preset.start, preset.end);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-sky-500/20 border-sky-400 text-white shadow-earth-glow"
                          : "bg-space-950/60 border-white/5 text-slate-300 hover:border-sky-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{preset.name}</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Dates */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-0.5">START UTC</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-0.5">END UTC</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full bg-space-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => goToStep(1)}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all"
              >
                Back
              </button>
              <button
                onClick={() => goToStep(3)}
                className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-space-950 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-earth-glow"
              >
                <span>Next: Diagnostics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: RUN DIAGNOSTICS & HOLOGRAPHIC REVEAL ─────────────────── */}
        {activeStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> STEP 3: MISSION DIAGNOSTICS
              </span>
              <span className="text-[9px] text-slate-500">LOLA + Ephemeris</span>
            </div>

            <div className="p-3 rounded-xl bg-space-950/70 border border-white/10 space-y-2">
              <div className="text-[10px] font-mono text-slate-400">Target Comparison:</div>
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-amber-400">{selectedSiteA.badge}: {selectedSiteA.name.split(" ")[0]}</span>
                <span className="text-slate-500">vs</span>
                <span className="text-sky-400">{selectedSiteB.badge}: {selectedSiteB.name.split(" ")[0]}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                Window: <span className="text-slate-200">{startDate}</span> to <span className="text-slate-200">{endDate}</span>
              </div>
            </div>

            {/* Launch Diagnostic Button */}
            <button
              onClick={handleExecuteDiagnostics}
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-solar-glow ${
                isLoading
                  ? "bg-amber-600/50 text-amber-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 text-space-950 hover:brightness-110 active:scale-95"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "CALCULATING MASKS…" : "▶ RUN DIAGNOSTICS & HOLOGRAPHIC SCAN"}</span>
            </button>

            {/* Analysis Mode Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-space-950/60 border border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">Holographic 3D Blueprint</div>
                  <div className="text-[9px] text-slate-400">X-Ray wireframe & bloom lasers</div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine?.playClick();
                  onToggleAnalysisMode();
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  isAnalysisMode
                    ? "bg-sky-500 text-space-950 shadow-earth-glow"
                    : "bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {isAnalysisMode ? "ACTIVE" : "ENABLE"}
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => goToStep(2)}
              className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all text-center"
            >
              Back to Temporal Window
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
