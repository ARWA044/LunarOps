import math
from datetime import datetime
from typing import Tuple, Dict, Any, List
from ..models import (
    CandidateSiteModel,
    TimeStepTelemetryModel,
    SiteAnalysisResultModel,
    NarrativeSummaryModel,
)
from .terrain_horizon import get_horizon_obstruction

J2000 = 2451545.0
DEG2RAD = math.pi / 180.0
RAD2DEG = 180.0 / math.pi

def to_julian_date(dt: datetime) -> float:
    # Unix timestamp in seconds to Julian Date
    return (dt.timestamp() / 86400.0) + 2440587.5

def get_sub_solar_point(jd: float) -> Tuple[float, float]:
    d = jd - J2000
    # Synodic lunar period (29.530589 days)
    synodic_period = 29.530588853
    t_phase = (d / synodic_period) % 1.0
    lon = ((180.0 - t_phase * 360.0) % 360.0 + 360.0) % 360.0

    # Sub-solar latitude: amplitude ~1.543° tilted relative to ecliptic
    day_of_year = (d % 365.25 + 365.25) % 365.25
    lat = -1.543 * math.cos(((day_of_year - 10.0) / 365.25) * 2.0 * math.pi)
    return lat, lon

def get_sub_earth_point(jd: float) -> Tuple[float, float]:
    d = jd - J2000
    anomalistic_period = 27.55454988
    l_phase = ((d / anomalistic_period) * 2.0 * math.pi) % (2.0 * math.pi)
    lon_lib = 7.9 * math.sin(l_phase) + 1.25 * math.sin(2.0 * l_phase)

    draconic_period = 27.212220817
    b_phase = ((d / draconic_period) * 2.0 * math.pi) % (2.0 * math.pi)
    lat_lib = 6.7 * math.sin(b_phase) + 0.8 * math.sin(2.0 * b_phase)

    return lat_lib, lon_lib

def calculate_local_horizon_coords(
    site_lat: float,
    site_lon: float,
    site_elev_km: float,
    body_lat: float,
    body_lon: float,
) -> Tuple[float, float]:
    phi = site_lat * DEG2RAD
    lam = site_lon * DEG2RAD
    delta = body_lat * DEG2RAD
    alpha = body_lon * DEG2RAD

    h = alpha - lam

    sin_elev = math.sin(phi) * math.sin(delta) + math.cos(phi) * math.cos(delta) * math.cos(h)
    sin_elev = max(-1.0, min(1.0, sin_elev))
    elevation = math.asin(sin_elev) * RAD2DEG

    # Elevation dip bonus due to topographic altitude
    if site_elev_km > 0:
        r_moon = 1737.4
        dip = math.acos(r_moon / (r_moon + site_elev_km)) * RAD2DEG
        elevation += dip * 0.45

    y = math.sin(h) * math.cos(delta)
    x = math.cos(phi) * math.sin(delta) - math.sin(phi) * math.cos(delta) * math.cos(h)
    azimuth = math.atan2(y, x) * RAD2DEG
    azimuth = (azimuth % 360.0 + 360.0) % 360.0

    return round(azimuth, 2), round(elevation, 2)

def analyze_site_visibility(
    site: CandidateSiteModel,
    start_dt: datetime,
    end_dt: datetime,
    step_hours: int = 1,
) -> SiteAnalysisResultModel:
    telemetry: List[TimeStepTelemetryModel] = []
    start_ts = start_dt.timestamp()
    end_ts = end_dt.timestamp()
    step_seconds = max(1, step_hours) * 3600

    sun_visible_count = 0
    earth_visible_count = 0
    dual_visible_count = 0

    current_darkness_run = 0.0
    max_darkness_run = 0.0

    total_sun_elev_visible = 0.0
    total_earth_elev = 0.0

    cur_ts = start_ts
    epoch_idx = 0

    while cur_ts <= end_ts:
        dt = datetime.fromtimestamp(cur_ts)
        jd = to_julian_date(dt)

        # Sun topocentric position
        sub_sun_lat, sub_sun_lon = get_sub_solar_point(jd)
        sun_az, sun_el = calculate_local_horizon_coords(
            site.latitude, site.longitude, site.elevationKm, sub_sun_lat, sub_sun_lon
        )
        sun_obs = get_horizon_obstruction(site, sun_az)
        is_sun_visible = sun_el > sun_obs

        # Earth topocentric position
        sub_earth_lat, sub_earth_lon = get_sub_earth_point(jd)
        earth_az, earth_el = calculate_local_horizon_coords(
            site.latitude, site.longitude, site.elevationKm, sub_earth_lat, sub_earth_lon
        )
        earth_obs = get_horizon_obstruction(site, earth_az)
        is_earth_visible = earth_el > earth_obs and earth_el > 0.0

        is_dual_window = is_sun_visible and is_earth_visible

        if is_sun_visible:
            sun_visible_count += 1
            total_sun_elev_visible += sun_el
            current_darkness_run = 0.0
        else:
            current_darkness_run += float(step_hours)
            if current_darkness_run > max_darkness_run:
                max_darkness_run = current_darkness_run

        if is_earth_visible:
            earth_visible_count += 1
        total_earth_elev += earth_el

        if is_dual_window:
            dual_visible_count += 1

        telemetry.append(
            TimeStepTelemetryModel(
                timestamp=dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                epochHour=float(epoch_idx * step_hours),
                sunAzimuth=sun_az,
                sunElevation=sun_el,
                sunTerrainObstruction=sun_obs,
                isSunVisible=is_sun_visible,
                earthAzimuth=earth_az,
                earthElevation=earth_el,
                earthTerrainObstruction=earth_obs,
                isEarthVisible=is_earth_visible,
                isDualWindow=is_dual_window,
            )
        )

        cur_ts += step_seconds
        epoch_idx += 1

    total_steps = len(telemetry) or 1
    total_hours = float(total_steps * step_hours)

    sun_pct = round((sun_visible_count / total_steps) * 100.0, 1)
    earth_pct = round((earth_visible_count / total_steps) * 100.0, 1)
    dual_pct = round((dual_visible_count / total_steps) * 100.0, 1)

    avg_sun = round(total_sun_elev_visible / sun_visible_count, 1) if sun_visible_count > 0 else 0.0
    avg_earth = round(total_earth_elev / total_steps, 1)

    return SiteAnalysisResultModel(
        site=site,
        telemetry=telemetry,
        totalHours=total_hours,
        sunVisibleHours=float(sun_visible_count * step_hours),
        sunVisiblePct=sun_pct,
        earthVisibleHours=float(earth_visible_count * step_hours),
        earthVisiblePct=earth_pct,
        dualVisibleHours=float(dual_visible_count * step_hours),
        dualVisiblePct=dual_pct,
        maxContinuousDarknessHours=round(max_darkness_run, 1),
        avgSunElevation=avg_sun,
        avgEarthElevation=avg_earth,
    )

