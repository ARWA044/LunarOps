import { CandidateSite, SiteAnalysisResult, TimeStepTelemetry } from "./types";
import { getHorizonObstruction } from "./lola-terrain";

// Julian date calculations
export function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

const J2000 = 2451545.0;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Calculates Moon-centric sub-solar latitude and longitude for a given Julian Date.
 * Lunar axial tilt relative to the ecliptic is 1.543°.
 * Southern summer solstice occurs when the Moon's South pole tilts maximum towards the Sun.
 */
export function getSubSolarPoint(jd: number): { lat: number; lon: number } {
  const d = jd - J2000;
  // Mean longitude of Sun from Earth (ecliptic)
  const L = (280.466 + 0.98564736 * d) % 360;
  // Mean anomaly of Sun
  const g = ((357.528 + 0.98560028 * d) % 360) * DEG2RAD;
  // Ecliptic longitude of Sun
  const lambdaSun = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);

  // Mean longitude of Moon
  const lMoon = (218.316 + 13.176396 * d) % 360;
  // Ascending node of Moon's orbit
  const omega = (125.045 - 0.0529538 * d) % 360;

  // Synodic phase angle (Moon-Sun)
  // Sub-solar longitude on the Moon decreases as Sun moves across the lunar sky (360° per 29.530589 days)
  const synodicPeriod = 29.530588853;
  const tPhase = (d / synodicPeriod) % 1;
  const lon = ((180 - tPhase * 360) % 360 + 360) % 360; // 0° to 360°

  // Sub-solar latitude: amplitude ~1.543° tilted relative to ecliptic
  // Southern summer occurs around Dec-Feb
  const dayOfYear = (d % 365.25 + 365.25) % 365.25;
  const lat = -1.543 * Math.cos(((dayOfYear - 10) / 365.25) * 2 * Math.PI);

  return { lat, lon };
}

/**
 * Calculates Moon-centric sub-Earth latitude and longitude (optical + physical libration).
 * The Mean Earth direction is (0° lat, 0° lon).
 * Libration in longitude reaches ~±7.9°, libration in latitude reaches ~±6.7°.
 */
export function getSubEarthPoint(jd: number): { lat: number; lon: number } {
  const d = jd - J2000;

  // Libration in longitude: dominated by anomalistic month (period ~27.55455 days)
  const anomalisticPeriod = 27.55454988;
  const lPhase = ((d / anomalisticPeriod) * 2 * Math.PI) % (2 * Math.PI);
  const lonLib = 7.9 * Math.sin(lPhase) + 1.25 * Math.sin(2 * lPhase);

  // Libration in latitude: dominated by draconic month (period ~27.21222 days)
  const draconicPeriod = 27.212220817;
  const bPhase = ((d / draconicPeriod) * 2 * Math.PI) % (2 * Math.PI);
  const latLib = 6.7 * Math.sin(bPhase) + 0.8 * Math.sin(2 * bPhase);

  return { lat: latLib, lon: lonLib };
}

/**
 * Converts Moon-centric sub-body coordinates to local topocentric Azimuth & Elevation
 * at site (siteLat, siteLon).
 * Elevation accounts for local curvature and site altitude dip.
 */
export function calculateLocalHorizonCoords(
  siteLatDeg: number,
  siteLonDeg: number,
  siteElevKm: number,
  bodyLatDeg: number,
  bodyLonDeg: number
): { azimuth: number; elevation: number } {
  const phi = siteLatDeg * DEG2RAD;
  const lambda = siteLonDeg * DEG2RAD;
  const delta = bodyLatDeg * DEG2RAD;
  const alpha = bodyLonDeg * DEG2RAD;

  const h = alpha - lambda; // Hour angle relative to site meridian

  // Altitude/Elevation above mathematical horizon
  const sinElev =
    Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h);
  let elevation = Math.asin(Math.max(-1, Math.min(1, sinElev))) * RAD2DEG;

  // Horizon dip bonus due to site elevation above mean lunar sphere (R = 1737.4 km)
  if (siteElevKm > 0) {
    const rMoon = 1737.4;
    const horizonDipDeg = Math.acos(rMoon / (rMoon + siteElevKm)) * RAD2DEG;
    elevation += horizonDipDeg * 0.45; // effective topographic horizon relief
  }

  // Azimuth measured from North (0°), East (90°), South (180°), West (270°)
  const y = Math.sin(h) * Math.cos(delta);
  const x =
    Math.cos(phi) * Math.sin(delta) - Math.sin(phi) * Math.cos(delta) * Math.cos(h);
  let azimuth = Math.atan2(y, x) * RAD2DEG;
  azimuth = (azimuth % 360 + 360) % 360;

  return {
    azimuth: Math.round(azimuth * 100) / 100,
    elevation: Math.round(elevation * 100) / 100,
  };
}

