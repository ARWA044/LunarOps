from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    CandidateSiteModel,
    CompareRequestModel,
    CompareResponseModel,
    DateRangeModel,
)
from .science.terrain_horizon import CANDIDATE_SITES, get_site_by_id
from .science.ephemeris import analyze_site_visibility, generate_narrative_summary

app = FastAPI(
    title="LunarOps Science Telemetry API",
    description="NASA Space Apps Challenge 2026: CLPS Lunar Landing-Site Sunlight Availability & DTE Visibility Telemetry Engine.",
    version="2.6.0",
)

# Enable CORS for local Next.js frontend dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "LunarOps Telemetry API",
        "status": "operational",
        "version": "2.6.0",
        "documentation": "/docs",
        "nasa_mission": "CLPS & Artemis Landing-Site Assessment",
    }

@app.get("/api/sites", response_model=dict)
def get_sites():
    """
    Returns the 5 documented candidate lunar landing sites with coordinates and 360° LOLA terrain horizon profiles.
    """
    return {
        "status": "success",
        "count": len(CANDIDATE_SITES),
        "sites": [site.model_dump() for site in CANDIDATE_SITES],
    }

@app.post("/api/compare", response_model=CompareResponseModel)
def compare_landing_sites(request: CompareRequestModel):
    """
    Computes time-series sunlight availability and Direct-to-Earth (DTE) visibility
    above local LOLA terrain masks for Site A vs Site B over the given UTC window.
    """
    site_a = get_site_by_id(request.siteAId) or CANDIDATE_SITES[0]
    site_b = get_site_by_id(request.siteBId) or CANDIDATE_SITES[1]

    try:
        # Normalize date strings
        start_str = request.startDate.replace("Z", "+00:00")
        end_str = request.endDate.replace("Z", "+00:00")
        start_dt = datetime.fromisoformat(start_str)
        end_dt = datetime.fromisoformat(end_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ISO 8601 UTC date: {e}")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="startDate must be before endDate")

    step_hours = max(1, request.stepHours)

    site_a_result = analyze_site_visibility(site_a, start_dt, end_dt, step_hours)
    site_b_result = analyze_site_visibility(site_b, start_dt, end_dt, step_hours)

    narrative = generate_narrative_summary(
        site_a_result,
        site_b_result,
        start_dt.strftime("%Y-%m-%d"),
        end_dt.strftime("%Y-%m-%d"),
    )

    return CompareResponseModel(
        siteA=site_a_result,
        siteB=site_b_result,
        dateRange=DateRangeModel(
            start=start_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            end=end_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            stepHours=step_hours,
        ),
        generatedAt=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        summaryNarrative=narrative,
        engine="python-fastapi",
    )

@app.get("/api/compare", response_model=CompareResponseModel)
def compare_landing_sites_get(
    siteA: str = Query("site-a", description="Site A identifier"),
    siteB: str = Query("site-b", description="Site B identifier"),
    start: str = Query("2027-01-01T00:00:00Z", description="Start UTC ISO string"),
    end: str = Query("2027-01-07T23:59:59Z", description="End UTC ISO string"),
    step: int = Query(1, description="Step hours interval"),
):
    req = CompareRequestModel(
        siteAId=siteA,
        siteBId=siteB,
        startDate=start,
        endDate=end,
        stepHours=step,
    )
    return compare_landing_sites(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
