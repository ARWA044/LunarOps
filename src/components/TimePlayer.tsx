"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { TimeStepTelemetry } from "@/lib/types";
import { Pause, Play, Rewind, SkipForward } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface TimePlayerProps {
  telemetryA?: TimeStepTelemetry[];
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
  telemetryA = [],
  currentIndex,
  isPlaying,
  playSpeed,
  onIndexChange,
  onPlayToggle,
  onSpeedChange,
  currentStepA,
  currentStepB,
}: TimePlayerProps) {
  const total = telemetryA?.length ?? 0;
  const pct = total > 1 ? (Math.min(currentIndex, total - 1) / Math.max(1, total - 1)) * 100 : 0;

  // Track state transitions to trigger procedural alert chimes
  const lastSunVisA = useRef<boolean | null>(null);
  const lastEarthVisA = useRef<boolean | null>(null);

  useEffect(() => {
    if (!currentStepA) return;
    if (lastSunVisA.current !== null) {
      if (lastSunVisA.current && !currentStepA.isSunVisible) {
        soundEngine?.playLoSAlert(); // Site A entered lunar night/shadow
      } else if (lastEarthVisA.current && !currentStepA.isEarthVisible) {
        soundEngine?.playLoSAlert(); // Site A lost Earth DTE line-of-sight
      }
    }
    lastSunVisA.current = currentStepA.isSunVisible;
    lastEarthVisA.current = currentStepA.isEarthVisible;
  }, [currentStepA]);

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      soundEngine?.playScrubTick();
      onIndexChange(Math.round(Number(e.target.value)));
    },
    [onIndexChange]
  );

  const handleStepBack = () => {
    soundEngine?.playScrubTick();
    onIndexChange(Math.max(0, currentIndex - 10));
  };

  const handleStepForward = () => {
    soundEngine?.playScrubTick();
    onIndexChange(Math.min(Math.max(0, total - 1), currentIndex + 10));
  };

  const handleTogglePlay = () => {
    soundEngine?.playClick();
    onPlayToggle();
  };

  const handleSetSpeed = (s: number) => {
    soundEngine?.playClick();
    onSpeedChange(s);
  };

  const utcLabel = currentStepA?.timestamp
    ? currentStepA.timestamp.replace("T", "  ").replace(".000Z", " UTC").replace("Z", " UTC")
    : "—";

  return (
    <div className="bento-card rounded-2xl sm:rounded-3xl px-5 py-3 flex flex-col gap-2.5 shadow-[0_16px_48px_0_rgba(0,0,0,0.85)] border border-white/10 max-w-5xl mx-auto backdrop-blur-3xl">
      {/* Top row: status indicators */}
      <div className="flex items-center justify-between gap-4 text-[10px] font-mono">
        <span className="text-slate-400 tracking-widest-xl uppercase font-semibold">Mission Epoch</span>
        <span className="text-white font-display font-bold text-xs sm:text-sm tabular-nums tracking-wide">{utcLabel}</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentStepA && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider transition-colors ${
                currentStepA.isSunVisible
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                  : "bg-red-500/15 text-red-300 border border-red-500/30"
              }`}
            >
              A-SUN {currentStepA.isSunVisible ? "ON" : "OFF"}
            </span>
          )}
          {currentStepA && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider transition-colors ${
                currentStepA.isEarthVisible
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.25)]"
                  : "bg-red-500/15 text-red-300 border border-red-500/30"
              }`}
            >
              A-DTE {currentStepA.isEarthVisible ? "CLR" : "BLK"}
            </span>
          )}
          {currentStepB && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider transition-colors ${
                currentStepB.isSunVisible
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                  : "bg-red-500/15 text-red-300 border border-red-500/30"
              }`}
            >
              B-SUN {currentStepB.isSunVisible ? "ON" : "OFF"}
            </span>
          )}
          {currentStepB && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider transition-colors ${
                currentStepB.isEarthVisible
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.25)]"
                  : "bg-red-500/15 text-red-300 border border-red-500/30"
              }`}
            >
              B-DTE {currentStepB.isEarthVisible ? "CLR" : "BLK"}
            </span>
          )}
        </div>
      </div>

      {/* Timeline track with site windows overlaid */}
      <div className="relative h-4 bg-black/60 rounded-full overflow-hidden border border-white/[0.08] shadow-inner p-0.5">
        {total > 0 &&
          telemetryA.map((t, i) => (
            <div
              key={`sun-a-${i}`}
              className={`absolute top-0 bottom-0 ${t?.isSunVisible ? "bg-amber-500/40" : ""}`}
              style={{ left: `${(i / Math.max(1, total - 1)) * 100}%`, width: `${Math.max(0.5, 100 / total)}%` }}
            />
          ))}
        {total > 0 &&
          telemetryA.map((t, i) => (
            <div
              key={`earth-a-${i}`}
              className={`absolute top-[50%] bottom-0 ${t?.isEarthVisible ? "bg-cyan-500/50" : ""}`}
              style={{ left: `${(i / Math.max(1, total - 1)) * 100}%`, width: `${Math.max(0.5, 100 / total)}%` }}
            />
          ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_10px_white] z-10"
          style={{ left: `${pct}%` }}
        />

        {/* Transparent range input on top */}
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={Math.min(currentIndex, Math.max(0, total - 1))}
          onChange={handleSlider}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStepBack}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Step Back 10 Hours"
          >
            <Rewind className="w-3 h-3" />
          </button>
          <button
            onClick={handleTogglePlay}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all light-sheen ${
              isPlaying
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-space-950 font-bold shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                : "bg-white/10 text-slate-200 hover:bg-white/15 border border-white/15"
            }`}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={handleStepForward}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Step Forward 10 Hours"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        {/* Progress label */}
        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
          {total > 0 ? currentIndex + 1 : 0} / {total} <span className="text-slate-500">steps</span>
        </span>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 bg-black/40 rounded-full p-0.5 border border-white/10">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSetSpeed(s.value)}
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all ${
                playSpeed === s.value
                  ? "bg-amber-500 text-space-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Live elevation readouts */}
        {currentStepA && (
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono tabular-nums">
            <span className="text-slate-400">Site A:</span>
            <span className="text-amber-400 font-semibold">☀ {currentStepA.sunElevation}°</span>
            <span className="text-cyan-400 font-semibold">⊕ {currentStepA.earthElevation}°</span>
          </div>
        )}
        {currentStepB && (
          <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono tabular-nums">
            <span className="text-slate-400">Site B:</span>
            <span className="text-amber-400 font-semibold">☀ {currentStepB.sunElevation}°</span>
            <span className="text-cyan-400 font-semibold">⊕ {currentStepB.earthElevation}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
