export interface CandidateSite {
  id: string;
  name: string;
  code: string;
  badge: string;
  latitude: number; // Decimal degrees (+ North, - South)
  longitude: number; // Decimal degrees (+ East, - West)
  elevationKm: number; // Relative elevation in km from mean lunar radius 1737.4 km
  targetMission: string;
  category: "South Pole Ridge" | "South Pole Massif" | "Polar Plateau" | "Equatorial Mare";
  description: string;
  illuminationNotes: string;
  dteNotes: string;
  coordinatesDisplay: string;
  horizonProfile: number[]; // 360 values (one per degree azimuth from 0 to 359)
}

export interface TimeStepTelemetry {
  timestamp: string; // ISO UTC
  epochHour: number;
  sunAzimuth: number; // deg (0 = North, 90 = East, 180 = South, 270 = West)
  sunElevation: number; // deg
  sunTerrainObstruction: number; // deg
  isSunVisible: boolean;

  earthAzimuth: number; // deg
  earthElevation: number; // deg
  earthTerrainObstruction: number; // deg
  isEarthVisible: boolean;

  isDualWindow: boolean; // Both Sun AND Earth visible
}

export interface SiteAnalysisResult {
  site: CandidateSite;
  telemetry: TimeStepTelemetry[];
  totalHours: number;
  sunVisibleHours: number;
  sunVisiblePct: number;
  earthVisibleHours: number;
  earthVisiblePct: number;
  dualVisibleHours: number;
  dualVisiblePct: number;
  maxContinuousDarknessHours: number;
  avgSunElevation: number;
  avgEarthElevation: number;
}

export interface NarrativeSummary {
  overview: string;
  headline: string;
  solarWinner: string;
  dteWinner: string;
  plannersNote: string;
  educatorsNote: string;
  studentsNote: string;
}

export interface ComparisonResponse {
  siteA: SiteAnalysisResult;
  siteB: SiteAnalysisResult;
  dateRange: {
    start: string;
    end: string;
    stepHours: number;
  };
  generatedAt: string;
  summaryNarrative: NarrativeSummary;
  engine: "typescript-client" | "python-fastapi";
}
