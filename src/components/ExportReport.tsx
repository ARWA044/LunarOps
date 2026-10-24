"use client";

import React, { useState } from "react";
import { ComparisonResponse } from "@/lib/types";
import { Check, Download, FileSpreadsheet, FileText, Share2 } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

interface ExportReportProps {
  data: ComparisonResponse;
}

export function ExportReport({ data }: ExportReportProps) {
  const [copied, setCopied] = useState(false);

  const downloadJson = () => {
    soundEngine?.playClick();
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute(
      "download",
      `lunarops-${data.siteA.site.code}-vs-${data.siteB.site.code}-${data.dateRange.start.slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCsv = () => {
    soundEngine?.playClick();
    const headers = [
      "Timestamp_UTC",
      "Epoch_Hours",
      "SiteA_Sun_Az_deg",
      "SiteA_Sun_Elev_deg",
      "SiteA_Sun_Obstruction_deg",
      "SiteA_Sun_Visible",
      "SiteA_Earth_Elev_deg",
      "SiteA_Earth_Obstruction_deg",
      "SiteA_Earth_Visible",
      "SiteA_Dual_Window",
      "SiteB_Sun_Elev_deg",
      "SiteB_Sun_Obstruction_deg",
      "SiteB_Sun_Visible",
      "SiteB_Earth_Elev_deg",
      "SiteB_Earth_Obstruction_deg",
      "SiteB_Earth_Visible",
      "SiteB_Dual_Window",
    ];

    const rows = data.siteA.telemetry.map((tA, i) => {
      const tB = data.siteB.telemetry[i] || tA;
      return [
        tA.timestamp,
        tA.epochHour,
        tA.sunAzimuth,
        tA.sunElevation,
        tA.sunTerrainObstruction,
        tA.isSunVisible ? 1 : 0,
        tA.earthElevation,
        tA.earthTerrainObstruction,
        tA.isEarthVisible ? 1 : 0,
        tA.isDualWindow ? 1 : 0,
        tB.sunElevation,
        tB.sunTerrainObstruction,
        tB.isSunVisible ? 1 : 0,
        tB.earthElevation,
        tB.earthTerrainObstruction,
        tB.isEarthVisible ? 1 : 0,
        tB.isDualWindow ? 1 : 0,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(","), ...rows].join("\n"));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute(
      "download",
      `lunarops-telemetry-${data.siteA.site.code}-vs-${data.siteB.site.code}.csv`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copySummary = () => {
    const text = `LUNAROPS MISSION COMPARISON SUMMARY:
${data.siteA.site.name} vs. ${data.siteB.site.name}
Range: ${data.dateRange.start} to ${data.dateRange.end}
${data.summaryNarrative.headline}

${data.summaryNarrative.overview}

Site A (${data.siteA.site.name}):
- Sunlight Availability: ${data.siteA.sunVisiblePct}% (${data.siteA.sunVisibleHours}h)
- Earth Direct LoS: ${data.siteA.earthVisiblePct}% (${data.siteA.earthVisibleHours}h)
- Dual Combined Window: ${data.siteA.dualVisiblePct}% (${data.siteA.dualVisibleHours}h)
- Max Continuous Shadow: ${data.siteA.maxContinuousDarknessHours}h

Site B (${data.siteB.site.name}):
- Sunlight Availability: ${data.siteB.sunVisiblePct}% (${data.siteB.sunVisibleHours}h)
- Earth Direct LoS: ${data.siteB.earthVisiblePct}% (${data.siteB.earthVisibleHours}h)
- Dual Combined Window: ${data.siteB.dualVisiblePct}% (${data.siteB.dualVisibleHours}h)
- Max Continuous Shadow: ${data.siteB.maxContinuousDarknessHours}h
`;
    soundEngine?.playClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-space-850 border border-space-700/80 shadow-telemetry-card">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
        <Download className="w-4 h-4 text-amber-400" />
        <span>Export Mission Datasets & Reports:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <button
          onClick={downloadJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-space-700 text-slate-300 hover:text-white transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          JSON Telemetry
        </button>

        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-space-700 text-slate-300 hover:text-white transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          CSV Ephemeris Table
        </button>

        <button
          onClick={copySummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-space-700 text-slate-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Copy Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
