"use client";

import React, { useState } from "react";
import { SiteAnalysisResult } from "@/lib/types";
import { Clock, Radio, Sparkles, Sun } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface VisibilityTimelineProps {
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

export function VisibilityTimeline({ siteA, siteB }: VisibilityTimelineProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const steps = siteA.telemetry.length;
  if (steps === 0) return null;

  const samplePoints = siteA.telemetry;
  const numLabels = Math.min(6, steps);
  const labelInterval = Math.max(1, Math.floor(steps / (numLabels - 1)));

  const renderTimelineTrack = (
    label: string,
    icon: React.ReactNode,
    telemetry: typeof siteA.telemetry,
    checkFn: (t: (typeof siteA.telemetry)[0]) => boolean,
    activeColorClass: string,
    isDual: boolean = false
  ) => {
    return (
      <div className="flex items-center gap-3">
        <div className="w-40 shrink-0 flex items-center gap-2 text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 font-semibold">
          {icon}
          <span className="truncate">{label}</span>
        </div>

        <div className="flex-1 flex h-7 bg-black/70 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] relative p-0.5 backdrop-blur-md">
          {telemetry.map((t, idx) => {
            const isActive = checkFn(t);
            const isHovered = hoverIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => {
                  soundEngine?.playDataTick();
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
                style={
                  !isActive
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 2px, transparent 2px, transparent 6px)",
                      }
                    : undefined
                }
                className={`flex-1 h-full transition-all duration-150 relative cursor-pointer ${
                  isActive
                    ? `${activeColorClass} ${isDual ? "animate-pulse" : ""}`
                    : "bg-slate-950/80 hover:bg-slate-900"
                } ${isHovered ? "ring-2 ring-white z-10 scale-y-110 rounded-sm" : ""}`}
                title={`${new Date(t.timestamp).toUTCString().slice(0, 22)} — ${
                  isActive ? "ACTIVE" : "INACTIVE (TERRAIN SHADOW / BLOCKED)"
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-emerald-400/90 font-semibold">
              ORBITAL_SYNCHRONIZATION // GANTT_COMPARISON
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              Visibility Window Timeline (Gantt Comparison)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hour-by-hour operational windows comparing Solar Illumination, Earth Comms, and Combined Dual Windows.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-black/60 px-4 py-2 rounded-full border border-white/10 shrink-0">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] inline-block"></span> Sun
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)] inline-block"></span> Earth
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] inline-block animate-pulse"></span> Dual Window
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block"></span> Shadow
          </span>
        </div>
      </div>

      {/* Gantt Bars Section */}
      <div className="space-y-5">
        {/* SITE A BARS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-amber-500/20 space-y-3.5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
              SITE A: {siteA.site.name} ({siteA.site.coordinatesDisplay})
            </span>
            <span className="text-xs font-mono text-slate-300">
              Dual: <strong className="text-emerald-400 font-display font-bold text-sm">{siteA.dualVisiblePct}%</strong> ({siteA.dualVisibleHours}h)
            </span>
          </div>

          {renderTimelineTrack(
            "Solar Sunlight",
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isSunVisible,
            "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          )}

          {renderTimelineTrack(
            "Earth LoS Link",
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isEarthVisible,
            "bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_rgba(0,240,255,0.5)]"
          )}

          {renderTimelineTrack(
            "Combined Dual",
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isDualWindow,
            "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]",
            true
          )}
        </div>

        {/* SITE B BARS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-cyan-500/20 space-y-3.5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
              SITE B: {siteB.site.name} ({siteB.site.coordinatesDisplay})
            </span>
            <span className="text-xs font-mono text-slate-300">
              Dual: <strong className="text-emerald-400 font-display font-bold text-sm">{siteB.dualVisiblePct}%</strong> ({siteB.dualVisibleHours}h)
            </span>
          </div>

          {renderTimelineTrack(
            "Solar Sunlight",
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isSunVisible,
            "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          )}

          {renderTimelineTrack(
            "Earth LoS Link",
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isEarthVisible,
            "bg-gradient-to-r from-cyan-500 to-sky-400 shadow-[0_0_8px_rgba(0,240,255,0.5)]"
          )}

          {renderTimelineTrack(
            "Combined Dual",
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isDualWindow,
            "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]",
            true
          )}
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex items-center pl-44 pr-1 pt-1 border-t border-white/[0.06] text-[10px] font-mono text-slate-400 justify-between">
          {samplePoints.map((p, idx) => {
            if (idx % labelInterval !== 0 && idx !== samplePoints.length - 1) return null;
            const d = new Date(p.timestamp);
            return (
              <span key={idx} className="text-center">
                {d.getUTCMonth() + 1}/{d.getUTCDate()} {String(d.getUTCHours()).padStart(2, "0")}h
              </span>
            );
          })}
        </div>

        {/* Hover Status Detail */}
        {hoverIndex !== null && siteA.telemetry[hoverIndex] && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono flex flex-wrap items-center justify-between gap-4 text-slate-300 shadow-bento backdrop-blur-xl animate-fadeIn">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase tracking-widest-xl font-semibold">
                SCRUB UTC COORDINATE
              </span>
              <strong className="text-white font-display font-semibold text-xs mt-0.5 block">
                {siteA.telemetry[hoverIndex].timestamp.replace("T", " ").replace(".000Z", " UTC")}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase tracking-widest-xl font-semibold">
                SITE A CONDITION
              </span>
              <span
                className={
                  siteA.telemetry[hoverIndex].isDualWindow
                    ? "text-emerald-300 font-display font-bold text-xs bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-block mt-0.5"
                    : siteA.telemetry[hoverIndex].isSunVisible
                    ? "text-amber-400 font-semibold inline-block mt-0.5"
                    : siteA.telemetry[hoverIndex].isEarthVisible
                    ? "text-cyan-400 font-semibold inline-block mt-0.5"
                    : "text-slate-500 inline-block mt-0.5"
                }
              >
                {siteA.telemetry[hoverIndex].isDualWindow
                  ? "DUAL (POWER+COMMS)"
                  : siteA.telemetry[hoverIndex].isSunVisible
                  ? "SUN ONLY"
                  : siteA.telemetry[hoverIndex].isEarthVisible
                  ? "COMMS ONLY"
                  : "TERRAIN SHADOW"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase tracking-widest-xl font-semibold">
                SITE B CONDITION
              </span>
              <span
                className={
                  siteB.telemetry[hoverIndex]?.isDualWindow
                    ? "text-emerald-300 font-display font-bold text-xs bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-block mt-0.5"
                    : siteB.telemetry[hoverIndex]?.isSunVisible
                    ? "text-amber-400 font-semibold inline-block mt-0.5"
                    : siteB.telemetry[hoverIndex]?.isEarthVisible
                    ? "text-cyan-400 font-semibold inline-block mt-0.5"
                    : "text-slate-500 inline-block mt-0.5"
                }
              >
                {siteB.telemetry[hoverIndex]?.isDualWindow
                  ? "DUAL (POWER+COMMS)"
                  : siteB.telemetry[hoverIndex]?.isSunVisible
                  ? "SUN ONLY"
                  : siteB.telemetry[hoverIndex]?.isEarthVisible
                  ? "COMMS ONLY"
                  : "TERRAIN SHADOW"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
