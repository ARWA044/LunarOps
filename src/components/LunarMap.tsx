"use client";

import React, { useState } from "react";
import { CandidateSite } from "@/lib/types";
import { Check, Globe, MapPin } from "lucide-react";
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
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");

  const assignSite = (site: CandidateSite) => {
    soundEngine?.playBeaconSelect();
    if (activeSlot === "A") onSelectSiteA(site);
    else onSelectSiteB(site);
  };

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
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento relative flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-cyan-400/90 font-semibold">
              SURFACE TOPOGRAPHY <span className="text-slate-600">/</span> LROC BASEMAP
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
        <div className="flex items-center bg-black/35 rounded-xl p-1 border border-white/[0.08] text-[10px] font-mono shrink-0 shadow-inner">
          <button
            type="button"
            aria-pressed={mapMode === "south-pole"}
            onClick={() => {
              soundEngine?.playClick();
              setMapMode("south-pole");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
              mapMode === "south-pole"
                ? "bg-amber-400 text-space-950 font-bold shadow-[0_3px_14px_rgba(245,158,11,0.24)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="h-3 w-3" /> South Pole
          </button>
          <button
            type="button"
            aria-pressed={mapMode === "global"}
            onClick={() => {
              soundEngine?.playClick();
              setMapMode("global");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
              mapMode === "global"
                ? "bg-cyan-300 text-space-950 font-bold shadow-[0_3px_14px_rgba(0,240,255,0.22)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="h-3 w-3" /> Global
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 border border-white/[0.07] overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,rgba(28,42,61,0.28),rgba(4,7,13,0.82)_72%)]">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-telemetry-grid [background-size:28px_28px]" />
        <div className="relative z-10 mb-1 flex w-full max-w-[380px] items-center justify-between px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
          <span>{mapMode === "south-pole" ? "Polar stereographic" : "Near-side projection"}</span>
          <span>IAU · 2027</span>
        </div>
        <svg
          viewBox="0 0 380 380"
          className="relative z-10 w-full max-w-[380px] h-auto select-none"
          role="group"
          aria-label={`${mapMode === "south-pole" ? "South polar" : "Global lunar"} map with interactive candidate landing sites`}
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
                role="button"
                tabIndex={0}
                aria-label={`${site.name}, ${isA ? "Site A" : isB ? "Site B" : "unassigned"}. Assign to Site ${activeSlot}.`}
                className="cursor-pointer outline-none"
                onClick={() => assignSite(site)}
                onKeyDown={(event: React.KeyboardEvent<SVGGElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    assignSite(site);
                  }
                }}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
                onFocus={() => setHoveredSite(site)}
                onBlur={() => setHoveredSite(null)}
              >
                <title>{`${site.name} · ${site.coordinatesDisplay} · ${site.category}`}</title>
                <circle cx={coords.x} cy={coords.y} r="13" fill="transparent" />
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
                  r={isA || isB ? 7 : 4.5}
                  fill={isA ? "#f59e0b" : isB ? "#38bdf8" : "#94a3b8"}
                  stroke="#070b14"
                  strokeWidth="2"
                  filter={isA ? "url(#amberGlow)" : isB ? "url(#skyGlow)" : undefined}
                />

              </g>
            );
          })}
        </svg>

        <div className="relative z-10 mt-3 w-full max-w-[420px] border-t border-white/[0.07] pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Assign next selection to</span>
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-2 py-1 font-mono text-[9px] text-slate-400">
              {hoveredSite ? hoveredSite.coordinatesDisplay : "CHOOSE A LOCATION"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={activeSlot === "A"} onClick={() => setActiveSlot("A")}
              className={`min-w-0 rounded-xl border px-2.5 py-2 text-left transition-all ${activeSlot === "A" ? "border-amber-400/45 bg-amber-400/[0.1] shadow-[0_0_18px_rgba(245,158,11,0.08)]" : "border-white/[0.07] bg-black/15 hover:border-amber-400/25"}`}>
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Target · A</span>
              <span className="block truncate font-display text-[11px] font-semibold text-white">{selectedSiteA.name}</span>
            </button>
            <button type="button" aria-pressed={activeSlot === "B"} onClick={() => setActiveSlot("B")}
              className={`min-w-0 rounded-xl border px-2.5 py-2 text-left transition-all ${activeSlot === "B" ? "border-cyan-300/45 bg-cyan-300/[0.1] shadow-[0_0_18px_rgba(34,211,238,0.08)]" : "border-white/[0.07] bg-black/15 hover:border-cyan-300/25"}`}>
              <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Reference · B</span>
              <span className="block truncate font-display text-[11px] font-semibold text-white">{selectedSiteB.name}</span>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Candidate sites</span>
            <span className={`font-mono text-[9px] uppercase tracking-wider ${activeSlot === "A" ? "text-amber-300" : "text-cyan-300"}`}>Selecting for {activeSlot}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {sites.map((site) => {
              const isA = selectedSiteA.id === site.id;
              const isB = selectedSiteB.id === site.id;
              const isCurrent = activeSlot === "A" ? isA : isB;
              return (
                <button key={site.id} type="button" title={`Assign ${site.name} to Site ${activeSlot}`} onClick={() => assignSite(site)}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-all ${isCurrent ? activeSlot === "A" ? "border-amber-400/50 bg-amber-400/[0.09]" : "border-cyan-300/50 bg-cyan-300/[0.09]" : "border-white/[0.06] bg-black/10 hover:border-white/20 hover:bg-white/[0.03]"}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${isA ? "bg-amber-400" : isB ? "bg-cyan-300" : "bg-slate-600"}`} />
                  <span className="min-w-0 flex-1 truncate font-display text-[10px] font-medium text-slate-200">{site.name}</span>
                  {isCurrent && <Check className={`h-3 w-3 shrink-0 ${activeSlot === "A" ? "text-amber-300" : "text-cyan-300"}`} />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[9px] font-mono text-slate-500">
            <span>{hoveredSite ? <><strong className="font-semibold text-slate-300">{hoveredSite.name}</strong> · {hoveredSite.category}</> : "Select a marker or site name to assign it"}</span>
            <span className="shrink-0">IAU LUNAR DATUM</span>
          </div>
        </div>

        {/* Hover / Info Banner Under Map */}
        <div className="hidden">
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
