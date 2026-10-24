"use client";

import React, { useState } from "react";
import { SiteAnalysisResult, TimeStepTelemetry } from "@/lib/types";
import { Eye, Info, Layers, Radio, Sun } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface ElevationChartProps {
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

export function ElevationChart({ siteA, siteB }: ElevationChartProps) {
  const [activeSiteTab, setActiveSiteTab] = useState<"siteA" | "siteB">("siteA");
  const [hoveredPoint, setHoveredPoint] = useState<TimeStepTelemetry | null>(null);

  const activeResult = activeSiteTab === "siteA" ? siteA : siteB;
  const telemetry = activeResult.telemetry;

  // Chart dimensions & scaling
  const width = 900;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Min and max elevation bounds in degrees
  // Find min/max across active telemetry to scale nicely
  const minElev = Math.min(-5, ...telemetry.map((t) => Math.min(t.sunElevation, t.earthElevation, 0)));
  const maxElev = Math.max(15, ...telemetry.map((t) => Math.max(t.sunElevation, t.earthElevation, 10)));

  const scaleX = (index: number) => {
    if (telemetry.length <= 1) return padding.left;
    return padding.left + (index / (telemetry.length - 1)) * plotWidth;
  };

  const scaleY = (val: number) => {
    const clamped = Math.max(minElev, Math.min(maxElev, val));
    return (
      padding.top +
      plotHeight -
      ((clamped - minElev) / (maxElev - minElev)) * plotHeight
    );
  };

  // Build SVG path strings
  const sunPath = telemetry
    .map((t, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(t.sunElevation)}`)
    .join(" ");

  const earthPath = telemetry
    .map((t, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(t.earthElevation)}`)
    .join(" ");

  const sunObstructionPath = telemetry
    .map((t, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(t.sunTerrainObstruction)}`)
    .join(" ");

  const earthObstructionPath = telemetry
    .map((t, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(t.earthTerrainObstruction)}`)
    .join(" ");

  // Zero-degree line
  const zeroY = scaleY(0);

  // Time grid ticks (5-7 ticks)
  const numTicks = Math.min(7, telemetry.length);
  const tickStep = Math.max(1, Math.floor(telemetry.length / (numTicks - 1)));
  const timeTicks = [];
  for (let i = 0; i < telemetry.length; i += tickStep) {
    timeTicks.push({ index: i, point: telemetry[i] });
  }
  if (
    timeTicks[timeTicks.length - 1]?.index !== telemetry.length - 1 &&
    telemetry.length > 0
  ) {
    timeTicks.push({
      index: telemetry.length - 1,
      point: telemetry[telemetry.length - 1],
    });
  }

  // Y-axis elevation ticks
  const yTicks = [
    Math.round(minElev),
    0,
    Math.round((maxElev * 0.33 * 10) / 10),
    Math.round((maxElev * 0.66 * 10) / 10),
    Math.round(maxElev),
  ];

  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-space-700/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Elevation vs. LOLA Terrain Horizon Obstruction
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sun and Earth elevation angles relative to the site's local 360° terrain mask over UTC mission time.
          </p>
        </div>

        {/* Site View Toggle Tabs */}
        <div className="flex items-center bg-space-900 rounded-lg p-0.5 border border-space-700 text-xs font-mono">
          <button
            onClick={() => {
              soundEngine?.playClick();
              setActiveSiteTab("siteA");
            }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeSiteTab === "siteA"
                ? "bg-amber-500 text-space-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            SITE A: {siteA.site.name}
          </button>
          <button
            onClick={() => {
              soundEngine?.playClick();
              setActiveSiteTab("siteB");
            }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeSiteTab === "siteB"
                ? "bg-sky-500 text-space-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            SITE B: {siteB.site.name}
          </button>
        </div>
      </div>

      {/* Legend and Status Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-2 px-3 bg-space-900/60 rounded-lg border border-space-800 mb-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
            Sun Elevation (°)
          </div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="w-3 h-0.5 border-b border-dashed border-amber-600 inline-block"></span>
            LOLA Sun Horizon Mask (°)
          </div>
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-0.5 bg-sky-400 inline-block"></span>
            Earth Elevation (°)
          </div>
          <div className="flex items-center gap-1.5 text-sky-600">
            <span className="w-3 h-0.5 border-b border-dashed border-sky-600 inline-block"></span>
            LOLA Earth Horizon Mask (°)
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          Rule: Body is <strong className="text-emerald-400 font-semibold">VISIBLE</strong> when Elevation &gt; Local Terrain Mask
        </div>
      </div>

      {/* SVG Time-Series Chart */}
      <div className="relative overflow-x-auto bg-space-950/80 rounded-xl p-2 border border-space-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none"
        >
          <defs>
            <linearGradient id="sunVisibleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="earthVisibleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={scaleY(tick)}
                x2={width - padding.right}
                y2={scaleY(tick)}
                stroke="#1e293b"
                strokeWidth={tick === 0 ? "1.5" : "0.7"}
                strokeDasharray={tick === 0 ? undefined : "3 3"}
              />
              <text
                x={padding.left - 8}
                y={scaleY(tick) + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick}°
              </text>
            </g>
          ))}

          {/* Zero Horizon Reference Line */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#475569"
            strokeWidth="1.2"
          />
          <text
            x={width - padding.right + 6}
            y={zeroY + 3}
            fill="#475569"
            fontSize="9"
            fontFamily="monospace"
          >
            0° Horiz
          </text>

          {/* LOLA Terrain Obstruction lines (Dashed) */}
          <path
            d={sunObstructionPath}
            fill="none"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.75"
          />
          <path
            d={earthObstructionPath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Sun Elevation Line (Solid Amber) */}
          <path
            d={sunPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Earth Elevation Line (Solid Cyan) */}
          <path
            d={earthPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points on Hover */}
          {telemetry.map((t, idx) => {
            const x = scaleX(idx);
            const isHovered = hoveredPoint?.timestamp === t.timestamp;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(t)}
                className="cursor-pointer"
              >
                {/* Invisible hit column */}
                <rect
                  x={x - plotWidth / (telemetry.length * 2)}
                  y={padding.top}
                  width={plotWidth / telemetry.length}
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Visible Points */}
                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={scaleY(t.sunElevation)}
                      r="5"
                      fill="#f59e0b"
                      stroke="#070b14"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={scaleY(t.earthElevation)}
                      r="5"
                      fill="#38bdf8"
                      stroke="#070b14"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {timeTicks.map((tick, i) => {
            const x = scaleX(tick.index);
            const dateObj = new Date(tick.point.timestamp);
            const dateLabel = `${dateObj.getUTCMonth() + 1}/${dateObj.getUTCDate()} ${String(
              dateObj.getUTCHours()
            ).padStart(2, "0")}h`;

            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Inspector Box */}
        {hoveredPoint ? (
          <div className="mt-2 p-2.5 rounded-lg bg-space-900 border border-space-700 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
            <div>
              <span className="text-slate-400">UTC TIMESTAMP:</span>
              <div className="text-white font-bold">
                {hoveredPoint.timestamp.replace("T", " ").replace(".000Z", " UTC")}
              </div>
            </div>

            <div>
              <span className="text-amber-400">SUN STATUS:</span>
              <div className="font-bold">
                <span className={hoveredPoint.isSunVisible ? "text-emerald-400" : "text-rose-400"}>
                  {hoveredPoint.isSunVisible ? "VISIBLE" : "SHADOWED"}
                </span>{" "}
                ({hoveredPoint.sunElevation}° elev | {hoveredPoint.sunAzimuth}° az)
              </div>
              <div className="text-[10px] text-slate-400">
                LOLA Mask: {hoveredPoint.sunTerrainObstruction}°
              </div>
            </div>

            <div>
              <span className="text-sky-400">EARTH STATUS:</span>
              <div className="font-bold">
                <span className={hoveredPoint.isEarthVisible ? "text-emerald-400" : "text-rose-400"}>
                  {hoveredPoint.isEarthVisible ? "LoS CLEAR" : "BLOCKED"}
                </span>{" "}
                ({hoveredPoint.earthElevation}° elev | {hoveredPoint.earthAzimuth}° az)
              </div>
              <div className="text-[10px] text-slate-400">
                LOLA Mask: {hoveredPoint.earthTerrainObstruction}°
              </div>
            </div>

            <div>
              <span className="text-emerald-400">DUAL WINDOW:</span>
              <div className="font-bold">
                <span
                  className={
                    hoveredPoint.isDualWindow
                      ? "text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded"
                      : "text-slate-500"
                  }
                >
                  {hoveredPoint.isDualWindow ? "ACTIVE (POWER + COMMS)" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 py-1 text-center text-xs font-mono text-slate-500">
            Hover over any point on the chart to inspect UTC angles and local LOLA terrain obstruction values.
          </div>
        )}
      </div>
    </div>
  );
}
