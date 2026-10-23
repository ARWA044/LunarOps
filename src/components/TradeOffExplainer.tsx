"use client";

import React, { useState } from "react";
import { NarrativeSummary, SiteAnalysisResult } from "@/lib/types";
import { BookOpen, GraduationCap, Lightbulb, Rocket, ShieldCheck, Trophy } from "lucide-react";

interface TradeOffExplainerProps {
  summary: NarrativeSummary;
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

export function TradeOffExplainer({ summary, siteA, siteB }: TradeOffExplainerProps) {
  const [activeAudience, setActiveAudience] = useState<"planners" | "educators" | "students">("planners");

  return (
    <div className="bg-space-850 border border-space-700/80 rounded-xl p-4 sm:p-5 shadow-telemetry-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-space-700/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Plain-Language Results & Trade-Off Explainer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated comparative synthesis and tailored audience insights for mission planning, education, and outreach.
          </p>
        </div>

        {/* Audience Mode Switcher Tabs */}
        <div className="flex items-center bg-space-900 rounded-lg p-0.5 border border-space-700 text-xs font-mono">
          <button
            onClick={() => setActiveAudience("planners")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeAudience === "planners"
                ? "bg-amber-500 text-space-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            Mission Planners
          </button>
          <button
            onClick={() => setActiveAudience("educators")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeAudience === "educators"
                ? "bg-sky-500 text-space-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Educators
          </button>
          <button
            onClick={() => setActiveAudience("students")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeAudience === "students"
                ? "bg-emerald-500 text-space-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Students
          </button>
        </div>
      </div>

      {/* Main Headline & Synthesis Box */}
      <div className="p-4 rounded-xl bg-space-900/90 border border-amber-500/30 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-300 leading-snug">
              {summary.headline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {summary.overview}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-space-800 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-space-950 border border-amber-500/20">
            <span className="text-amber-400 font-bold">SOLAR LEADER:</span>
            <div className="text-slate-200 mt-0.5">{summary.solarWinner}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-space-950 border border-sky-500/20">
            <span className="text-sky-400 font-bold">DTE COMMS LEADER:</span>
            <div className="text-slate-200 mt-0.5">{summary.dteWinner}</div>
          </div>
        </div>
      </div>

      {/* Audience Lens Content */}
      <div className="p-4 rounded-xl bg-space-900/60 border border-space-700">
        {activeAudience === "planners" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-amber-400" />
              Technical Telemetry & Engineering Margin Analysis
            </div>
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-space-950 p-3.5 rounded-lg border border-space-800">
              {summary.plannersNote}
            </pre>
          </div>
        )}

        {activeAudience === "educators" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Classroom & Science Explainer: The Physics of Lunar Polar Windows
            </div>
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-space-950 p-3.5 rounded-lg border border-space-800">
              {summary.educatorsNote}
            </pre>
          </div>
        )}

        {activeAudience === "students" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Mission Commander Briefing: Fun Facts for Aspiring Astronauts
            </div>
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-space-950 p-3.5 rounded-lg border border-space-800">
              {summary.studentsNote}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
