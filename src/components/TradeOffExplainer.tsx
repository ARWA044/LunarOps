"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NarrativeSummary, SiteAnalysisResult } from "@/lib/types";
import { BookOpen, GraduationCap, Lightbulb, Rocket, ShieldCheck, Trophy } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface TradeOffExplainerProps {
  summary: NarrativeSummary;
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
}

export function TradeOffExplainer({ summary, siteA, siteB }: TradeOffExplainerProps) {
  const [activeAudience, setActiveAudience] = useState<"planners" | "educators" | "students">("planners");

  const tabs = [
    { id: "planners" as const, label: "Mission Planners", icon: Rocket, color: "text-amber-400" },
    { id: "educators" as const, label: "Educators", icon: BookOpen, color: "text-cyan-400" },
    { id: "students" as const, label: "Students", icon: GraduationCap, color: "text-emerald-400" },
  ];

  return (
    <div className="bento-card rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-bento">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.06] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-emerald-400/90 font-semibold">
              &gt; LUNAR_TELEMETRY_SYNTHESIS.SH // AUDIENCE_LENS
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              Plain-Language Results & Trade-Off Explainer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated comparative synthesis and tailored audience insights for mission planning, education, and outreach.
          </p>
        </div>

        {/* Sliding Segment Control (Apple / Riy3 style Framer Motion) */}
        <div className="flex items-center bg-black/60 rounded-full p-1 border border-white/10 text-xs font-mono relative shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAudience === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine?.playClick();
                  setActiveAudience(tab.id);
                }}
                className={`relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-mono transition-colors z-10 ${
                  isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAudienceTab"
                    className="absolute inset-0 bg-white/15 border border-white/20 rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-20 ${tab.color}`} />
                <span className="relative z-20">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Headline & Synthesis Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-amber-500/25 mb-4 shadow-lg backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-amber-400 font-semibold block mb-0.5">
              PRIMARY MISSION FINDING
            </span>
            <h3 className="text-base sm:text-lg font-display font-bold text-amber-200 leading-snug">
              {summary.headline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {summary.overview}
              <span className="inline-block w-2 h-3.5 bg-cyan-400 cursor-blink ml-1.5 align-middle shadow-[0_0_8px_#00f0ff]" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/25 shadow-inner">
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" /> SOLAR ILLUMINATION LEADER
            </span>
            <div className="text-white mt-1 font-display font-semibold text-sm sm:text-base">
              {summary.solarWinner}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/25 shadow-inner">
            <span className="text-[10px] font-mono tracking-widest-xl uppercase text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" /> DIRECT-TO-EARTH COMMS LEADER
            </span>
            <div className="text-white mt-1 font-display font-semibold text-sm sm:text-base">
              {summary.dteWinner}
            </div>
          </div>
        </div>
      </div>

      {/* Audience Lens Content with Smooth Crossfade */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 border border-white/[0.06] backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {activeAudience === "planners" && (
            <motion.div
              key="planners"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <Rocket className="w-4 h-4 text-amber-400" />
                <span>Technical Telemetry & Engineering Margin Analysis</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/60 p-4 rounded-xl border border-white/[0.06] shadow-inner">
                {summary.plannersNote}
              </pre>
            </motion.div>
          )}

          {activeAudience === "educators" && (
            <motion.div
              key="educators"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Classroom & Science Explainer: The Physics of Lunar Polar Windows</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/60 p-4 rounded-xl border border-white/[0.06] shadow-inner">
                {summary.educatorsNote}
              </pre>
            </motion.div>
          )}

          {activeAudience === "students" && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Mission Commander Briefing: Fun Facts for Aspiring Astronauts</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/60 p-4 rounded-xl border border-white/[0.06] shadow-inner">
                {summary.studentsNote}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
