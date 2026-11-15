import { CandidateSite, ComparisonResponse, LunarEvaluationResult } from "./types";
import { analyzeSiteVisibility } from "./astronomical";
import { generateNarrativeSummary } from "./narrative";
import { CANDIDATE_SITES } from "./lola-terrain";

/** Resolves the public FastAPI URL, with a local development default. */
export function getBackendBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL
      ?.replace(/\/+$/, "") ?? ""
  );
}

/** Request the backend's JPL SPICE evaluation; calculate locally only on network errors. */
export async function evaluateLunarSite(
  latitude: number,
  longitude: number,
  timestamp?: string
): Promise<LunarEvaluationResult> {
  const baseUrl = getBackendBaseUrl();
  const isoTime = timestamp || new Date().toISOString();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/lunar-evaluation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, timestamp: isoTime }),
    });
  } catch (error) {
    console.warn(`[LunarOps API] Failed to reach backend at ${baseUrl}; using local geometric fallback.`, error);
    const nearestSite = CANDIDATE_SITES.reduce((nearest, site) =>
      Math.hypot(site.latitude - latitude, site.longitude - longitude) <
      Math.hypot(nearest.latitude - latitude, nearest.longitude - longitude) ? site : nearest
    );
    const site: CandidateSite = { ...nearestSite, id: "offline-coordinate", latitude, longitude };
    const anchor = new Date(isoTime);
    const fallback = analyzeSiteVisibility(
      site,
      new Date(anchor.getTime() - 15 * 86400000),
      new Date(anchor.getTime() + 15 * 86400000),
      6
    );
    const instant = fallback.telemetry.reduce((closest, sample) =>
      Math.abs(Date.parse(sample.timestamp) - anchor.getTime()) <
      Math.abs(Date.parse(closest.timestamp) - anchor.getTime()) ? sample : closest
    );
    const sunlight = fallback.sunVisiblePct;
    const earth = fallback.earthVisiblePct;
    const score = Math.round((0.6 * sunlight + 0.4 * earth) * 10) / 10;

    return {
      sunlight_percentage: sunlight,
      earth_los_percentage: earth,
      mission_viability_score: score,
      recommendation_text: `[Offline geometric fallback] ${site.name}: ${sunlight}% sunlight and ${earth}% Earth visibility over 30 days. Viability score: ${score}/100.`,
      instant_sun_elevation_deg: instant.sunElevation,
      instant_earth_elevation_deg: instant.earthElevation,
      is_sun_visible_now: instant.isSunVisible,
      is_earth_visible_now: instant.isEarthVisible,
      site_elevation_km: site.elevationKm,
      evaluation_window_days: 30,
      engine: "offline-geometric-fallback",
      computed_at: new Date().toISOString(),
    };
  }

  if (!response.ok) throw new Error(`Lunar evaluation API returned HTTP ${response.status}`);
  return (await response.json()) as LunarEvaluationResult;
}

/** Request comparison telemetry from FastAPI; use local geometry only if unreachable. */
export async function fetchComparison(
  siteA: CandidateSite,
  siteB: CandidateSite,
  startDateStr: string,
  endDateStr: string,
  stepHours: number
): Promise<ComparisonResponse> {
  const baseUrl = getBackendBaseUrl();
  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T23:59:59Z`);
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteAId: siteA.id,
        siteBId: siteB.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        stepHours,
      }),
    });
  } catch (error) {
    console.warn(`[LunarOps API] FastAPI compare unreachable; using local geometric fallback.`, error);
    const siteAResult = analyzeSiteVisibility(siteA, start, end, stepHours);
    const siteBResult = analyzeSiteVisibility(siteB, start, end, stepHours);
    return {
      siteA: siteAResult,
      siteB: siteBResult,
      dateRange: { start: start.toISOString(), end: end.toISOString(), stepHours },
      generatedAt: new Date().toISOString(),
      summaryNarrative: generateNarrativeSummary(siteAResult, siteBResult, startDateStr, endDateStr),
      engine: "typescript-client",
    };
  }

  if (!response.ok) throw new Error(`Comparison API returned HTTP ${response.status}`);
  return (await response.json()) as ComparisonResponse;
}