def generate_narrative_summary(
    site_a: SiteAnalysisResultModel,
    site_b: SiteAnalysisResultModel,
    start_str: str,
    end_str: str,
) -> NarrativeSummaryModel:
    solar_diff = round(site_a.sunVisiblePct - site_b.sunVisiblePct, 1)
    earth_diff = round(site_a.earthVisiblePct - site_b.earthVisiblePct, 1)
    dual_diff = round(site_a.dualVisiblePct - site_b.dualVisiblePct, 1)

    solar_leader = (
        f"{site_a.site.name} (+{solar_diff}%)"
        if solar_diff > 0
        else f"{site_b.site.name} (+{abs(solar_diff)}%)"
        if solar_diff < 0
        else "Equal illumination"
    )

    dte_leader = (
        f"{site_a.site.name} (+{earth_diff}%)"
        if earth_diff > 0
        else f"{site_b.site.name} (+{abs(earth_diff)}%)"
        if earth_diff < 0
        else "Equal DTE availability"
    )

    if solar_diff > 5 and earth_diff < -5:
        headline = f"Classic Polar Trade-Off: {site_a.site.name} wins on Sunlight, while {site_b.site.name} wins on Earth Communication."
    elif solar_diff < -5 and earth_diff > 5:
        headline = f"Classic Polar Trade-Off: {site_b.site.name} wins on Sunlight, while {site_a.site.name} wins on Earth Communication."
    elif dual_diff > 5:
        headline = f"{site_a.site.name} dominates combined dual-window operations (+{dual_diff}% window overlap)."
    elif dual_diff < -5:
        headline = f"{site_b.site.name} dominates combined dual-window operations (+{abs(dual_diff)}% window overlap)."
    else:
        headline = f"Balanced operational profiles between {site_a.site.name} and {site_b.site.name}."

    overview = (
        f"Between {start_str} and {end_str} (UTC), "
        f"{site_a.site.name if solar_diff >= 0 else site_b.site.name} offers "
        f"+{abs(solar_diff)}% more sunlight than {site_b.site.name if solar_diff >= 0 else site_a.site.name} "
        f"({site_a.sunVisiblePct}% vs. {site_b.sunVisiblePct}%). "
        f"Conversely, {site_a.site.name if earth_diff >= 0 else site_b.site.name} provides "
        f"+{abs(earth_diff)}% better Direct-to-Earth communication visibility "
        f"({site_a.earthVisiblePct}% vs. {site_b.earthVisiblePct}%). "
        f"Combined dual window operations favor {site_a.site.name if dual_diff >= 0 else site_b.site.name} "
        f"with {site_a.dualVisiblePct if dual_diff >= 0 else site_b.dualVisiblePct}% dual coverage."
    )

    planners_note = (
        f"Battery Sizing & Comms Margin Analysis:\n"
        f"• Darkness Endurance: {site_a.site.name} requires surviving a maximum continuous shadow duration of "
        f"{site_a.maxContinuousDarknessHours}h, whereas {site_b.site.name} requires {site_b.maxContinuousDarknessHours}h.\n"
        f"• Antenna Tracking: Average Earth elevation at {site_a.site.name} is {site_a.avgEarthElevation}° "
        f"compared to {site_b.avgEarthElevation}° at {site_b.site.name}.\n"
        f"• Comms Relay: Sites with Earth elevation < 3° face multipath fade during negative librations."
    )

    educators_note = (
        f"Classroom Physics of Lunar Polar Illumination:\n"
        f"• Because the Moon's axial tilt is only 1.54°, high crater rims graze sunlight perpetually, "
        f"while crater bottoms remain frozen in permanent darkness.\n"
        f"• Earth libration wobbles the sub-Earth point across a ±7.9° lon and ±6.7° lat range, "
        f"causing Earth to oscillate in elevation from polar vantage points."
    )

    students_note = (
        f"Quick Lunar Facts:\n"
        f"🚀 At {site_a.site.name}, the Sun appears to skim along the jagged mountain peaks like a glowing ember!\n"
        f"🛰️ From {site_b.site.name}, Earth shines brightly in the sky without ever dropping below the hills!\n"
        f"🔋 Your rover must pack batteries capable of surviving at least {max(site_a.maxContinuousDarknessHours, site_b.maxContinuousDarknessHours)} hours of cold darkness!"
    )

    return NarrativeSummaryModel(
        overview=overview,
        headline=headline,
        solarWinner=solar_leader,
        dteWinner=dte_leader,
        plannersNote=planners_note,
        educatorsNote=educators_note,
        studentsNote=students_note,
    )
