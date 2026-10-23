"use client";

import React, { useCallback } from "react";
import { TimeStepTelemetry } from "@/lib/types";
import { Pause, Play, Rewind, SkipForward } from "lucide-react";

interface TimePlayerProps {
  telemetryA: TimeStepTelemetry[];
  currentIndex: number;
  isPlaying: boolean;
  playSpeed: number;
  onIndexChange: (index: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  currentStepA: TimeStepTelemetry | null;
  currentStepB: TimeStepTelemetry | null;
}

const SPEEDS = [
  { label: "1×", value: 1 },
  { label: "10×", value: 10 },
  { label: "60×", value: 60 },
  { label: "1d/s", value: 240 },
];

export function TimePlayer({
  telemetryA,
  currentIndex,
  isPlaying,
  playSpeed,
  onIndexChange,
  onPlayToggle,
  onSpeedChange,
  currentStepA,
  currentStepB,
}: TimePlayerProps) {
  const total = telemetryA.length;
  const pct = total > 0 ? (currentIndex / Math.max(1, total - 1)) * 100 : 0;

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onIndexChange(Math.round(Number(e.target.value)));
    },
    [onIndexChange]
  );

  const utcLabel = currentStepA
    ? currentStepA.timestamp.replace("T", "  ").replace(".000Z", " UTC").replace("Z", " UTC")
    : "—";

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 flex flex-col gap-2">
      {/* Top row: status indicators */}
      <div className="flex items-center justify-between gap-4 text-[10px] font-mono">
        <span className="text-slate-400 tracking-widest uppercase">Mission Epoch</span>
        <span className="text-white font-bold text-xs">{utcLabel}</span>
        <div className="flex items-center gap-3">
          {currentStepA && (
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${currentStepA.isSunVisible ? "bg-amber-500/20 text-amber-300" : "bg-slate-800/80 text-slate-500"}`}
            >
              A-SUN {currentStepA.isSunVisible ? "ON" : "OFF"}
            </span>
          )}
          {currentStepA && (
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${currentStepA.isEarthVisible ? "bg-sky-500/20 text-sky-300" : "bg-slate-800/80 text-slate-500"}`}
            >
              A-DTE {currentStepA.isEarthVisible ? "CLR" : "BLK"}
            </span>
          )}
          {currentStepB && (
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${currentStepB.isSunVisible ? "bg-amber-500/20 text-amber-300" : "bg-slate-800/80 text-slate-500"}`}
            >
              B-SUN {currentStepB.isSunVisible ? "ON" : "OFF"}
            </span>
          )}
          {currentStepB && (
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${currentStepB.isEarthVisible ? "bg-sky-500/20 text-sky-300" : "bg-slate-800/80 text-slate-500"}`}
            >
              B-DTE {currentStepB.isEarthVisible ? "CLR" : "BLK"}
            </span>
          )}
        </div>
      </div>

      {/* Timeline track with site windows overlaid */}
      <div className="relative h-6 bg-white/5 rounded-lg overflow-hidden border border-white/8">
        {/* Site A Sun Windows */}
        {telemetryA.map((t, i) => (
          <div
            key={`sun-a-${i}`}
            className={`absolute top-0 bottom-0 ${t.isSunVisible ? "bg-amber-500/50" : ""}`}
            style={{ left: `${(i / Math.max(1, total - 1)) * 100}%`, width: `${100 / total}%` }}
          />
        ))}
        {/* Site A Earth Windows */}
        {telemetryA.map((t, i) => (
          <div
            key={`earth-a-${i}`}
            className={`absolute top-[60%] bottom-0 ${t.isEarthVisible ? "bg-sky-500/60" : ""}`}
            style={{ left: `${(i / Math.max(1, total - 1)) * 100}%`, width: `${100 / total}%` }}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10"
          style={{ left: `${pct}%` }}
        />

        {/* Transparent range input on top */}
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={currentIndex}
          onChange={handleSlider}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 10))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Rewind className="w-3 h-3" />
          </button>
          <button
            onClick={onPlayToggle}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isPlaying ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/8 text-slate-200 hover:bg-white/12 border border-white/10"}`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={() => onIndexChange(Math.min(total - 1, currentIndex + 10))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        {/* Progress label */}
        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
          {currentIndex + 1} / {total} <span className="text-slate-600">steps</span>
        </span>

        {/* Speed selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/8">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSpeedChange(s.value)}
              className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                playSpeed === s.value
                  ? "bg-amber-500 text-space-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Live elevation readouts */}
        {currentStepA && (
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono">
            <span className="text-slate-500">A:</span>
            <span className="text-amber-400">☀ {currentStepA.sunElevation}°</span>
            <span className="text-sky-400">⊕ {currentStepA.earthElevation}°</span>
          </div>
        )}
        {currentStepB && (
          <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono">
            <span className="text-slate-500">B:</span>
            <span className="text-amber-400">☀ {currentStepB.sunElevation}°</span>
            <span className="text-sky-400">⊕ {currentStepB.earthElevation}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
