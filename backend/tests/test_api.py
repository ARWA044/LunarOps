import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.science.terrain_horizon import CANDIDATE_SITES
from backend.app.science.ephemeris import (
    to_julian_date,
    get_sub_solar_point,
    get_sub_earth_point,
    calculate_local_horizon_coords,
)
from datetime import datetime

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "LunarOps" in data["service"]

def test_get_sites():
    response = client.get("/api/sites")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] == 5
    sites = data["sites"]
    assert len(sites) == 5

    # Check known sites are present
    codes = [s["code"] for s in sites]
    assert "SHACKLETON-RIM" in codes
    assert "MALAPERT-MASSIF" in codes
    assert "MONS-MOUTON" in codes
    assert "MARE-CRISIUM" in codes
    assert "CONNECTING-RIDGE" in codes

    for s in sites:
        assert len(s["horizonProfile"]) == 360
        assert all(isinstance(v, (int, float)) for v in s["horizonProfile"])

def test_compare_endpoint_post():
    payload = {
        "siteAId": "site-a",
        "siteBId": "site-b",
        "startDate": "2027-01-01T00:00:00Z",
        "endDate": "2027-01-07T23:59:59Z",
        "stepHours": 2,
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "siteA" in data
    assert "siteB" in data
    assert "summaryNarrative" in data

    siteA = data["siteA"]
    siteB = data["siteB"]

    assert siteA["site"]["code"] == "SHACKLETON-RIM"
    assert siteB["site"]["code"] == "MALAPERT-MASSIF"

    assert 0 <= siteA["sunVisiblePct"] <= 100
    assert 0 <= siteA["earthVisiblePct"] <= 100
    assert 0 <= siteA["dualVisiblePct"] <= 100

    assert len(siteA["telemetry"]) > 0
    t0 = siteA["telemetry"][0]
    assert "sunAzimuth" in t0
    assert "sunElevation" in t0
    assert "earthElevation" in t0
    assert "isSunVisible" in t0

    assert data["engine"] == "python-fastapi"

def test_compare_endpoint_get():
    response = client.get("/api/compare?siteA=site-c&siteB=site-d&start=2027-01-01T00:00:00Z&end=2027-01-03T00:00:00Z&step=6")
    assert response.status_code == 200
    data = response.json()
    assert data["siteA"]["site"]["code"] == "MONS-MOUTON"
    assert data["siteB"]["site"]["code"] == "MARE-CRISIUM"
    # Mare Crisium should have 100% Earth visibility
    assert data["siteB"]["earthVisiblePct"] == 100.0

def test_invalid_dates_handling():
    payload = {
        "siteAId": "site-a",
        "siteBId": "site-b",
        "startDate": "2027-01-10T00:00:00Z",
        "endDate": "2027-01-01T00:00:00Z",
        "stepHours": 1,
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 400

def test_astronomical_ephemeris_functions():
    dt = datetime(2027, 1, 1, 12, 0, 0)
    jd = to_julian_date(dt)
    assert jd > 2460000.0

    sun_lat, sun_lon = get_sub_solar_point(jd)
    assert -2.0 <= sun_lat <= 2.0
    assert 0.0 <= sun_lon <= 360.0

    earth_lat, earth_lon = get_sub_earth_point(jd)
    assert -9.0 <= earth_lat <= 9.0
    assert -10.0 <= earth_lon <= 10.0

    # Test topocentric calculation for Mare Crisium (lat 18.56, lon 61.81)
    # Earth has an elevation ~26.6° above the local horizon (zenith angle ~63.4°)
    az, el = calculate_local_horizon_coords(18.56, 61.81, -3.6, 0.0, 0.0)
    assert 20.0 <= el <= 35.0
