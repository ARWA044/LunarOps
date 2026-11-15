from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class CandidateSiteModel(BaseModel):
    id: str
    name: str
    code: str
    badge: str
    latitude: float
    longitude: float
    elevationKm: float
    targetMission: str
    category: str
    description: str
    illuminationNotes: str
    dteNotes: str
    coordinatesDisplay: str
    horizonProfile: List[float] = Field(..., description="360 elevation mask angles in degrees")

class TimeStepTelemetryModel(BaseModel):
    timestamp: str
    epochHour: float
    sunAzimuth: float
    sunElevation: float
    sunTerrainObstruction: float
    isSunVisible: bool = Field(default=False)
    earthAzimuth: float
    earthElevation: float
    earthTerrainObstruction: float
    isEarthVisible: bool = Field(default=False)
    isDualWindow: bool = Field(default=False)

class SiteAnalysisResultModel(BaseModel):
    site: CandidateSiteModel
    telemetry: List[TimeStepTelemetryModel]
    totalHours: float
    sunVisibleHours: float
    sunVisiblePct: float
    earthVisibleHours: float
    earthVisiblePct: float
    dualVisibleHours: float
    dualVisiblePct: float
    maxContinuousDarknessHours: float
    avgSunElevation: float
    avgEarthElevation: float

class NarrativeSummaryModel(BaseModel):
    overview: str
    headline: str
    solarWinner: str
    dteWinner: str
    plannersNote: str
    educatorsNote: str
    studentsNote: str

class DateRangeModel(BaseModel):
    start: str
    end: str
    stepHours: int = 1

class CompareRequestModel(BaseModel):
    siteAId: str = "site-a"
    siteBId: str = "site-b"
    startDate: str = "2027-01-01T00:00:00Z"
    endDate: str = "2027-01-07T23:59:59Z"
    stepHours: int = 1

class CompareResponseModel(BaseModel):
    siteA: SiteAnalysisResultModel
    siteB: SiteAnalysisResultModel
    dateRange: DateRangeModel
    generatedAt: str
    summaryNarrative: NarrativeSummaryModel
    engine: str = "python-fastapi"
    nasa_datasets: List[Dict[str, str]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Models for POST /api/lunar-evaluation  (SpiceyPy / geometric engine)
# ---------------------------------------------------------------------------

class LunarEvaluationRequest(BaseModel):
    """
    Input body for POST /api/lunar-evaluation.

    Fields
    ------
    latitude  : float, -90 to +90 degrees (selenographic latitude)
    longitude : float, -180 to +180 degrees (selenographic longitude)
    timestamp : Optional ISO 8601 string.  Defaults to current UTC time
                if omitted.  Must be timezone-aware or assumed UTC.

    Example payload
    ---------------
    {
      "latitude": -89.54,
      "longitude": 0.0,
      "timestamp": "2027-01-15T12:00:00Z"
    }
    """
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Selenographic latitude in degrees (-90 = South Pole, +90 = North Pole)",
        examples=[-89.54],
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Selenographic longitude in degrees (-180 to +180, positive = East)",
        examples=[0.0],
    )
    timestamp: Optional[str] = Field(
        default=None,
        description=(
            "UTC timestamp in ISO 8601 format (e.g. '2027-01-15T12:00:00Z'). "
            "Defaults to current UTC time if omitted."
        ),
        examples=["2027-01-15T12:00:00Z"],
    )


class LunarEvaluationResponse(BaseModel):
    """
    Output model for POST /api/lunar-evaluation.

    Core Metrics
    ------------
    sunlight_percentage       : 30-day rolling solar illumination (0-100 %)
    earth_los_percentage      : 30-day rolling Earth line-of-sight (0-100 %)
    mission_viability_score   : Weighted composite score, 60% power + 40% comms (0-100)
    recommendation_text       : Engineering verdict string

    Bonus Telemetry
    ---------------
    instant_sun_elevation_deg  : Sun elevation above local horizon at queried time (degrees)
    instant_earth_elevation_deg: Earth elevation above local horizon at queried time (degrees)
    is_sun_visible_now         : Whether the Sun clears the LOLA terrain mask right now
    is_earth_visible_now       : Whether Earth clears the LOLA terrain mask right now
    site_elevation_km          : Estimated terrain elevation used in the calculation
    evaluation_window_days     : Window over which percentages were computed (30 days)
    engine                     : Backend engine used ("spiceypy-de421" or "geometric-fallback")
    computed_at                : ISO 8601 UTC timestamp of computation
    """
    sunlight_percentage: float = Field(..., ge=0.0, le=100.0)
    earth_los_percentage: float = Field(..., ge=0.0, le=100.0)
    mission_viability_score: float = Field(..., ge=0.0, le=100.0)
    recommendation_text: str
    instant_sun_elevation_deg: float
    instant_earth_elevation_deg: float
    is_sun_visible_now: bool
    is_earth_visible_now: bool
    site_elevation_km: float
    evaluation_window_days: int
    engine: str
    computed_at: str
    nasa_datasets: List[Dict[str, str]] = Field(default_factory=list)
