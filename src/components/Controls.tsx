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
      name: "7-Day Window",
      start: "2027-01-01",
      end: "2027-01-07",
      desc: "Standard CLPS polar operational sprint",
    },
    {
      name: "14-Day Lunar Night Test",
      start: "2027-01-01",
      end: "2027-01-15",
      desc: "Full half-cycle thermal & battery test",
    },
    {
      name: "29.5-Day Synodic Month",
      start: "2027-01-01",
      end: "2027-01-30",
      desc: "Complete lunar day-night & libration loop",
    },
  ];

  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Controls Form */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              START UTC
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-space-900 border border-space-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              END UTC
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-space-900 border border-space-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Step Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              TIME STEP
            </label>
            <select
              value={stepHours}
              onChange={(e) => onStepHoursChange(Number(e.target.value))}
              className="bg-space-900 border border-space-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value={1}>1 Hour (High Fidelity)</option>
              <option value={2}>2 Hours (Fast)</option>
              <option value={6}>6 Hours (Overview)</option>
            </select>
          </div>

          {/* Presets Group */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
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
                  className="px-2.5 py-1.5 rounded-lg bg-space-900 hover:bg-space-700/80 border border-space-700 text-xs font-mono text-slate-300 hover:text-white transition-all hover:border-slate-500"
                  title={preset.desc}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              soundEngine?.playBeaconSelect();
              onRunAnalysis();
            }}
            disabled={isLoading}
            className={`w-full lg:w-auto px-6 py-2.5 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 shadow-solar-glow transition-all ${
              isLoading
                ? "bg-amber-600/60 text-amber-200 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-space-950 active:scale-95"
            }`}
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-space-950" />
                <span>COMPUTING LOLA TELEMETRY...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-space-950 text-space-950" />
                <span>RUN MISSION ANALYSIS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
