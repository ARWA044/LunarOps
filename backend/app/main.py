from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    CandidateSiteModel,
    CompareRequestModel,
    CompareResponseModel,
    DateRangeModel,
    LunarEvaluationRequest,
    LunarEvaluationResponse,
)
from .science.terrain_horizon import CANDIDATE_SITES, get_site_by_id
from .science.ephemeris import analyze_site_visibility, generate_narrative_summary
from .science.lunar_evaluation import _try_load_spice, evaluate_lunar_site


def nasa_dataset_metadata(spice_available: bool) -> list[dict[str, str]]:
    return [
        {
            "id": "naif-spice-de421",
            "name": "NASA JPL NAIF SPICE kernels",
            "products": "DE421, PCK00011, NAIF0012",
            "status": "used" if spice_available else "unavailable_geometric_fallback",
            "method": "Numerical ephemeris and lunar body-fixed geometry for Sun/Earth positions.",
            "limitations": "SPICE is active only when SpiceyPy and all three local kernels load successfully.",
            "url": "https://naif.jpl.nasa.gov/naif/data.html",
        },
        {
            "id": "lro-lola",
            "name": "NASA LRO LOLA",
            "products": "Lunar Orbiter Laser Altimeter terrain context",
            "status": "synthetic_approximation",
            "method": "Prototype horizon masks and site elevations are parameterized approximations informed by lunar polar terrain context.",
            "limitations": "No LOLA DEM, slope, roughness, or PSR raster is ingested by this application; values are not direct LOLA measurements.",
            "url": "https://pds-geosciences.wustl.edu/missions/lro/lola.htm",
        },
        {
            "id": "lro-diviner",
            "name": "NASA LRO Diviner Lunar Radiometer",
            "products": "Diviner gridded data records",
            "status": "not_integrated",
            "method": "No Diviner observations or thermal calculations currently feed the scores.",
            "limitations": "Surface temperature and thermal stability are not modeled by this evaluation engine.",
            "url": "https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0",
        },
        {
            "id": "artemis-candidate-regions",
            "name": "NASA Artemis III candidate landing regions",
            "products": "Official candidate-region references; prototype site roster",
            "status": "reference_only",
            "method": "App-configured coordinates are used as example comparison sites, not imported official region polygons or constraints.",
            "limitations": "The five app sites are not the complete/current NASA candidate-region list; do not present them as official coordinates.",
            "url": "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/",
        },
    ]

app = FastAPI(
    title="LunarOps Science Telemetry API",
    description="NASA Space Apps Challenge 2026: CLPS Lunar Landing-Site Sunlight Availability & DTE Visibility Telemetry Engine.",
    version="2.6.0",
)

import os

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
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
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
        start_dt = start_dt.astimezone(timezone.utc)
        end_dt = end_dt.astimezone(timezone.utc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ISO 8601 UTC date: {e}")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="startDate must be before endDate")

    step_hours = max(1, request.stepHours)

    # Initialize the JPL engine once per request, then use its DE421 sub-body
    # positions for every comparison telemetry sample when kernels are available.
    use_spice = _try_load_spice()
    site_a_result = analyze_site_visibility(site_a, start_dt, end_dt, step_hours, use_spice)
    site_b_result = analyze_site_visibility(site_b, start_dt, end_dt, step_hours, use_spice)

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
        engine="spiceypy-de421" if use_spice else "geometric-fallback",
        nasa_datasets=nasa_dataset_metadata(use_spice),
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


@app.post("/api/lunar-evaluation", response_model=LunarEvaluationResponse)
def lunar_evaluation(request: LunarEvaluationRequest):
    """
    Single-site, single-timestamp lunar evaluation powered by SpiceyPy (NASA SPICE
    DE421 ephemeris) with an automatic fallback to the built-in geometric model.

    **Input**
    ```json
    {
      "latitude":  -89.54,
      "longitude":  0.0,
      "timestamp": "2027-01-15T12:00:00Z"
    }
    ```

    **Output (core metrics)**
    - `sunlight_percentage`       — 30-day rolling solar illumination (0–100 %)
    - `earth_los_percentage`      — 30-day rolling Earth line-of-sight (0–100 %)
    - `mission_viability_score`   — Weighted composite (60 % power + 40 % comms)
    - `recommendation_text`       — Engineering verdict with region classification

    **SPICE kernel setup (optional, one-time, ~27 MB total)**
    ```bash
    mkdir -p backend/kernels && cd backend/kernels
    curl -O https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp
    curl -O https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc
    curl -O https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls
    pip install spiceypy>=6.0.0
    ```
    Set `SPICE_KERNEL_DIR` env var to override the default `backend/kernels/` path.
    If kernels are absent, the endpoint uses the built-in geometric model and
    returns `"engine": "geometric-fallback"` in the response.
    """
    # Parse and normalise timestamp
    if request.timestamp:
        try:
            ts_str = request.timestamp.replace("Z", "+00:00")
            timestamp = datetime.fromisoformat(ts_str)
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
        except ValueError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid ISO 8601 timestamp '{request.timestamp}': {e}",
            )
    else:
        timestamp = datetime.now(timezone.utc)

    try:
        result = evaluate_lunar_site(
            latitude=request.latitude,
            longitude=request.longitude,
            timestamp=timestamp,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lunar evaluation engine error: {exc}",
        )

    return LunarEvaluationResponse(
        **result,
        nasa_datasets=nasa_dataset_metadata(result["engine"] == "spiceypy-de421"),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
