"use client";

import React from "react";
import CountUp from "react-countup";
import { TimeStepTelemetry } from "@/lib/types";
import { soundEngine } from "@/lib/sound-engine";

interface KpiRingsProps {
  sunPct: number;
  earthPct: number;
  dualPct: number;
  siteLabel: string;
  siteColor: "amber" | "sky";
  currentStep?: TimeStepTelemetry | null;
}

function Arc({
  pct,
  radius,
  color,
  trackColor,
  strokeWidth = 5,
  cx = 50,
  cy = 50,
}: {
  pct: number;
  radius: number;
  color: string;
  trackColor: string;
  strokeWidth?: number;
  cx?: number;
  cy?: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const validPct = typeof pct === "number" && !isNaN(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  const dash = (validPct / 100) * circumference;
  const gap = circumference - dash;

  return (
    <>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </>
  );
}

export function KpiRings({ sunPct, earthPct, dualPct, siteLabel, siteColor, currentStep }: KpiRingsProps) {
  const borderColor = siteColor === "amber" ? "border-amber-500/40 hover:border-amber-500/70" : "border-sky-500/40 hover:border-sky-500/70";
  const labelColor = siteColor === "amber" ? "text-amber-400" : "text-sky-400";

  return (
    <div
      onMouseEnter={() => soundEngine?.playDataTick()}
      className={`glass-panel rounded-xl p-3 border ${borderColor} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]`}
    >
      <div className={`text-[10px] font-mono font-bold tracking-widest uppercase ${labelColor} mb-3 flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${siteColor === "amber" ? "bg-amber-400" : "bg-sky-400"} inline-block animate-pulse`}></span>
        {siteLabel}
      </div>

      {/* Three concentric ring gauge */}
      <div className="flex items-center justify-center">
        <div className="relative w-[100px] h-[100px]">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Outer: Sun */}
            <Arc pct={sunPct} radius={44} color="#f59e0b" trackColor="rgba(245,158,11,0.12)" strokeWidth={4} />
            {/* Middle: Earth */}
            <Arc pct={earthPct} radius={36} color="#38bdf8" trackColor="rgba(56,189,248,0.12)" strokeWidth={4} />
            {/* Inner: Dual */}
            <Arc pct={dualPct} radius={28} color="#10b981" trackColor="rgba(16,185,129,0.12)" strokeWidth={4} />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xs font-bold text-emerald-400">
              <CountUp end={dualPct} duration={1.2} decimals={1} suffix="%" preserveValue />
            </span>
            <span className="font-mono text-[9px] text-slate-500 tracking-wider">DUAL</span>
          </div>
        </div>
      </div>

      {/* Legend values */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 rounded"></span> SUN
          </span>
          <span className="text-white font-bold">
            <CountUp end={sunPct} duration={1.2} decimals={1} suffix="%" preserveValue />
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-0.5 bg-sky-400 rounded"></span> EARTH
          </span>
          <span className="text-white font-bold">
            <CountUp end={earthPct} duration={1.2} decimals={1} suffix="%" preserveValue />
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-0.5 bg-emerald-400 rounded"></span> DUAL
          </span>
          <span className="text-white font-bold">
            <CountUp end={dualPct} duration={1.2} decimals={1} suffix="%" preserveValue />
          </span>
        </div>
      </div>

      {/* Live status indicator */}
      {currentStep && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${currentStep.isSunVisible ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-500"}`}>
              {currentStep.isSunVisible ? "☀ SUN" : "☀ DARK"}
            </span>
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${currentStep.isEarthVisible ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-500"}`}>
              {currentStep.isEarthVisible ? "⊕ LINK" : "⊕ BLIND"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
