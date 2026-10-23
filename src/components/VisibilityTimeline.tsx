"use client";

import React, { useState } from "react";
import { SiteAnalysisResult } from "@/lib/types";
import { Clock, Radio, Sparkles, Sun } from "lucide-react";

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
    activeBgGlow: string
  ) => {
    return (
      <div className="flex items-center gap-3">
        <div className="w-36 shrink-0 flex items-center gap-1.5 text-xs font-mono text-slate-300">
          {icon}
          <span className="truncate">{label}</span>
        </div>

        <div className="flex-1 flex h-6 bg-space-950 rounded-md overflow-hidden border border-space-800 relative">
          {telemetry.map((t, idx) => {
            const isActive = checkFn(t);
            const isHovered = hoverIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`flex-1 h-full transition-colors relative cursor-pointer ${
                  isActive ? activeColorClass : "bg-space-950 hover:bg-space-800"
                } ${isHovered ? "ring-1 ring-white z-10" : ""}`}
                title={`${new Date(t.timestamp).toUTCString().slice(0, 22)} — ${
                  isActive ? "ACTIVE" : "INACTIVE"
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-space-700/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Visibility Window Timeline (Gantt Comparison)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hour-by-hour operational windows comparing Solar Illumination, Earth Comms, and Combined Dual Windows.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span> Sun
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-3 h-3 rounded-sm bg-sky-500 inline-block"></span> Earth
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span> Dual Window
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-space-950 border border-space-700 inline-block"></span> Shadow / Blocked
          </span>
        </div>
      </div>

      {/* Gantt Bars Section */}
      <div className="space-y-6">
        {/* SITE A BARS */}
        <div className="p-3.5 rounded-lg bg-space-900/90 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-space-800 pb-2">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              SITE A: {siteA.site.name} ({siteA.site.coordinatesDisplay})
            </span>
            <span className="text-xs font-mono text-slate-400">
              Dual: <strong className="text-emerald-400">{siteA.dualVisiblePct}%</strong> ({siteA.dualVisibleHours}h)
            </span>
          </div>

          {renderTimelineTrack(
            "Solar Sunlight",
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isSunVisible,
            "bg-amber-500 hover:bg-amber-400",
            "shadow-solar-glow"
          )}

          {renderTimelineTrack(
            "Earth LoS Link",
            <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isEarthVisible,
            "bg-sky-500 hover:bg-sky-400",
            "shadow-earth-glow"
          )}

          {renderTimelineTrack(
            "Combined Dual",
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            siteA.telemetry,
            (t) => t.isDualWindow,
            "bg-emerald-500 hover:bg-emerald-400",
            "shadow-optimal-glow"
          )}
        </div>

        {/* SITE B BARS */}
        <div className="p-3.5 rounded-lg bg-space-900/90 border border-sky-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-space-800 pb-2">
            <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              SITE B: {siteB.site.name} ({siteB.site.coordinatesDisplay})
            </span>
            <span className="text-xs font-mono text-slate-400">
              Dual: <strong className="text-emerald-400">{siteB.dualVisiblePct}%</strong> ({siteB.dualVisibleHours}h)
            </span>
          </div>

          {renderTimelineTrack(
            "Solar Sunlight",
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isSunVisible,
            "bg-amber-500 hover:bg-amber-400",
            "shadow-solar-glow"
          )}

          {renderTimelineTrack(
            "Earth LoS Link",
            <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isEarthVisible,
            "bg-sky-500 hover:bg-sky-400",
            "shadow-earth-glow"
          )}

          {renderTimelineTrack(
            "Combined Dual",
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
            siteB.telemetry,
            (t) => t.isDualWindow,
            "bg-emerald-500 hover:bg-emerald-400",
            "shadow-optimal-glow"
          )}
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex items-center pl-39 pr-0 pt-1 border-t border-space-800 text-[10px] font-mono text-slate-400 justify-between">
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
          <div className="p-2.5 rounded-lg bg-space-950 border border-space-700 text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-slate-300 animate-fadeIn">
            <div>
              <span className="text-slate-400">Scrub Time:</span>{" "}
              <strong className="text-white">
                {siteA.telemetry[hoverIndex].timestamp.replace("T", " ").replace(".000Z", " UTC")}
              </strong>
            </div>
            <div>
              <span>Site A:</span>{" "}
              <span
                className={
                  siteA.telemetry[hoverIndex].isDualWindow
                    ? "text-emerald-400 font-bold"
                    : siteA.telemetry[hoverIndex].isSunVisible
                    ? "text-amber-400"
                    : "text-slate-500"
                }
              >
                {siteA.telemetry[hoverIndex].isDualWindow
                  ? "DUAL (POWER+COMMS)"
                  : siteA.telemetry[hoverIndex].isSunVisible
                  ? "SUN ONLY"
                  : siteA.telemetry[hoverIndex].isEarthVisible
                  ? "COMMS ONLY"
                  : "SHADOW"}
              </span>
            </div>
            <div>
              <span>Site B:</span>{" "}
              <span
                className={
                  siteB.telemetry[hoverIndex]?.isDualWindow
                    ? "text-emerald-400 font-bold"
                    : siteB.telemetry[hoverIndex]?.isSunVisible
                    ? "text-amber-400"
                    : "text-slate-500"
                }
              >
                {siteB.telemetry[hoverIndex]?.isDualWindow
                  ? "DUAL (POWER+COMMS)"
                  : siteB.telemetry[hoverIndex]?.isSunVisible
                  ? "SUN ONLY"
                  : siteB.telemetry[hoverIndex]?.isEarthVisible
                  ? "COMMS ONLY"
                  : "SHADOW"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
