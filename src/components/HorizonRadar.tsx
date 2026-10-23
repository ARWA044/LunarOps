"use client";

import React, { useState } from "react";
import { CandidateSite, SiteAnalysisResult } from "@/lib/types";
import { Compass, Eye, Mountain } from "lucide-react";

interface HorizonRadarProps {
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

export function HorizonRadar({ siteA, siteB }: HorizonRadarProps) {
  const [viewMode, setViewMode] = useState<"unwrapped" | "polar">("unwrapped");
  const [selectedSiteKey, setSelectedSiteKey] = useState<"siteA" | "siteB" | "compare">("compare");

  const siteAProfile = siteA.site.horizonProfile;
  const siteBProfile = siteB.site.horizonProfile;

  // Azimuths traversed by Sun and Earth during the mission window
  const sunAzimuthsA = siteA.telemetry.map((t) => t.sunAzimuth);
  const earthAzimuthsA = siteA.telemetry.map((t) => t.earthAzimuth);

  // SVG dimensions
  const width = 850;
  const height = 260;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxAngle = 4.5; // Max degrees obstruction

  const scaleAz = (az: number) => padding.left + (az / 360) * plotWidth;
  const scaleDeg = (deg: number) =>
    padding.top + plotHeight - (Math.max(0, Math.min(maxAngle, deg)) / maxAngle) * plotHeight;

  // Unwrapped SVG path for Site A
  const pathA =
    siteAProfile
      .map((val, az) => `${az === 0 ? "M" : "L"} ${scaleAz(az)} ${scaleDeg(val)}`)
      .join(" ") +
    ` L ${scaleAz(359)} ${scaleDeg(0)} L ${scaleAz(0)} ${scaleDeg(0)} Z`;

  // Unwrapped SVG path for Site B
  const pathB =
    siteBProfile
      .map((val, az) => `${az === 0 ? "M" : "L"} ${scaleAz(az)} ${scaleDeg(val)}`)
      .join(" ") +
    ` L ${scaleAz(359)} ${scaleDeg(0)} L ${scaleAz(0)} ${scaleDeg(0)} Z`;

  // Cardinal directions
  const cardinalTicks = [
    { label: "0° (N)", az: 0 },
    { label: "45° (NE)", az: 45 },
    { label: "90° (E)", az: 90 },
    { label: "135° (SE)", az: 135 },
    { label: "180° (S)", az: 180 },
    { label: "225° (SW)", az: 225 },
    { label: "270° (W)", az: 270 },
    { label: "315° (NW)", az: 315 },
    { label: "360° (N)", az: 360 },
  ];

  const yTicks = [0, 1, 2, 3, 4];

  // Polar projection helpers
  const polarCenter = 175;
  const polarMaxRadius = 140;

  const getPolarPoint = (azDeg: number, elevDeg: number) => {
    // 0 deg elevation at outer rim, 4 deg at center (or vice versa: center = zenith 90, outer = 0)
    // For local horizon mask: 0° mask at inner baseline, 4° mask towards outer rim
    const r = (Math.max(0, Math.min(maxAngle, elevDeg)) / maxAngle) * polarMaxRadius;
    const rad = ((azDeg - 90) * Math.PI) / 180;
    return {
      x: polarCenter + r * Math.cos(rad),
      y: polarCenter + r * Math.sin(rad),
    };
  };

  const polarPathA = siteAProfile
    .map((val, az) => {
      const p = getPolarPoint(az, val);
      return `${az === 0 ? "M" : "L"} ${p.x} ${p.y}`;
    })
    .join(" ") + " Z";

  const polarPathB = siteBProfile
    .map((val, az) => {
      const p = getPolarPoint(az, val);
      return `${az === 0 ? "M" : "L"} ${p.x} ${p.y}`;
    })
    .join(" ") + " Z";

  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-space-700/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              360° Local Terrain Horizon Profile (NASA LOLA DEM)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Surrounding lunar crater rims & ridge elevation masks ($0^\circ$ to $360^\circ$ azimuth) that obstruct Sun & Earth LoS.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          {/* Display Mode */}
          <div className="flex items-center bg-space-900 rounded-lg p-0.5 border border-space-700 text-xs font-mono">
            <button
              onClick={() => setViewMode("unwrapped")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === "unwrapped"
                  ? "bg-amber-500 text-space-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              360° Line Profile
            </button>
            <button
              onClick={() => setViewMode("polar")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === "polar"
                  ? "bg-amber-500 text-space-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Polar Radar (360°)
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-1.5 px-3 bg-space-900/60 rounded-lg border border-space-800 mb-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block"></span>
            Site A Horizon: {siteA.site.name}
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-3 rounded bg-sky-500/30 border border-sky-500 inline-block"></span>
            Site B Horizon: {siteB.site.name}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Source: NASA Lunar Reconnaissance Orbiter (LRO) / LOLA Gridded Data Record
        </span>
      </div>

      {/* Graphic Display */}
      {viewMode === "unwrapped" ? (
        <div className="relative overflow-x-auto bg-space-950/80 rounded-xl p-2 border border-space-800">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[650px] select-none"
          >
            {/* Horizontal Grid */}
            {yTicks.map((deg) => (
              <g key={deg}>
                <line
                  x1={padding.left}
                  y1={scaleDeg(deg)}
                  x2={width - padding.right}
                  y2={scaleDeg(deg)}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 6}
                  y={scaleDeg(deg) + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  +{deg}°
                </text>
              </g>
            ))}

            {/* Azimuth Vertical Grid */}
            {cardinalTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={scaleAz(tick.az)}
                  y1={padding.top}
                  x2={scaleAz(tick.az)}
                  y2={height - padding.bottom}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                />
                <text
                  x={scaleAz(tick.az)}
                  y={height - padding.bottom + 16}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Site B Horizon Area (Sky) */}
            <path
              d={pathB}
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Site A Horizon Area (Amber) */}
            <path
              d={pathA}
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        /* Polar Radar Mode */
        <div className="flex flex-col items-center justify-center bg-space-950/80 rounded-xl p-4 border border-space-800">
          <svg viewBox="0 0 350 350" className="w-full max-w-[350px] h-auto select-none">
            {/* Concentric rings */}
            {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
              <g key={idx}>
                <circle
                  cx={polarCenter}
                  cy={polarCenter}
                  r={polarMaxRadius * frac}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
                <text
                  x={polarCenter + 3}
                  y={polarCenter - polarMaxRadius * frac + 10}
                  fill="#475569"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  +{(maxAngle * frac).toFixed(1)}°
                </text>
              </g>
            ))}

            {/* Axes */}
            <line x1={polarCenter} y1={25} x2={polarCenter} y2={325} stroke="#334155" strokeWidth="0.8" />
            <line x1={25} y1={polarCenter} x2={325} y2={polarCenter} stroke="#334155" strokeWidth="0.8" />

            {/* Cardinal labels */}
            <text x={polarCenter} y={18} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">0° (N)</text>
            <text x={335} y={polarCenter + 3} fill="#94a3b8" fontSize="9" fontFamily="monospace">90° (E)</text>
            <text x={polarCenter} y={342} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">180° (S)</text>
            <text x={8} y={polarCenter + 3} fill="#94a3b8" fontSize="9" fontFamily="monospace">270° (W)</text>

            {/* Site B Mask */}
            <path
              d={polarPathB}
              fill="rgba(56, 189, 248, 0.2)"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />

            {/* Site A Mask */}
            <path
              d={polarPathA}
              fill="rgba(245, 158, 11, 0.25)"
              stroke="#f59e0b"
              strokeWidth="2"
            />

            {/* Center origin */}
            <circle cx={polarCenter} cy={polarCenter} r="3" fill="#f8fafc" />
          </svg>
          <span className="text-[11px] font-mono text-slate-400 mt-2">
            Polar Azimuthal Obstruction Mask: Distance from center represents terrain elevation mask angle (0° to +4.5°).
          </span>
        </div>
      )}
    </div>
  );
}
