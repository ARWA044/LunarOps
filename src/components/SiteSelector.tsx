"use client";

import React from "react";
import { CandidateSite } from "@/lib/types";
import { ArrowLeftRight, Check, Compass, MapPin, Mountain } from "lucide-react";

interface SiteSelectorProps {
  sites: CandidateSite[];
  selectedSiteA: CandidateSite;
  selectedSiteB: CandidateSite;
  onSelectSiteA: (site: CandidateSite) => void;
  onSelectSiteB: (site: CandidateSite) => void;
  onSwapSites: () => void;
}

export function SiteSelector({
  sites,
  selectedSiteA,
  selectedSiteB,
  onSelectSiteA,
  onSelectSiteB,
  onSwapSites,
}: SiteSelectorProps) {
  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-space-700/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Candidate Landing-Site Selector
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare 2 documented lunar landing sites side-by-side for sunlight availability & direct-to-Earth LoS.
          </p>
        </div>

        <button
          onClick={onSwapSites}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          title="Swap Site A and Site B"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          Swap A ⇄ B
        </button>
      </div>

      {/* Active Selection Slots Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Slot A */}
        <div className="p-3.5 rounded-lg bg-space-900 border-2 border-amber-500/50 shadow-solar-glow/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl bg-amber-500 text-space-950 font-mono font-bold text-xs uppercase tracking-wider">
            Site A (Target)
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 font-mono font-bold text-sm">
              A
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{selectedSiteA.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-slate-400">
                <span className="text-amber-400 font-semibold">{selectedSiteA.coordinatesDisplay}</span>
                <span>•</span>
                <span className="text-slate-300">Elev: +{selectedSiteA.elevationKm} km</span>
                <span>•</span>
                <span className="text-sky-300">{selectedSiteA.targetMission}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slot B */}
        <div className="p-3.5 rounded-lg bg-space-900 border-2 border-sky-500/50 shadow-earth-glow/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl bg-sky-500 text-space-950 font-mono font-bold text-xs uppercase tracking-wider">
            Site B (Benchmark)
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5 text-sky-400 font-mono font-bold text-sm">
              B
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{selectedSiteB.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-slate-400">
                <span className="text-sky-400 font-semibold">{selectedSiteB.coordinatesDisplay}</span>
                <span>•</span>
                <span className="text-slate-300">
                  Elev: {selectedSiteB.elevationKm >= 0 ? `+${selectedSiteB.elevationKm}` : selectedSiteB.elevationKm} km
                </span>
                <span>•</span>
                <span className="text-amber-300">{selectedSiteB.targetMission}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Sites Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {sites.map((site) => {
          const isA = selectedSiteA.id === site.id;
          const isB = selectedSiteB.id === site.id;

          return (
            <div
              key={site.id}
              className={`p-3 rounded-lg border transition-all text-left flex flex-col justify-between ${
                isA
                  ? "bg-amber-950/20 border-amber-500 shadow-sm shadow-amber-500/20"
                  : isB
                  ? "bg-sky-950/20 border-sky-500 shadow-sm shadow-sky-500/20"
                  : "bg-space-900/80 border-space-700/80 hover:border-space-600 hover:bg-space-800/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-slate-300 border border-space-700">
                    {site.category}
                  </span>
                  {isA && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-space-950">
                      SITE A
                    </span>
                  )}
                  {isB && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500 text-space-950">
                      SITE B
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-white text-xs leading-snug line-clamp-1">
                  {site.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  {site.coordinatesDisplay}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {site.targetMission}
                </p>
              </div>

              {/* Set Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-space-800/80">
                <button
                  onClick={() => onSelectSiteA(site)}
                  disabled={isA}
                  className={`text-[10px] font-mono py-1 rounded transition-colors text-center ${
                    isA
                      ? "bg-amber-500/20 text-amber-300 font-bold cursor-default"
                      : "bg-space-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-space-700 hover:border-amber-500/40"
                  }`}
                >
                  Set as A
                </button>
                <button
                  onClick={() => onSelectSiteB(site)}
                  disabled={isB}
                  className={`text-[10px] font-mono py-1 rounded transition-colors text-center ${
                    isB
                      ? "bg-sky-500/20 text-sky-300 font-bold cursor-default"
                      : "bg-space-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-space-700 hover:border-sky-500/40"
                  }`}
                >
                  Set as B
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
