"use client";

import React from "react";
import { Calendar, Clock, Play, RotateCcw, Sliders } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface ControlsProps {
  startDate: string;
  endDate: string;
  stepHours: number;
  isLoading: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStepHoursChange: (step: number) => void;
  onRunAnalysis: () => void;
  onApplyPreset: (start: string, end: string) => void;
}

export function Controls({
  startDate,
  endDate,
  stepHours,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onStepHoursChange,
  onRunAnalysis,
  onApplyPreset,
}: ControlsProps) {
  const presets = [
    {
      name: "7-Day Sprint",
      start: "2027-01-01",
      end: "2027-01-07",
      desc: "Standard CLPS polar operational sprint",
    },
    {
      name: "14-Day Night Test",
      start: "2027-01-01",
      end: "2027-01-15",
      desc: "Full half-cycle thermal & battery test",
    },
    {
      name: "29.5-Day Synodic Loop",
      start: "2027-01-01",
      end: "2027-01-30",
      desc: "Complete lunar day-night & libration loop",
    },
  ];

  return (
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Controls Form */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              START UTC
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400 transition-all shadow-inner backdrop-blur-md"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
              END UTC
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 transition-all shadow-inner backdrop-blur-md"
            />
          </div>

          {/* Step Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              TIME STEP
            </label>
            <select
              value={stepHours}
              onChange={(e) => onStepHoursChange(Number(e.target.value))}
              className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400 transition-all shadow-inner cursor-pointer backdrop-blur-md"
            >
              <option value={1} className="bg-slate-900 text-white">1 Hour (High Fidelity)</option>
              <option value={2} className="bg-slate-900 text-white">2 Hours (Fast)</option>
              <option value={6} className="bg-slate-900 text-white">6 Hours (Overview)</option>
            </select>
          </div>

          {/* Presets Group */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 flex items-center gap-1.5 font-semibold">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              MISSION PRESETS
            </span>
            <div className="flex items-center gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    soundEngine?.playClick();
                    onApplyPreset(preset.start, preset.end);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all hover:border-white/25 active:scale-95 shadow-sm"
                  title={preset.desc}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button: Glowing Pill Button with Pulse Halo & Sheen */}
        <div className="flex items-end">
          <button
            onClick={() => {
              soundEngine?.playBeaconSelect();
              onRunAnalysis();
            }}
            disabled={isLoading}
            className={`w-full lg:w-auto px-8 py-3 rounded-full font-mono text-xs font-bold flex items-center justify-center gap-2.5 transition-all duration-300 relative group overflow-hidden light-sheen ${
              isLoading
                ? "bg-amber-600/40 text-amber-200/60 cursor-not-allowed border border-amber-500/20"
                : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-space-950 shadow-[0_0_24px_rgba(245,158,11,0.5)] hover:shadow-[0_0_36px_rgba(245,158,11,0.7)] active:scale-95"
            }`}
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-amber-950" />
                <span className="tracking-widest uppercase">COMPUTING LOLA TELEMETRY...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-space-950 text-space-950" />
                <span className="tracking-widest uppercase">RUN MISSION ANALYSIS</span>
                <span className="absolute -inset-1 rounded-full border border-amber-400/40 opacity-0 group-hover:opacity-100 animate-ping pointer-events-none" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
