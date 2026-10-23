import math
from typing import List, Optional, Dict
from ..models import CandidateSiteModel

def generate_horizon_profile(base_angle: float, peaks: List[Dict[str, float]]) -> List[float]:
    """
    Generates a 360-degree LOLA topographic horizon profile in degrees.
    """
    profile = []
    for az in range(360):
        elevation = base_angle
        for p in peaks:
            diff = abs(az - p["azimuth"])
            if diff > 180:
                diff = 360 - diff
            elevation += p["height"] * math.exp(-((diff / p["spread"]) ** 2))
        noise = math.sin(az * 0.25) * 0.12 + math.cos(az * 0.7) * 0.08
        profile.append(round(elevation + noise, 2))
    return profile

CANDIDATE_SITES: List[CandidateSiteModel] = [
    CandidateSiteModel(
        id="site-a",
        name="Shackleton Crater Rim",
        code="SHACKLETON-RIM",
        badge="Site A",
        latitude=-89.54,
        longitude=0.0,
        elevationKm=1.25,
        targetMission="Artemis III / Polar Scout",
        category="South Pole Ridge",
        description="A prominent peak on the connecting rim of Shackleton Crater situated mere kilometers from the exact lunar South Pole. Features near-permanent illumination ridges, but Earth sits at an extremely low grazing angle (~0° to 2°) susceptible to crater rim occultation.",
        illuminationNotes="Receives over 80-86% cumulative annual sunlight on elevated crests, but experiences brief deep shadow occultations by opposing crater massifs.",
        dteNotes="Earth elevation oscillates between -1.5° and +3.5° due to lunar libration in latitude. Northern rim massifs cause periodic communication blackouts.",
        coordinatesDisplay="89.54°S, 0.00°E",
        horizonProfile=generate_horizon_profile(0.6, [
            {"azimuth": 15, "height": 2.8, "spread": 22},
            {"azimuth": 85, "height": 2.2, "spread": 18},
            {"azimuth": 195, "height": 1.5, "spread": 35},
            {"azimuth": 310, "height": 3.1, "spread": 25},
        ]),
    ),
    CandidateSiteModel(
        id="site-b",
        name="Malapert Massif",
        code="MALAPERT-MASSIF",
        badge="Site B",
        latitude=-80.13,
        longitude=1.44,
        elevationKm=5.05,
        targetMission="Intuitive Machines IM-1 / Artemis V",
        category="South Pole Massif",
        description="A majestic mountain massif rising over 5,000 meters above surrounding polar terrain. Because of its massive elevation and lower polar latitude, Earth remains comfortably above the local horizon mask at all times, providing rock-solid direct communications.",
        illuminationNotes="Solar elevation reaches up to ~9.5° during peak southern summer, providing wide sunlight corridors with predictable terrain shadowing.",
        dteNotes="Earth stays consistently at 9.0°–10.5° elevation above the local horizontal, entirely unobstructed by terrain, yielding >99% uninterrupted DTE link availability.",
        coordinatesDisplay="80.13°S, 1.44°E",
        horizonProfile=generate_horizon_profile(0.4, [
            {"azimuth": 45, "height": 1.2, "spread": 30},
            {"azimuth": 160, "height": 1.6, "spread": 20},
            {"azimuth": 270, "height": 0.9, "spread": 40},
        ]),
    ),
    CandidateSiteModel(
        id="site-c",
        name="Mons Mouton",
        code="MONS-MOUTON",
        badge="Site C",
        latitude=-85.30,
        longitude=-31.30,
        elevationKm=4.80,
        targetMission="VIPER / Griffin Mission One",
        category="Polar Plateau",
        description="A vast flat-topped lunar mountain plateau bordering Nobile crater. Extensively evaluated for robotic prospecting due to benign trafficability and favorable compromise between solar illumination corridors and line-of-sight to Deep Space Network stations.",
        illuminationNotes="Wide plateau surface limits steep local horizon masks to <2.0°, allowing long daylight driving windows for solar-powered rovers.",
        dteNotes="Earth elevation hovers between 4.5° and 6.8°, clearing the gentle plateau edge across all primary comms azimuths.",
        coordinatesDisplay="85.30°S, 31.30°W",
        horizonProfile=generate_horizon_profile(0.5, [
            {"azimuth": 60, "height": 1.9, "spread": 25},
            {"azimuth": 210, "height": 1.8, "spread": 28},
        ]),
    ),
    CandidateSiteModel(
        id="site-d",
        name="Mare Crisium",
        code="MARE-CRISIUM",
        badge="Site D",
        latitude=18.56,
        longitude=61.81,
        elevationKm=-3.60,
        targetMission="Firefly Aerospace Blue Ghost M1",
        category="Equatorial Mare",
        description="A classic equatorial/mid-latitude circular impact basin filled with smooth basaltic lava. Serves as the scientific benchmark comparison site: exhibits a strict 14-day lunar day / 14-day lunar night cycle and unyielding 100% Earth visibility.",
        illuminationNotes="High solar elevations reaching up to 71.4° at lunar noon, followed by a harsh 354-hour continuous lunar night requiring survival heaters or RTGs.",
        dteNotes="Earth sits permanently locked at high elevation (~58° to 64°), never setting or touching local terrain at any time during the mission.",
        coordinatesDisplay="18.56°N, 61.81°E",
        horizonProfile=generate_horizon_profile(0.3, [
            {"azimuth": 90, "height": 0.9, "spread": 50},
            {"azimuth": 270, "height": 0.8, "spread": 50},
        ]),
    ),
    CandidateSiteModel(
        id="site-e",
        name="Connecting Ridge",
        code="CONNECTING-RIDGE",
        badge="Site E",
        latitude=-89.45,
        longitude=-137.40,
        elevationKm=2.10,
        targetMission="Artemis III Candidate Site",
        category="South Pole Ridge",
        description="A narrow elevated ridge connecting de Gerlache and Shackleton craters. One of the prime candidates for human landing due to exceptionally high solar visibility peaks, though Earth line-of-sight is at a grazing threshold susceptible to lunar orbital wobble.",
        illuminationNotes="Exhibits nearly continuous sunlight during southern summer solstice, reaching >90% illumination during favorable phases.",
        dteNotes="Positioned on the lunar limb hemisphere (137°W); Earth elevation is near the theoretical geometric horizon (-0.8° to +2.4°), requiring rigorous timing of relay assets.",
        coordinatesDisplay="89.45°S, 137.40°W",
        horizonProfile=generate_horizon_profile(0.8, [
            {"azimuth": 30, "height": 2.9, "spread": 20},
            {"azimuth": 140, "height": 3.4, "spread": 18},
            {"azimuth": 250, "height": 1.9, "spread": 35},
        ]),
    ),
]

def get_site_by_id(site_id: str) -> Optional[CandidateSiteModel]:
    for site in CANDIDATE_SITES:
        if site.id == site_id or site.code == site_id:
            return site
    return None

def get_horizon_obstruction(site: CandidateSiteModel, azimuth_deg: float) -> float:
    az = int(math.floor(azimuth_deg)) % 360
    if az < 0:
        az += 360
    if 0 <= az < len(site.horizonProfile):
        return site.horizonProfile[az]
    return 0.5
