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

export function KpiCards({ siteA, siteB }: KpiCardsProps) {
  const solarDelta = Math.round((siteA.sunVisiblePct - siteB.sunVisiblePct) * 10) / 10;
  const earthDelta = Math.round((siteA.earthVisiblePct - siteB.earthVisiblePct) * 10) / 10;
  const dualDelta = Math.round((siteA.dualVisiblePct - siteB.dualVisiblePct) * 10) / 10;

  return (
    <div className="space-y-4">
      {/* Primary KPI Grid: Side-by-Side 3 Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: SUN VISIBLE % */}
        <div
          onMouseEnter={() => soundEngine?.playDataTick()}
          className="glass-panel rounded-xl p-4 shadow-telemetry-card relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold tracking-wider">
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              SUNLIGHT AVAILABILITY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              SOLAR POWER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Site A */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-amber-500/30">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE A</span>
                <span className="text-amber-400 font-bold">TARGET</span>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                <CountUp end={siteA.sunVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteA.sunVisibleHours}h / {siteA.totalHours}h
              </div>
            </div>

            {/* Site B */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE B</span>
                <span className="text-sky-400 font-bold">REF</span>
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1">
                <CountUp end={siteB.sunVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteB.sunVisibleHours}h / {siteB.totalHours}h
              </div>
            </div>
          </div>

          {/* Delta Indicator */}
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                solarDelta > 0
                  ? "text-emerald-400"
                  : solarDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {solarDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{solarDelta}% Site A Advantage
                </>
              ) : solarDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {solarDelta}% Site B Advantage
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
          className="glass-panel rounded-xl p-4 shadow-telemetry-card relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/40"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-mono text-sky-400 font-semibold tracking-wider">
              <Radio className="w-4 h-4 text-sky-400" />
              DIRECT-TO-EARTH (DTE) LoS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
              COMMS LINK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Site A */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-sky-500/30">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE A</span>
                <span className="text-amber-400 font-bold">TARGET</span>
              </div>
              <div className="text-2xl font-mono font-bold text-sky-400 mt-1">
                <CountUp end={siteA.earthVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteA.earthVisibleHours}h / {siteA.totalHours}h
              </div>
            </div>

            {/* Site B */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE B</span>
                <span className="text-sky-400 font-bold">REF</span>
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1">
                <CountUp end={siteB.earthVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteB.earthVisibleHours}h / {siteB.totalHours}h
              </div>
            </div>
          </div>

          {/* Delta Indicator */}
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                earthDelta > 0
                  ? "text-emerald-400"
                  : earthDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {earthDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{earthDelta}% Site A Advantage
                </>
              ) : earthDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {earthDelta}% Site B Advantage
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
          className="glass-panel rounded-xl p-4 shadow-telemetry-card relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              COMBINED DUAL WINDOW
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              POWER + COMMS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Site A */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-emerald-500/30">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE A</span>
                <span className="text-amber-400 font-bold">TARGET</span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                <CountUp end={siteA.dualVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteA.dualVisibleHours}h / {siteA.totalHours}h
              </div>
            </div>

            {/* Site B */}
            <div className="p-2.5 rounded-lg bg-space-950/70 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SITE B</span>
                <span className="text-sky-400 font-bold">REF</span>
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1">
                <CountUp end={siteB.dualVisiblePct} duration={1.2} decimals={1} suffix="%" preserveValue />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {siteB.dualVisibleHours}h / {siteB.totalHours}h
              </div>
            </div>
          </div>

          {/* Delta Indicator */}
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Delta (A − B):</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                dualDelta > 0
                  ? "text-emerald-400"
                  : dualDelta < 0
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {dualDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" /> +{dualDelta}% Dual Advantage
                </>
              ) : dualDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" /> {dualDelta}% Site B Advantage
                </>
              ) : (
                "Equal Overlap"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar: Battery Sizing & Elevation Angles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Site A Max Continuous Darkness */}
        <div className="glass-panel rounded-xl p-3 border border-rose-500/20 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
            <BatteryCharging className="w-3.5 h-3.5 text-rose-400" />
            SITE A MAX DARKNESS
          </div>
          <div className="text-xl font-mono font-bold text-rose-400">
            <CountUp end={siteA.maxContinuousDarknessHours} duration={1} suffix="h" preserveValue />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Longest unbroken terrain shadow (battery sizing constraint)
          </p>
        </div>

        {/* Site B Max Continuous Darkness */}
        <div className="glass-panel rounded-xl p-3 border border-rose-500/20 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
            <BatteryCharging className="w-3.5 h-3.5 text-rose-400" />
            SITE B MAX DARKNESS
          </div>
          <div className="text-xl font-mono font-bold text-rose-400">
            <CountUp end={siteB.maxContinuousDarknessHours} duration={1} suffix="h" preserveValue />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Longest unbroken terrain shadow (battery sizing constraint)
          </p>
        </div>

        {/* Site A Avg Elevations */}
        <div className="glass-panel rounded-xl p-3 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            SITE A ANGLES
          </div>
          <div className="text-sm font-mono text-slate-200">
            Sun: <span className="text-amber-400 font-bold">{siteA.avgSunElevation}°</span> | Earth:{" "}
            <span className="text-sky-400 font-bold">{siteA.avgEarthElevation}°</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Average elevation above local horizon when in view
          </p>
        </div>

        {/* Site B Avg Elevations */}
        <div className="glass-panel rounded-xl p-3 border border-sky-500/20 hover:border-sky-500/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            SITE B ANGLES
          </div>
          <div className="text-sm font-mono text-slate-200">
            Sun: <span className="text-amber-400 font-bold">{siteB.avgSunElevation}°</span> | Earth:{" "}
            <span className="text-sky-400 font-bold">{siteB.avgEarthElevation}°</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Average elevation above local horizon when in view
          </p>
        </div>
      </div>
    </div>
  );
}
