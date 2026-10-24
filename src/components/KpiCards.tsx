"use client";

import React from "react";
import CountUp from "react-countup";
import { SiteAnalysisResult } from "@/lib/types";
import { BatteryCharging, Eye, Radio, Sparkles, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface KpiCardsProps {
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

function ConcentricRadialGauge({
  valA,
  valB,
  colorA,
  colorB,
  glowColor,
}: {
  valA: number;
  valB: number;
  colorA: string;
  colorB: string;
  glowColor: string;
}) {
  const rA = 34;
  const circA = 2 * Math.PI * rA;
  const offsetA = circA - (Math.min(100, Math.max(0, valA)) / 100) * circA;

  const rB = 25;
  const circB = 2 * Math.PI * rB;
  const offsetB = circB - (Math.min(100, Math.max(0, valB)) / 100) * circB;

  return (
    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 select-none" viewBox="0 0 88 88">
        {/* Background track rings */}
        <circle cx="44" cy="44" r={rA} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
        <circle cx="44" cy="44" r={rB} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4.5" />

        {/* Site B inner arc */}
        <circle
          cx="44"
          cy="44"
          r={rB}
          fill="none"
          stroke={colorB}
          strokeWidth="4.5"
          strokeDasharray={circB}
          strokeDashoffset={offsetB}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out opacity-60"
        />

        {/* Site A outer arc with drop glow */}
        <circle
          cx="44"
          cy="44"
          r={rA}
          fill="none"
          stroke={colorA}
          strokeWidth="5.5"
          strokeDasharray={circA}
          strokeDashoffset={offsetA}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-mono font-bold text-white tracking-tight">
          <CountUp end={valA} duration={1.2} decimals={0} suffix="%" />
        </span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400">Target</span>
      </div>
    </div>
  );
}

export function KpiCards({ siteA, siteB }: KpiCardsProps) {
  const solarDelta = Math.round((siteA.sunVisiblePct - siteB.sunVisiblePct) * 10) / 10;
  const earthDelta = Math.round((siteA.earthVisiblePct - siteB.earthVisiblePct) * 10) / 10;
  const dualDelta = Math.round((siteA.dualVisiblePct - siteB.dualVisiblePct) * 10) / 10;

  return (
    <div className="space-y-4">
      {/* Primary KPI Grid: Bento Box 3 Concentric Arc Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: SUN VISIBLE % */}
        <div
          onMouseEnter={() => soundEngine?.playDataTick()}
          className="bento-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 group"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <span className="flex items-center gap-2 text-[10px] font-mono tracking-widest-xl text-amber-400 font-semibold uppercase">
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              Sunlight Availability
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
              Solar Power
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ConcentricRadialGauge
              valA={siteA.sunVisiblePct}
              valB={siteB.sunVisiblePct}
              colorA="#f59e0b"
              colorB="#38bdf8"
              glowColor="rgba(245,158,11,0.7)"
            />

            <div className="flex-1 space-y-2.5">
              <div className="p-2.5 rounded-2xl bg-black/40 border border-amber-500/25 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SITE A (TARGET)
                  </div>
                  <div className="text-3xl font-light font-display text-white drop-shadow-[0_0_12px_rgba(245,158,11,0.45)] mt-0.5">
                    <CountUp end={siteA.sunVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-200">{siteA.sunVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteA.totalHours}h</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/30 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> SITE B (REF)
                  </div>
                  <div className="text-2xl font-light font-display text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] mt-0.5">
                    <CountUp end={siteB.sunVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-300">{siteB.sunVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteB.totalHours}h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Advantage Indicator */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[10px] tracking-widest uppercase">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 text-xs ${
                solarDelta > 0
                  ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                  : solarDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {solarDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{solarDelta}% Site A Lead
                </>
              ) : solarDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {solarDelta}% Site B Lead
                </>
              ) : (
                "Equal Sunlight"
              )}
            </span>
          </div>
        </div>

        {/* Metric 2: EARTH VISIBLE % */}
        <div
          onMouseEnter={() => soundEngine?.playDataTick()}
          className="bento-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 group"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <span className="flex items-center gap-2 text-[10px] font-mono tracking-widest-xl text-cyan-400 font-semibold uppercase">
              <Radio className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
              Direct-To-Earth LoS
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Comms Link
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ConcentricRadialGauge
              valA={siteA.earthVisiblePct}
              valB={siteB.earthVisiblePct}
              colorA="#00f0ff"
              colorB="#94a3b8"
              glowColor="rgba(0,240,255,0.7)"
            />

            <div className="flex-1 space-y-2.5">
              <div className="p-2.5 rounded-2xl bg-black/40 border border-cyan-500/25 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> SITE A (TARGET)
                  </div>
                  <div className="text-3xl font-light font-display text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.45)] mt-0.5">
                    <CountUp end={siteA.earthVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-200">{siteA.earthVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteA.totalHours}h</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/30 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> SITE B (REF)
                  </div>
                  <div className="text-2xl font-light font-display text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] mt-0.5">
                    <CountUp end={siteB.earthVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-300">{siteB.earthVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteB.totalHours}h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Advantage Indicator */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[10px] tracking-widest uppercase">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 text-xs ${
                earthDelta > 0
                  ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                  : earthDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {earthDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{earthDelta}% Site A Lead
                </>
              ) : earthDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {earthDelta}% Site B Lead
                </>
              ) : (
                "Equal Comms"
              )}
            </span>
          </div>
        </div>

        {/* Metric 3: DUAL WINDOW % */}
        <div
          onMouseEnter={() => soundEngine?.playDataTick()}
          className="bento-card rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 group"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <span className="flex items-center gap-2 text-[10px] font-mono tracking-widest-xl text-emerald-400 font-semibold uppercase">
              <Sparkles className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              Combined Dual Window
            </span>
            <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Power + Comms
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ConcentricRadialGauge
              valA={siteA.dualVisiblePct}
              valB={siteB.dualVisiblePct}
              colorA="#10b981"
              colorB="#38bdf8"
              glowColor="rgba(16,185,129,0.7)"
            />

            <div className="flex-1 space-y-2.5">
              <div className="p-2.5 rounded-2xl bg-black/40 border border-emerald-500/25 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> SITE A (TARGET)
                  </div>
                  <div className="text-3xl font-light font-display text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.45)] mt-0.5">
                    <CountUp end={siteA.dualVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-200">{siteA.dualVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteA.totalHours}h</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/30 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> SITE B (REF)
                  </div>
                  <div className="text-2xl font-light font-display text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] mt-0.5">
                    <CountUp end={siteB.dualVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400">
                  <div className="font-semibold text-slate-300">{siteB.dualVisibleHours}h</div>
                  <div className="text-[9px] text-slate-500">of {siteB.totalHours}h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Advantage Indicator */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[10px] tracking-widest uppercase">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 text-xs ${
                dualDelta > 0
                  ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                  : dualDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {dualDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{dualDelta}% Dual Lead
                </>
              ) : dualDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {dualDelta}% Site B Lead
                </>
              ) : (
                "Equal Overlap"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bento Bar: Battery Sizing & Elevation Angles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Site A Max Continuous Darkness */}
        <div className="bento-card rounded-2xl p-4 transition-all duration-300 hover:border-rose-500/30">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 mb-1.5 font-semibold">
            <BatteryCharging className="w-3.5 h-3.5 text-rose-400" />
            Site A Max Darkness
          </div>
          <div className="text-3xl font-light font-display text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <CountUp end={siteA.maxContinuousDarknessHours} duration={1} suffix="h" preserveValue />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Longest unbroken terrain shadow (battery constraint)
          </p>
        </div>

        {/* Site B Max Continuous Darkness */}
        <div className="bento-card rounded-2xl p-4 transition-all duration-300 hover:border-rose-500/30">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 mb-1.5 font-semibold">
            <BatteryCharging className="w-3.5 h-3.5 text-rose-400" />
            Site B Max Darkness
          </div>
          <div className="text-3xl font-light font-display text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <CountUp end={siteB.maxContinuousDarknessHours} duration={1} suffix="h" preserveValue />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Longest unbroken terrain shadow (battery constraint)
          </p>
        </div>

        {/* Site A Avg Elevations */}
        <div className="bento-card rounded-2xl p-4 transition-all duration-300 hover:border-amber-500/30">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 mb-1.5 font-semibold">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            Site A Mean Angles
          </div>
          <div className="text-sm font-mono text-slate-200 mt-1">
            Sun: <span className="text-amber-400 font-bold text-base">{siteA.avgSunElevation}°</span> | Earth:{" "}
            <span className="text-cyan-400 font-bold text-base">{siteA.avgEarthElevation}°</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Average elevation above local horizon when in view
          </p>
        </div>

        {/* Site B Avg Elevations */}
        <div className="bento-card rounded-2xl p-4 transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest-xl uppercase text-slate-400 mb-1.5 font-semibold">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Site B Mean Angles
          </div>
          <div className="text-sm font-mono text-slate-200 mt-1">
            Sun: <span className="text-amber-400 font-bold text-base">{siteB.avgSunElevation}°</span> | Earth:{" "}
            <span className="text-cyan-400 font-bold text-base">{siteB.avgEarthElevation}°</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Average elevation above local horizon when in view
          </p>
        </div>
      </div>
    </div>
  );
}
