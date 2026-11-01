import { NarrativeSummary, SiteAnalysisResult } from "./types";

export function generateNarrativeSummary(
  siteA: SiteAnalysisResult,
  siteB: SiteAnalysisResult,
  startStr: string,
  endStr: string
): NarrativeSummary {
  const solarDiff = Math.round((siteA.sunVisiblePct - siteB.sunVisiblePct) * 10) / 10;
  const earthDiff = Math.round((siteA.earthVisiblePct - siteB.earthVisiblePct) * 10) / 10;
  const dualDiff = Math.round((siteA.dualVisiblePct - siteB.dualVisiblePct) * 10) / 10;

  const solarLeader =
    solarDiff > 0
      ? `${siteA.site.name} (+${solarDiff}%)`
      : solarDiff < 0
      ? `${siteB.site.name} (+${Math.abs(solarDiff)}%)`
      : "Identical solar availability";

  const dteLeader =
    earthDiff > 0
      ? `${siteA.site.name} (+${earthDiff}%)`
      : earthDiff < 0
      ? `${siteB.site.name} (+${Math.abs(earthDiff)}%)`
      : "Identical DTE link duration";

  let headline = "";
  if (solarDiff > 5 && earthDiff < -5) {
    headline = `Classic Polar Trade-Off: ${siteA.site.name} wins on Sunlight, while ${siteB.site.name} wins on Earth Communication.`;
  } else if (solarDiff < -5 && earthDiff > 5) {
    headline = `Classic Polar Trade-Off: ${siteB.site.name} wins on Sunlight, while ${siteA.site.name} wins on Earth Communication.`;
  } else if (dualDiff > 5) {
    headline = `${siteA.site.name} dominates combined dual-window operations (+${dualDiff}% window overlap).`;
  } else if (dualDiff < -5) {
    headline = `${siteB.site.name} dominates combined dual-window operations (+${Math.abs(dualDiff)}% window overlap).`;
  } else {
    headline = `Balanced operational profiles between ${siteA.site.name} and ${siteB.site.name}.`;
  }

  // Overview paragraph
  const overview = `Between ${startStr} and ${endStr} (UTC), ${
    solarDiff >= 0
      ? `${siteA.site.name} offers +${solarDiff}% more sunlight than ${siteB.site.name} (${siteA.sunVisiblePct}% vs. ${siteB.sunVisiblePct}%)`
      : `${siteB.site.name} offers +${Math.abs(solarDiff)}% more sunlight than ${siteA.site.name} (${siteB.sunVisiblePct}% vs. ${siteA.sunVisiblePct}%)`
  }. Conversely, ${
    earthDiff >= 0
      ? `${siteA.site.name} provides +${earthDiff}% better Direct-to-Earth communication visibility (${siteA.earthVisiblePct}% vs. ${siteB.earthVisiblePct}%)`
      : `${siteB.site.name} provides +${Math.abs(earthDiff)}% better Direct-to-Earth communication visibility (${siteB.earthVisiblePct}% vs. ${siteA.earthVisiblePct}%)`
  }. When evaluating combined mission operations (both Sun power and Earth link concurrently), ${
    dualDiff >= 0
      ? `${siteA.site.name} leads with ${siteA.dualVisiblePct}% dual window coverage compared to ${siteB.dualVisiblePct}% at ${siteB.site.name}`
      : `${siteB.site.name} leads with ${siteB.dualVisiblePct}% dual window coverage compared to ${siteA.dualVisiblePct}% at ${siteA.site.name}`
  }.`;

  // Mission Planners technical note
  const plannersNote = `Battery Sizing & Comms Margin Analysis:
• Darkness Endurance: ${siteA.site.name} requires surviving a maximum continuous shadow duration of ${siteA.maxContinuousDarknessHours}h, whereas ${siteB.site.name} requires ${siteB.maxContinuousDarknessHours}h. Shorter darkness blocks reduce secondary battery mass and thermal heater load.
• Antenna Tracking: Average Earth elevation at ${siteA.site.name} is ${siteA.avgEarthElevation}° compared to ${siteB.avgEarthElevation}° at ${siteB.site.name}. Sites with average Earth elevation < 3.0° face severe multipath fade and terrain clipping when lunar libration dips Earth toward local crater rims.
• High-Gain Relay Requirement: If choosing ${siteA.earthVisiblePct < 85 ? siteA.site.name : siteB.site.name}, consider budgeting a dedicated orbital relay (e.g. Lunar Gateway or CLPS comms satellite) to bridge line-of-sight gaps.`;

  // Educators explanation
  const educatorsNote = `Why do lunar landing sites behave so differently?
• The Moon's tiny tilt: Because the Moon's axis is tilted only 1.54° relative to the Sun, polar mountains and crater rims skim sunlight like mountaintops on Earth at sunrise. High ridges enjoy near-permanent daylight ("peaks of eternal light"), while crater bottoms are plunged into billions of years of pitch black darkness.
• Earth Libration: Because the Moon's orbit is an ellipse, the Moon wobbles from our viewpoint on Earth by up to ±7.9° east-west and ±6.7° north-south. For someone standing at the South Pole, Earth does not rise and set every 24 hours—it slowly bobs up and down like a beacon on an ocean wave over a 27.3-day monthly cycle!`;

  // Students note
  const studentsNote = `Quick Lunar Facts for Future Astronauts:
🚀 If your lander lands at ${siteA.site.name}, the Sun will look like a golden ring rolling along the razor-sharp jagged edge of the crater mountains!
🛰️ If your radio antenna points at Earth from ${siteB.site.name}, Earth will hang in the sky like a big, beautiful bright blue marble that never moves far away!
🔋 To keep your robot rover alive through cold lunar nights, you must design batteries that can stay awake for at least ${Math.max(siteA.maxContinuousDarknessHours, siteB.maxContinuousDarknessHours)} hours in the dark!`;

  return {
    overview,
    headline,
    solarWinner: solarLeader,
    dteWinner: dteLeader,
    plannersNote,
    educatorsNote,
    studentsNote,
  };
}
