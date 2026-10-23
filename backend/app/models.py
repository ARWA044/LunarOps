from typing import List, Optional
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
