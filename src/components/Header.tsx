"use client";

import React, { useEffect, useState } from "react";
import { Moon, Orbit, Radio, ShieldAlert, Sparkles, Satellite } from "lucide-react";

export function Header() {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-space-700/80 bg-space-950/90 backdrop-blur sticky top-0 z-50">
      {/* Top Telemetry Status Bar */}
      <div className="border-b border-space-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            TELEMETRY ACTIVE
          </span>
          <span className="text-space-600">|</span>
          <span className="hidden sm:inline text-slate-300">NASA Space Apps Challenge 2026</span>
          <span className="hidden md:inline text-space-600">|</span>
          <span className="hidden md:inline text-amber-400/90">CLPS Mission Browser</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300 bg-space-800/80 px-2 py-0.5 rounded border border-space-700">
            {utcTime || "SYNCING UTC CLOCK..."}
          </span>
          <span className="hidden lg:flex items-center gap-1 text-sky-400">
            <Satellite className="w-3.5 h-3.5" />
            LOLA DEM V4.2
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-sky-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center shadow-solar-glow">
            <Moon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                LunarOps
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-medium">
                  v2.6 POLAR
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              The Moon, made easier to explore — Sunlight & Direct-to-Earth (DTE) Visibility Browser
            </p>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            Sunlight Availability
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300">
            <Radio className="w-3 h-3 text-sky-400" />
            Earth LoS Window
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Dual Operational Window
          </div>
        </div>
      </div>

      {/* Prominent Scientific Disclaimer Banner */}
      <div className="bg-amber-950/30 border-y border-amber-500/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2.5 text-xs text-amber-200/90 font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="text-amber-300 font-semibold">SCIENTIFIC DISCLAIMER:</strong>{" "}
            Seeing the Sun does not directly calculate electrical power, and seeing Earth does not
            guarantee a successful radio connection. LunarOps measures potential illumination and
            line-of-sight windows above local LOLA lunar terrain.
          </p>
        </div>
      </div>
    </header>
  );
}
