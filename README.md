# LunarOps — The Moon, made easier to explore 🌙
### NASA Space Apps Challenge 2026 — CLPS Lunar Mission Browser

> **Important Scientific Disclaimer:**
> *"Seeing the Sun does not directly calculate electrical power, and seeing Earth does not guarantee a successful radio connection. LunarOps measures potential illumination and line-of-sight windows."*

---

## 🎯 The Core Problem & Solution

Lunar surface missions (NASA Commercial Lunar Payload Services / Artemis) face an unforgiving environment. Due to the Moon's minor axial tilt ($1.54^\circ$) and deep craters, sunlight and Direct-to-Earth (DTE) radio visibility are dictated by razor-thin margins over jagged local topography.

**LunarOps answers the fundamental mission question:**
> *"Where and when can a lander see the Sun and the Earth above the local lunar terrain?"*

By combining Moon-centric celestial mechanics (solar ephemeris + optical & physical librations) with high-resolution NASA Lunar Orbiter Laser Altimeter (**LOLA**) 360° Digital Elevation Model (**DEM**) horizon obstruction profiles, LunarOps enables mission teams to identify optimal operational windows where both power generation and ground communications coincide.

---

## 🎨 Visual Identity

- **Theme**: Aerospace Telemetry Dark UI (`#070B14` deep space slate, `#111827` card surfaces).
- **Color Coding**:
  - 🟡 **Solar Amber** (`#F59E0B`): Sunlight availability metrics and illumination curves.
  - 🌐 **Earth Cyan** (`#38BDF8`): Direct-to-Earth (DTE) line-of-sight visibility windows.
  - 🟢 **Optimal Window Green** (`#10B981`): Combined dual-window operational periods (Power + Comms active).
  - 🔴 **Shadow Alert** (`#EF4444`): Unbroken continuous darkness periods (battery sizing constraint).
- **Typography**: Clean header font (`Inter` / `Space Grotesk`) with monospaced telemetry figures (`JetBrains Mono`).

---

## 🚀 The 5 Must-Have Features

1. **Candidate Landing-Site Selector (Site A vs. Site B)**:
   - Side-by-side comparison of 5 documented candidate sites:
     - **Site A: Shackleton Crater Rim (South Pole)** — `89.54°S, 0.00°E` (High sunlight ridges, challenging low-angle Earth visibility & crater rim obstructions).
     - **Site B: Malapert Massif (IM-1 / Artemis Region)** — `80.13°S, 1.44°E` (Strong Direct-to-Earth visibility, moderate terrain shadowing).
     - **Site C: Mons Mouton (VIPER / Griffin Target)** — `85.30°S, 31.30°W` (Flat plateau, balanced solar & DTE windows).
     - **Site D: Mare Crisium (Firefly Blue Ghost M1)** — `18.56°N, 61.81°E` (Equatorial baseline: 100% Earth visibility, strict 14-day day/night cycle).
     - **Site E: Connecting Ridge (Artemis III Candidate)** — `89.45°S, 137.40°W` (Peak of near-eternal light, grazing Earth elevation).
   - **Interactive Visual Lunar Surface Map**: Supports both South Polar stereographic projection (80°S–90°S craters & PSRs) and Global Orthographic projection.

2. **UTC Date Range & Time-Step Controls**:
   - Date range selector defaulting to `2027-01-01` to `2027-01-07 UTC`.
   - Quick presets: *"7-Day Window"*, *"14-Day Lunar Night Test"*, and *"29.5-Day Full Synodic Month"*.
   - Configurable time steps: 1 Hour (High Fidelity), 2 Hours, 6 Hours.
   - Smooth asynchronous "Run Analysis" telemetry button.

3. **Sun & Earth Visibility Charts & Timelines**:
   - **Time-Series Elevation vs. Terrain Horizon Chart**: Interactive SVG telemetry plotting Sun Elevation (°) and Earth Elevation (°) directly against the site's local LOLA Terrain Obstruction Horizon (°).
   - **Gantt-Style Visibility Window Timelines**: Hour-by-hour comparison bars (Solar Window vs. Earth LoS Window vs. Combined Dual Window).
   - **360° Local Horizon Obstruction Profile**: Visualizes surrounding NASA LOLA terrain elevation masks ($0^\circ$ to $360^\circ$ azimuth) in both unwrapped linear profile and polar radar radar views.

