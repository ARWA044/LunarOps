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
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-cyan-400/90 font-semibold">
              ORBITAL_TELEMETRY // LOLA_DEM_30M
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              Elevation vs. LOLA Terrain Horizon Obstruction
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sun and Earth elevation angles relative to the site's local 360° terrain mask over UTC mission time.
          </p>
        </div>

        {/* Site View Toggle Tabs (Capsule Pill) */}
        <div className="flex items-center bg-black/60 rounded-full p-1 border border-white/10 text-xs font-mono shrink-0">
          <button
            onClick={() => {
              soundEngine?.playClick();
              setActiveSiteTab("siteA");
            }}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
              activeSiteTab === "siteA"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-space-950 font-bold shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeSiteTab === "siteA" ? "bg-space-950" : "bg-amber-400 animate-pulse"}`}></span>
            SITE A: {siteA.site.name}
          </button>
          <button
            onClick={() => {
              soundEngine?.playClick();
              setActiveSiteTab("siteB");
            }}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
              activeSiteTab === "siteB"
                ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-space-950 font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeSiteTab === "siteB" ? "bg-space-950" : "bg-cyan-400 animate-pulse"}`}></span>
            SITE B: {siteB.site.name}
          </button>
        </div>
      </div>

      {/* Legend and Status Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-2.5 px-4 bg-black/40 rounded-2xl border border-white/[0.06] mb-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-3.5 h-1 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
            Sun Elevation (°)
          </div>
          <div className="flex items-center gap-1.5 text-amber-500/80">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-500 inline-block"></span>
            LOLA Sun Horizon Mask (°)
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <span className="w-3.5 h-1 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_rgba(0,240,255,0.8)]"></span>
            Earth Elevation (°)
          </div>
          <div className="flex items-center gap-1.5 text-cyan-600">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-cyan-500 inline-block"></span>
            LOLA Earth Horizon Mask (°)
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-600/50 inline-block"></span>
            LOLA Rock Shadow Relief
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-sans">
          Rule: Body is <strong className="text-emerald-400 font-semibold">VISIBLE</strong> when Elevation &gt; Local Terrain Mask
        </div>
      </div>

      {/* SVG Time-Series Chart */}
      <div className="relative overflow-x-auto bg-[#030712]/90 rounded-2xl p-3.5 border border-white/[0.06] shadow-inner">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none"
        >
          <defs>
            {/* Glow filter for Sun line */}
            <filter id="glowSun" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow filter for Earth line */}
            <filter id="glowEarth" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Diagonal hatch pattern for LOLA rock shadow relief */}
            <pattern
              id="terrainHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="#64748b"
                strokeWidth="1.2"
                strokeOpacity="0.25"
              />
            </pattern>

            {/* Area Fill Gradients */}
            <linearGradient id="sunAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="earthAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="terrainAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Area under LOLA Terrain Obstruction (Rock Shadow Hatch) */}
          {telemetry.length > 0 && (
            <>
              <path
                d={`${sunObstructionPath} L ${scaleX(telemetry.length - 1)} ${height - padding.bottom} L ${scaleX(0)} ${height - padding.bottom} Z`}
                fill="url(#terrainAreaGrad)"
              />
              <path
                d={`${sunObstructionPath} L ${scaleX(telemetry.length - 1)} ${height - padding.bottom} L ${scaleX(0)} ${height - padding.bottom} Z`}
                fill="url(#terrainHatch)"
              />
            </>
          )}

          {/* Area under Sun Curve */}
          {telemetry.length > 0 && (
            <path
              d={`${sunPath} L ${scaleX(telemetry.length - 1)} ${height - padding.bottom} L ${scaleX(0)} ${height - padding.bottom} Z`}
              fill="url(#sunAreaGrad)"
            />
          )}

          {/* Area under Earth Curve */}
          {telemetry.length > 0 && (
            <path
              d={`${earthPath} L ${scaleX(telemetry.length - 1)} ${height - padding.bottom} L ${scaleX(0)} ${height - padding.bottom} Z`}
              fill="url(#earthAreaGrad)"
            />
          )}

          {/* Background Grid Lines (Ultra-Minimal Aerospace Oscilloscope) */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={scaleY(tick)}
                x2={width - padding.right}
                y2={scaleY(tick)}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={tick === 0 ? "1.2" : "0.5"}
                strokeDasharray={tick === 0 ? undefined : "2 4"}
              />
              <text
                x={padding.left - 8}
                y={scaleY(tick) + 3.5}
                fill="rgba(148, 163, 184, 0.6)"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick > 0 ? `+${tick}` : tick}°
              </text>
            </g>
          ))}

          {/* Zero Horizon Reference Line */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="1"
          />
          <text
            x={width - padding.right + 6}
            y={zeroY + 3}
            fill="rgba(148, 163, 184, 0.5)"
            fontSize="8.5"
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
            opacity="0.85"
          />
          <path
            d={earthObstructionPath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Sun Elevation Line (Solid Glowing Amber) */}
          <path
            d={sunPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glowSun)"
          />

          {/* Earth Elevation Line (Solid Glowing Cyan) */}
          <path
            d={earthPath}
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glowEarth)"
          />

          {/* Hover Crosshair & Interactive Hit Zones */}
          {telemetry.map((t, idx) => {
            const x = scaleX(idx);
            const isHovered = hoveredPoint?.timestamp === t.timestamp;

            return (
              <g
                key={idx}
                onMouseEnter={() => {
                  soundEngine?.playDataTick();
                  setHoveredPoint(t);
                }}
                className="cursor-pointer"
              >
                {/* Hit column */}
                <rect
                  x={x - plotWidth / (telemetry.length * 2)}
                  y={padding.top}
                  width={plotWidth / telemetry.length}
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Laser Needle Crosshair on Hover */}
                {isHovered && (
                  <g>
                    {/* Glowing Laser Vertical Line */}
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="#00f0ff"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      style={{ filter: "drop-shadow(0 0 6px #00f0ff)" }}
                    />

                    {/* Sun Data Point Halo Ring */}
                    <circle
                      cx={x}
                      cy={scaleY(t.sunElevation)}
                      r="7"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                    <circle
                      cx={x}
                      cy={scaleY(t.sunElevation)}
                      r="4.5"
                      fill="#f59e0b"
                      stroke="#040814"
                      strokeWidth="2"
                      style={{ filter: "drop-shadow(0 0 8px #f59e0b)" }}
                    />

                    {/* Earth Data Point Halo Ring */}
                    <circle
                      cx={x}
                      cy={scaleY(t.earthElevation)}
                      r="7"
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                    <circle
                      cx={x}
                      cy={scaleY(t.earthElevation)}
                      r="4.5"
                      fill="#00f0ff"
                      stroke="#040814"
                      strokeWidth="2"
                      style={{ filter: "drop-shadow(0 0 8px #00f0ff)" }}
                    />

                    {/* LOLA Obstacle Intersection Dot */}
                    <circle
                      cx={x}
                      cy={scaleY(t.sunTerrainObstruction)}
                      r="3.5"
                      fill="#94a3b8"
                      stroke="#040814"
                      strokeWidth="1.5"
                    />
                  </g>
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

        {/* Hover Telemetry HUD (Bento Glass Capsule) */}
        {hoveredPoint ? (
          <div className="mt-3 p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-bento backdrop-blur-xl">
            <div>
              <span className="text-slate-400 text-[10px] uppercase tracking-widest-xl block font-semibold">
                UTC TELEMETRY STAMP
              </span>
              <div className="text-white font-display font-semibold text-sm mt-1">
                {hoveredPoint.timestamp.replace("T", " ").replace(".000Z", " UTC")}
              </div>
            </div>

            <div>
              <span className="text-amber-400 text-[10px] uppercase tracking-widest-xl block font-semibold">
                SOLAR ELEVATION
              </span>
              <div className="font-display font-semibold text-sm mt-1">
                <span className={hoveredPoint.isSunVisible ? "text-emerald-400" : "text-rose-400"}>
                  {hoveredPoint.isSunVisible ? "ILLUMINATED" : "IN SHADOW"}
                </span>{" "}
                <span className="text-white font-mono text-xs">
                  ({hoveredPoint.sunElevation > 0 ? `+${hoveredPoint.sunElevation}` : hoveredPoint.sunElevation}°)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                LOLA Mask: {hoveredPoint.sunTerrainObstruction}°
              </div>
            </div>

            <div>
              <span className="text-cyan-400 text-[10px] uppercase tracking-widest-xl block font-semibold">
                DIRECT-TO-EARTH LOS
              </span>
              <div className="font-display font-semibold text-sm mt-1">
                <span className={hoveredPoint.isEarthVisible ? "text-emerald-400" : "text-rose-400"}>
                  {hoveredPoint.isEarthVisible ? "LINE OF SIGHT" : "BLOCKED"}
                </span>{" "}
                <span className="text-white font-mono text-xs">
                  ({hoveredPoint.earthElevation > 0 ? `+${hoveredPoint.earthElevation}` : hoveredPoint.earthElevation}°)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                LOLA Mask: {hoveredPoint.earthTerrainObstruction}°
              </div>
            </div>

            <div>
              <span className="text-emerald-400 text-[10px] uppercase tracking-widest-xl block font-semibold">
                DUAL OPERATION WINDOW
              </span>
              <div className="mt-1">
                <span
                  className={
                    hoveredPoint.isDualWindow
                      ? "text-emerald-300 font-display font-bold text-xs bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      : "text-slate-500 font-mono text-xs"
                  }
                >
                  {hoveredPoint.isDualWindow ? "ACTIVE (POWER + COMMS)" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 py-2 text-center text-xs font-mono text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            Hover over any UTC coordinate on the oscilloscope to read exact LOLA relief depth & line-of-sight status.
          </div>
        )}
      </div>
    </div>
  );
}
