"use client";

import React, { useState } from "react";
import { CandidateSite } from "@/lib/types";
import { Eye, Globe, MapPin, ZoomIn } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface LunarMapProps {
  sites: CandidateSite[];
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSelectSiteA: (site: CandidateSite) => void;
  onSelectSiteB: (site: CandidateSite) => void;
}

export function LunarMap({
  sites,
  selectedSiteA,
  selectedSiteB,
  onSelectSiteA,
  onSelectSiteB,
}: LunarMapProps) {
  const [mapMode, setMapMode] = useState<"south-pole" | "global">("south-pole");
  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);

  // Projection math for South Pole (Stereographic projection centered on 90°S)
  // Distance from center = (90 - abs(lat)) * scale
  // Angle = longitude * PI / 180
  const polarScale = 16; // pixels per degree from pole
  const polarCenter = 190;

  const getPolarCoords = (site: CandidateSite) => {
    // Only meaningful for southern sites
    const colat = 90 - Math.abs(site.latitude);
    const r = Math.min(160, colat * polarScale);
    const theta = (site.longitude - 90) * (Math.PI / 180);
    const x = polarCenter + r * Math.cos(theta);
    const y = polarCenter + r * Math.sin(theta);
    return { x, y, visible: site.latitude < -70 };
  };

  // Global Orthographic projection (Centered on 0° lat, 0° lon)
  const getGlobalCoords = (site: CandidateSite) => {
    const latRad = (site.latitude * Math.PI) / 180;
    const lonRad = (site.longitude * Math.PI) / 180;
    const rGlobe = 135;
    const x = polarCenter + rGlobe * Math.cos(latRad) * Math.sin(lonRad);
    const y = polarCenter - rGlobe * Math.sin(latRad);
    return { x, y, visible: Math.cos(latRad) * Math.cos(lonRad) > -0.2 };
  };

  return (
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento relative flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-cyan-400/90 font-semibold">
              SURFACE_TOPOGRAPHY // LROC_BASEMAP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] shrink-0" />
            <h2 className="text-base font-display font-bold text-white tracking-tight flex items-center gap-2">
              Interactive Surface Map
            </h2>
          </div>
        </div>

        {/* Projection Mode Switcher */}
        <div className="flex items-center bg-black/60 rounded-full p-1 border border-white/10 text-xs font-mono shrink-0">
          <button
            onClick={() => {
              soundEngine?.playClick();
              setMapMode("south-pole");
            }}
            className={`px-3 py-1.5 rounded-full transition-all ${
              mapMode === "south-pole"
                ? "bg-amber-500 text-space-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            South Pole
          </button>
          <button
            onClick={() => {
              soundEngine?.playClick();
              setMapMode("global");
            }}
            className={`px-3 py-1.5 rounded-full transition-all ${
              mapMode === "global"
                ? "bg-cyan-400 text-space-950 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Global Globe
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative flex flex-col items-center justify-center bg-space-950/70 rounded-xl p-3 border border-space-800 overflow-hidden">
        <svg
          viewBox="0 0 380 380"
          className="w-full max-w-[380px] h-auto select-none"
        >
          <defs>
            {/* Lunar surface gradients */}
            <radialGradient id="lunarSurface" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#252d3d" />
              <stop offset="60%" stopColor="#151c28" />
              <stop offset="100%" stopColor="#0c1017" />
            </radialGradient>
            <radialGradient id="craterShade" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#0b0f19" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e2736" stopOpacity="0.3" />
            </radialGradient>
            <filter id="amberGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>
            <filter id="skyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Lunar Globe / Projection Disc */}
          <circle
            cx={polarCenter}
            cy={polarCenter}
            r={160}
            fill="url(#lunarSurface)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {mapMode === "south-pole" ? (
            /* South Pole Grid & Major Craters */
            <g>
              {/* Latitude Rings */}
              <circle
                cx={polarCenter}
                cy={polarCenter}
                r={160}
                fill="none"
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="4 4"
              />
              <circle
                cx={polarCenter}
                cy={polarCenter}
                r={110}
                fill="none"
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="4 4"
              />
              <circle
                cx={polarCenter}
                cy={polarCenter}
                r={60}
                fill="none"
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="4 4"
              />
              <circle
                cx={polarCenter}
                cy={polarCenter}
                r={16}
                fill="none"
                stroke="#475569"
                strokeWidth="1"
              />

              {/* Meridian lines */}
              <line x1={polarCenter} y1={30} x2={polarCenter} y2={350} stroke="#1e293b" strokeWidth="0.8" />
              <line x1={30} y1={polarCenter} x2={350} y2={polarCenter} stroke="#1e293b" strokeWidth="0.8" />

              {/* Prominent South Pole Craters & Permanent Shadow Regions (PSRs) */}
              {/* Shackleton Crater (Centered right on 89.9°S) */}
              <circle cx={polarCenter} cy={polarCenter} r={12} fill="#05070c" stroke="#475569" strokeWidth="1" />
              <text x={polarCenter + 14} y={polarCenter + 4} fill="#64748b" fontSize="8" fontFamily="monospace">
                Shackleton (PSR)
              </text>

              {/* Faustini Crater */}
              <circle cx={polarCenter + 48} cy={polarCenter - 15} r={18} fill="#090d15" stroke="#334155" strokeWidth="0.8" />
              <text x={polarCenter + 48} y={polarCenter - 18} fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">
                Faustini
              </text>

              {/* Haworth Crater */}
              <circle cx={polarCenter - 45} cy={polarCenter + 25} r={22} fill="#090d15" stroke="#334155" strokeWidth="0.8" />
              <text x={polarCenter - 45} y={polarCenter + 28} fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">
                Haworth
              </text>

              {/* Shoemaker Crater */}
              <circle cx={polarCenter + 20} cy={polarCenter + 55} r={24} fill="#090d15" stroke="#334155" strokeWidth="0.8" />
              <text x={polarCenter + 20} y={polarCenter + 58} fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">
                Shoemaker
              </text>

              {/* de Gerlache Crater */}
              <circle cx={polarCenter - 50} cy={polarCenter - 30} r={16} fill="#090d15" stroke="#334155" strokeWidth="0.8" />
              <text x={polarCenter - 50} y={polarCenter - 32} fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">
                de Gerlache
              </text>

              {/* Latitude labels */}
              <text x={polarCenter + 4} y={polarCenter - 64} fill="#475569" fontSize="8" fontFamily="monospace">86°S</text>
              <text x={polarCenter + 4} y={polarCenter - 114} fill="#475569" fontSize="8" fontFamily="monospace">83°S</text>
              <text x={polarCenter + 4} y={polarCenter - 148} fill="#475569" fontSize="8" fontFamily="monospace">80°S</text>
              <text x={polarCenter + 4} y={24} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">0° Meridian (Earth Facing)</text>
              <text x={polarCenter + 4} y={368} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">180° (Far Side)</text>
            </g>
          ) : (
            /* Global Orthographic Mode */
            <g>
              {/* Equator & Meridians */}
              <line x1={55} y1={polarCenter} x2={325} y2={polarCenter} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <ellipse cx={polarCenter} cy={polarCenter} rx={75} ry={135} fill="none" stroke="#1e293b" strokeWidth="0.8" />
              <ellipse cx={polarCenter} cy={polarCenter} rx={120} ry={135} fill="none" stroke="#1e293b" strokeWidth="0.8" />

              {/* Lunar Maria Basalt Shapes */}
              {/* Mare Tranquillitatis */}
              <path d="M 210 160 Q 235 150 245 170 Q 230 190 205 180 Z" fill="#131924" stroke="#1e293b" strokeWidth="0.5" />
              <text x="225" y="172" fill="#475569" fontSize="7" fontFamily="monospace">Tranquillitatis</text>

              {/* Mare Imbrium */}
              <circle cx="160" cy="140" r="32" fill="#131924" stroke="#1e293b" strokeWidth="0.5" />
              <text x="160" y="142" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">Imbrium</text>

              {/* Oceanus Procellarum */}
              <path d="M 105 150 Q 130 180 120 220 Q 90 200 95 160 Z" fill="#131924" />

              {/* Mare Crisium (Distinct circular dark basin in NE limb) */}
              <ellipse cx="270" cy="150" rx="18" ry="15" fill="#0f1622" stroke="#334155" strokeWidth="1" />
              <text x="270" y="153" fill="#64748b" fontSize="7" fontFamily="monospace" textAnchor="middle">Crisium</text>

              {/* South Polar Cap Highlight */}
              <ellipse cx={polarCenter} cy="315" rx="35" ry="12" fill="#1e293b" fillOpacity="0.4" stroke="#475569" strokeWidth="0.8" />
              <text x={polarCenter} y="328" fill="#64748b" fontSize="7" fontFamily="monospace" textAnchor="middle">South Pole</text>
            </g>
          )}

          {/* Candidate Sites Pins */}
          {sites.map((site) => {
            const coords = mapMode === "south-pole" ? getPolarCoords(site) : getGlobalCoords(site);
            if (!coords.visible) return null;

            const isA = selectedSiteA.id === site.id;
            const isB = selectedSiteB.id === site.id;

            return (
              <g
                key={site.id}
                className="cursor-pointer transition-transform"
                onClick={() => {
                  soundEngine?.playBeaconSelect();
                  if (!isA && !isB) onSelectSiteA(site);
                  else if (isA) onSelectSiteB(site);
                  else onSelectSiteA(site);
                }}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
              >
                {/* Ping animation for active sites */}
                {isA && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="12"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75 origin-center"
                  />
                )}
                {isB && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="12"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75 origin-center"
                  />
                )}

                {/* Marker Pin */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isA || isB ? 6 : 4}
                  fill={isA ? "#f59e0b" : isB ? "#38bdf8" : "#94a3b8"}
                  stroke="#070b14"
                  strokeWidth="2"
                  filter={isA ? "url(#amberGlow)" : isB ? "url(#skyGlow)" : undefined}
                />

                {/* Label Tag */}
                <g transform={`translate(${coords.x + 8}, ${coords.y - 8})`}>
                  <rect
                    x="-2"
                    y="-10"
                    width={site.name.length * 5.6 + 18}
                    height="16"
                    rx="3"
                    fill={isA ? "rgba(245, 158, 11, 0.9)" : isB ? "rgba(56, 189, 248, 0.9)" : "rgba(15, 23, 42, 0.85)"}
                    stroke={isA ? "#f59e0b" : isB ? "#38bdf8" : "#334155"}
                    strokeWidth="0.8"
                  />
                  <text
                    x="2"
                    y="2"
                    fill={isA || isB ? "#070b14" : "#f1f5f9"}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isA ? "A: " : isB ? "B: " : ""}
                    {site.name.split(" ")[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hover / Info Banner Under Map */}
        <div className="w-full mt-2 pt-2 border-t border-space-800 text-xs font-mono flex items-center justify-between text-slate-400">
          <div>
            {hoveredSite ? (
              <span className="text-amber-300">
                <strong>{hoveredSite.name}</strong> ({hoveredSite.coordinatesDisplay}) — Elev: +{hoveredSite.elevationKm}km
              </span>
            ) : (
              <span>Click markers to toggle Site A (Amber) or Site B (Cyan)</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">Projection: WGS-84 / Lunar IAU</span>
        </div>
      </div>
    </div>
  );
}