4. **Side-by-Side Comparison Dashboard**:
   - Prominent KPI cards for **SITE A** (`SUN VISIBLE %`, `EARTH VISIBLE %`, `DUAL WINDOW %`) vs. **SITE B**.
   - Maximum continuous darkness shadow duration in hours (critical for secondary battery sizing).
   - Average Sun and Earth elevation angles above local horizon.
   - Dynamic Delta advantage indicators ($A - B$).

5. **Plain-Language Results & Multi-Audience Explainer**:
   - Automated comparative synthesis explaining trade-offs.
   - Audience mode lenses:
     - 🚀 **Mission Planners**: Battery sizing, thermal heaters, antenna steering, relay needs.
     - 📖 **Educators**: Lunar axial tilt ($1.54^\circ$), libration wobbles, permanent shadow regions.
     - 🎓 **Students**: Friendly analogies and lunar exploration facts.

---

## 👥 5-Role Team Architecture

| Role | Responsibility | Primary Code Deliverables |
|---|---|---|
| **Role 01: Celestial Mechanics & Ephemeris** | Sun/Earth Moon-centric coordinates, libration math, topocentric elevations | `backend/app/science/ephemeris.py`, `src/lib/astronomical.ts` |
| **Role 02: Planetary Geodesy & LOLA Terrain** | NASA LOLA 360° DEM horizon obstruction profiles, site geodesy | `backend/app/science/terrain_horizon.py`, `src/lib/lola-terrain.ts` |
| **Role 03: Full-Stack API & Integration** | FastAPI endpoints (`GET /api/sites`, `POST /api/compare`), Pytest test suite | `backend/app/main.py`, `backend/tests/test_api.py`, `src/app/api/` |
| **Role 04: UI/UX & Data Visualization Lead** | Aerospace telemetry dark UI, charts, Gantt bars, interactive map, plain language | `src/components/`, `src/app/page.tsx`, `src/app/globals.css` |
| **Role 05: DevSecOps & Cloud Architect (Arwa)** | Docker Compose, GitHub Actions CI/DevSecOps (Gitleaks, Semgrep, Trivy), Terraform | `docker-compose.yml`, `.github/workflows/ci-devsecops.yml`, `infra/main.tf` |

---

## 🛠️ Quickstart Guide

### Option 1: Standalone Next.js Frontend (Zero External Setup)
The Next.js application features a built-in TypeScript astronomical calculation engine and client-side computation fallback:
```bash
# In project root
npm install
npm run build
npm start
# Open http://localhost:3000
```

### Option 2: Python FastAPI Scientific Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
# Interactive API documentation: http://localhost:8000/docs
# Run automated tests:
pytest tests/test_api.py -v
```

### Option 3: Full-Stack Docker Compose Orchestration
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

---

## 🔒 DevSecOps & Security Pipeline
As specified on page 7 of the NASA challenge brief, the project includes automated security checks in `.github/workflows/ci-devsecops.yml`:
- 🔑 **Gitleaks**: Scans commits for hardcoded tokens, API keys, and credentials.
- 🛡️ **Semgrep**: Static Application Security Testing (SAST) for Python and TypeScript code.
- 📦 **Aqua Trivy**: Scans Docker containers and software supply chain dependencies for vulnerabilities.

---

## 📜 Scientific Calculation Methodology

1. **Sub-solar Coordinates**:
   - The Moon's obliquity to the ecliptic is $1.543^\circ$.
   - Solar sub-latitude $\delta_\odot(t) = -1.543^\circ \cos\left(\frac{d - 10}{365.25} 2\pi\right)$.
   - Sub-solar longitude sweeps across the lunar surface at the synodic rate ($29.530589$ days).
2. **Sub-Earth Coordinates & Libration**:
   - Longitude libration: $l_{lib}(t) \approx 7.9^\circ \sin(M_{moon}) + 1.25^\circ \sin(2M_{moon})$ ($27.55$-day period).
   - Latitude libration: $b_{lib}(t) \approx 6.7^\circ \sin(F_{moon}) + 0.8^\circ \sin(2F_{moon})$ ($27.21$-day period).
3. **Visibility Above Local LOLA Terrain**:
   - For any azimuth $\theta$, the NASA LOLA digital elevation model defines the highest terrain obstruction angle $H(\theta)$.
   - $\text{Sun Visible} \iff e_\odot(t) > H(\alpha_\odot(t))$.
   - $\text{Earth Visible} \iff e_\oplus(t) > H(\alpha_\oplus(t)) \text{ and } e_\oplus(t) > 0^\circ$.
   - $\text{Dual Window} \iff \text{Sun Visible} \land \text{Earth Visible}$.
