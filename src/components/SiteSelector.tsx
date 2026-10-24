"use client";

import React from "react";
import { CandidateSite } from "@/lib/types";
import { ArrowLeftRight, Check, Compass, MapPin, Mountain } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

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
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-amber-400/90 font-semibold">
              LUNAR_RECONNAISSANCE // 10_CANDIDATE_SITES
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              Candidate Landing-Site Selector
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare 2 documented lunar landing sites side-by-side for sunlight availability & direct-to-Earth LoS.
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine?.playClick();
            onSwapSites();
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
          title="Swap Site A and Site B"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          <span>Swap A ⇄ B</span>
        </button>
      </div>

      {/* Active Selection Slots Bar (Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Slot A */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl bg-amber-500 text-space-950 font-mono font-bold text-[10px] uppercase tracking-widest shadow-sm">
            TARGET SITE A
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 font-display font-bold text-base shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              A
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest-xl uppercase text-amber-400 font-semibold block mb-0.5">
                PRIMARY LANDING TARGET
              </span>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">{selectedSiteA.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-mono text-slate-400">
                <span className="text-amber-400 font-semibold">{selectedSiteA.coordinatesDisplay}</span>
                <span>•</span>
                <span className="text-slate-300">Elev: +{selectedSiteA.elevationKm} km</span>
                <span>•</span>
                <span className="text-cyan-300">{selectedSiteA.targetMission}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slot B */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/50 shadow-[0_0_24px_rgba(0,240,255,0.15)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl bg-cyan-400 text-space-950 font-mono font-bold text-[10px] uppercase tracking-widest shadow-sm">
            BENCHMARK SITE B
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 font-display font-bold text-base shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              B
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest-xl uppercase text-cyan-400 font-semibold block mb-0.5">
                BENCHMARK REFERENCE
              </span>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">{selectedSiteB.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">{selectedSiteB.coordinatesDisplay}</span>
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

      {/* Candidate Sites Quick Grid (Bento Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {sites.map((site) => {
          const isA = selectedSiteA.id === site.id;
          const isB = selectedSiteB.id === site.id;

          return (
            <div
              key={site.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between backdrop-blur-xl ${
                isA
                  ? "bg-amber-950/30 border-amber-500/80 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                  : isB
                  ? "bg-cyan-950/30 border-cyan-400/80 shadow-[0_0_16px_rgba(0,240,255,0.25)]"
                  : "bg-black/40 border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                    {site.category}
                  </span>
                  {isA && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-space-950 shadow-sm">
                      SLOT A
                    </span>
                  )}
                  {isB && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-space-950 shadow-sm">
                      SLOT B
                    </span>
                  )}
                </div>

                <h4 className="font-display font-semibold text-white text-xs leading-snug line-clamp-1">
                  {site.name}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  {site.coordinatesDisplay}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                  {site.targetMission}
                </p>
              </div>

              {/* Set Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    soundEngine?.playBeaconSelect();
                    onSelectSiteA(site);
                  }}
                  disabled={isA}
                  className={`text-[10px] font-mono py-1 rounded-xl transition-all text-center ${
                    isA
                      ? "bg-amber-500/20 text-amber-300 font-bold cursor-default"
                      : "bg-white/[0.05] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 active:scale-95"
                  }`}
                >
                  Set as A
                </button>
                <button
                  onClick={() => {
                    soundEngine?.playBeaconSelect();
                    onSelectSiteB(site);
                  }}
                  disabled={isB}
                  className={`text-[10px] font-mono py-1 rounded-xl transition-all text-center ${
                    isB
                      ? "bg-cyan-500/20 text-cyan-300 font-bold cursor-default"
                      : "bg-white/[0.05] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 active:scale-95"
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