/**
 * Runs the complete time-series analysis for a given site over a UTC date range.
 */
export function analyzeSiteVisibility(
  site: CandidateSite,
  startDate: Date,
  endDate: Date,
  stepHours: number = 1
): SiteAnalysisResult {
  const telemetry: TimeStepTelemetry[] = [];
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const stepMs = Math.max(1, stepHours) * 3600 * 1000;

  let sunVisibleCount = 0;
  let earthVisibleCount = 0;
  let dualVisibleCount = 0;

  let currentDarknessRun = 0;
  let maxDarknessRun = 0;

  let totalSunElevWhenVisible = 0;
  let totalEarthElev = 0;

  let stepIndex = 0;
  for (let t = startMs; t <= endMs; t += stepMs) {
    const curDate = new Date(t);
    const jd = toJulianDate(curDate);

    // 1. Calculate Sun topocentric position
    const subSolar = getSubSolarPoint(jd);
    const sunCoords = calculateLocalHorizonCoords(
      site.latitude,
      site.longitude,
      site.elevationKm,
      subSolar.lat,
      subSolar.lon
    );
    const sunObstruction = getHorizonObstruction(site, sunCoords.azimuth);
    const isSunVisible = sunCoords.elevation > sunObstruction;

    // 2. Calculate Earth topocentric position
    const subEarth = getSubEarthPoint(jd);
    const earthCoords = calculateLocalHorizonCoords(
      site.latitude,
      site.longitude,
      site.elevationKm,
      subEarth.lat,
      subEarth.lon
    );
    const earthObstruction = getHorizonObstruction(site, earthCoords.azimuth);
    // Earth must clear local terrain AND be above 0° geometric horizon
    const isEarthVisible =
      earthCoords.elevation > earthObstruction && earthCoords.elevation > 0.0;

    const isDualWindow = isSunVisible && isEarthVisible;

    if (isSunVisible) {
      sunVisibleCount++;
      totalSunElevWhenVisible += sunCoords.elevation;
      currentDarknessRun = 0;
    } else {
      currentDarknessRun += stepHours;
      if (currentDarknessRun > maxDarknessRun) {
        maxDarknessRun = currentDarknessRun;
      }
    }

    if (isEarthVisible) {
      earthVisibleCount++;
    }
    totalEarthElev += earthCoords.elevation;

    if (isDualWindow) {
      dualVisibleCount++;
    }

    telemetry.push({
      timestamp: curDate.toISOString(),
      epochHour: stepIndex * stepHours,
      sunAzimuth: sunCoords.azimuth,
      sunElevation: sunCoords.elevation,
      sunTerrainObstruction: sunObstruction,
      isSunVisible,

      earthAzimuth: earthCoords.azimuth,
      earthElevation: earthCoords.elevation,
      earthTerrainObstruction: earthObstruction,
      isEarthVisible,

      isDualWindow,
    });

    stepIndex++;
  }

  const totalSteps = telemetry.length || 1;
  const totalHours = totalSteps * stepHours;

  const sunVisiblePct = Math.round((sunVisibleCount / totalSteps) * 1000) / 10;
  const earthVisiblePct = Math.round((earthVisibleCount / totalSteps) * 1000) / 10;
  const dualVisiblePct = Math.round((dualVisibleCount / totalSteps) * 1000) / 10;

  const avgSunElevation =
    sunVisibleCount > 0
      ? Math.round((totalSunElevWhenVisible / sunVisibleCount) * 10) / 10
      : 0;
  const avgEarthElevation =
    Math.round((totalEarthElev / totalSteps) * 10) / 10;

  return {
    site,
    telemetry,
    totalHours,
    sunVisibleHours: sunVisibleCount * stepHours,
    sunVisiblePct,
    earthVisibleHours: earthVisibleCount * stepHours,
    earthVisiblePct,
    dualVisibleHours: dualVisibleCount * stepHours,
    dualVisiblePct,
    maxContinuousDarknessHours: maxDarknessRun,
    avgSunElevation,
    avgEarthElevation,
  };
}
