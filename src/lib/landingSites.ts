import type { LandingSite, TerrainProfile } from "./types";

// ── Terrain‑profile generator ─────────────────────────────────────────────────
// Builds a 360‑element horizon‑mask from a set of sinusoidal terms + uniform
// base.  Each term: { azCenter, width, peakDeg } adds a Gaussian‑like bump.

interface TerrainTerm {
  azCenter: number; // azimuth of peak (degrees)
  width: number;    // angular half‑width σ (degrees)
  peakDeg: number;  // maximum additional elevation (degrees)
}

function buildTerrainProfile(
  baseDeg: number,
  terms: TerrainTerm[],
  noiseSeed: number = 0,
): TerrainProfile {
  const mask: number[] = new Array(360);
  for (let az = 0; az < 360; az++) {
    let val = baseDeg;
    for (const t of terms) {
      let daz = az - t.azCenter;
      // wrap to [-180, 180]
      if (daz > 180) daz -= 360;
      if (daz < -180) daz += 360;
      val += t.peakDeg * Math.exp((-daz * daz) / (2 * t.width * t.width));
    }
    // deterministic pseudo‑noise for realism (±0.3°)
    const n = Math.sin(az * 7.3 + noiseSeed * 13.1) * 0.15
            + Math.sin(az * 3.1 + noiseSeed * 7.7) * 0.15;
    mask[az] = Math.max(0, val + n);
  }
  return { horizonMask: mask };
}

// ── Curated Sites ─────────────────────────────────────────────────────────────

export const CURATED_SITES: LandingSite[] = [
  {
    id: "shackleton-ridge",
    name: "Shackleton Connecting Ridge",
    shortName: "Shackleton Ridge",
    description:
      "High‑illumination ridge connecting Shackleton Crater to de Gerlache, prime Artemis / CLPS target. Nearly continuous sunlight on the crest, with deep PSRs just metres below.",
    category: "artemis",
    latitude: -89.46,
    longitude: 222.7,
    elevation: 2150,
    terrainProfile: buildTerrainProfile(2.5, [
      { azCenter: 180, width: 40, peakDeg: 12 },   // Shackleton crater wall to south
      { azCenter: 200, width: 25, peakDeg: 8 },
      { azCenter: 350, width: 30, peakDeg: 5 },     // de Gerlache rim to NNW
      { azCenter: 90,  width: 50, peakDeg: 3 },
    ], 1),
  },
  {
    id: "malapert-massif",
    name: "Malapert Massif",
    shortName: "Malapert",
    description:
      "High‑elevation massif with excellent Direct‑to‑Earth visibility. Targeted by Intuitive Machines and other CLPS providers. Earth never fully sets when viewed from the summit.",
    category: "clps",
    latitude: -86.04,
    longitude: 0.0,
    elevation: 4850,
    terrainProfile: buildTerrainProfile(1.8, [
      { azCenter: 160, width: 35, peakDeg: 4 },
      { azCenter: 270, width: 30, peakDeg: 3 },
      { azCenter: 45,  width: 25, peakDeg: 2 },
    ], 2),
  },
  {
    id: "mons-mouton",
    name: "Mons Mouton (VIPER Target)",
    shortName: "Mons Mouton",
    description:
      "Flat, elevated plateau originally selected for the VIPER rover. Good solar illumination and gentle slopes suitable for roving. Nearby PSRs offer volatile‑prospecting opportunities.",
    category: "clps",
    latitude: -84.60,
    longitude: 31.0,
    elevation: 5100,
    terrainProfile: buildTerrainProfile(1.5, [
      { azCenter: 190, width: 45, peakDeg: 3 },
      { azCenter: 310, width: 35, peakDeg: 2.5 },
      { azCenter: 80,  width: 30, peakDeg: 2 },
    ], 3),
  },
  {
    id: "haworth-rim",
    name: "Haworth Crater Rim",
    shortName: "Haworth Rim",
    description:
      "The narrow rim of Haworth Crater — one side bathed in sunlight, the other plunging into permanent shadow. Extreme contrast in illumination within a few hundred metres.",
    category: "clps",
    latitude: -87.45,
    longitude: 355.0,
    elevation: 1200,
    terrainProfile: buildTerrainProfile(2.0, [
      // Crater interior side — massive wall
      { azCenter: 135, width: 50, peakDeg: 18 },
      { azCenter: 170, width: 35, peakDeg: 14 },
      // Outer rim — relatively open
      { azCenter: 330, width: 40, peakDeg: 4 },
      { azCenter: 30,  width: 30, peakDeg: 3 },
    ], 4),
  },
  {
    id: "haworth-floor",
    name: "Haworth Crater Floor",
    shortName: "Haworth Floor",
    description:
      "Deep inside Haworth Crater — a Permanently Shadowed Region where sunlight never reaches and temperatures stay near 40 K (−233 °C). The ultimate worst‑case landing scenario for solar power.",
    category: "clps",
    latitude: -87.45,
    longitude: 355.0,
    elevation: -3100,
    terrainProfile: buildTerrainProfile(18, [
      { azCenter: 0,   width: 60, peakDeg: 10 },
      { azCenter: 90,  width: 60, peakDeg: 12 },
      { azCenter: 180, width: 60, peakDeg: 8 },
      { azCenter: 270, width: 60, peakDeg: 11 },
    ], 5),
  },
  {
    id: "chandrayaan3",
    name: "Statio Shiv Shakti (Chandrayaan‑3)",
    shortName: "Shiv Shakti",
    description:
      "ISRO's Chandrayaan‑3 Vikram lander touched down here on 23 Aug 2023, making India the fourth nation to soft‑land on the Moon and the first to land near the south pole.",
    category: "international",
    latitude: -69.37,
    longitude: 32.32,
    elevation: 580,
    terrainProfile: buildTerrainProfile(2.5, [
      { azCenter: 120, width: 40, peakDeg: 4 },
      { azCenter: 240, width: 35, peakDeg: 3.5 },
      { azCenter: 350, width: 30, peakDeg: 3 },
    ], 6),
  },
  {
    id: "apollo-11",
    name: "Apollo 11 — Mare Tranquillitatis",
    shortName: "Apollo 11",
    description:
      "Sea of Tranquility, 20 Jul 1969. Near‑equatorial mare basalt plain with 14 Earth‑days of sunlight followed by 14 days of darkness — the classic lunar day/night benchmark.",
    category: "apollo",
    latitude: 0.67,
    longitude: 23.47,
    elevation: -1900,
    terrainProfile: buildTerrainProfile(0.8, [
      { azCenter: 75,  width: 50, peakDeg: 1.0 },
      { azCenter: 260, width: 60, peakDeg: 0.8 },
    ], 7),
  },
  {
    id: "apollo-17",
    name: "Apollo 17 — Taurus‑Littrow Valley",
    shortName: "Apollo 17",
    description:
      "Dec 1972. A narrow valley flanked by the South and North Massifs — tall mountain walls create significant horizon blockage on two sides, demonstrating how terrain masks the sky.",
    category: "apollo",
    latitude: 20.19,
    longitude: 30.77,
    elevation: -2550,
    terrainProfile: buildTerrainProfile(1.5, [
      // South Massif
      { azCenter: 180, width: 35, peakDeg: 13 },
      { azCenter: 200, width: 25, peakDeg: 10 },
      // North Massif
      { azCenter: 0,   width: 30, peakDeg: 11 },
      { azCenter: 350, width: 25, peakDeg: 9 },
      // Open east‑west valley axis
      { azCenter: 90,  width: 40, peakDeg: 2 },
      { azCenter: 270, width: 40, peakDeg: 2 },
    ], 8),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Look up a curated site by its id. */
export function getSiteById(id: string): LandingSite | undefined {
  return CURATED_SITES.find((s) => s.id === id);
}

/** Create a custom site from user‑entered coordinates. */
export function createCustomSite(
  lat: number,
  lon: number,
  elevation: number,
  name?: string,
): LandingSite {
  // Normalise longitude to [0, 360)
  const normLon = ((lon % 360) + 360) % 360;
  const label = name ?? `Custom (${lat.toFixed(2)}°, ${normLon.toFixed(2)}°E)`;

  // Generate a generic terrain profile — moderate for higher latitudes, low for equatorial
  const absLat = Math.abs(lat);
  const base = absLat > 80 ? 3.0 : absLat > 60 ? 2.0 : 1.0;
  const profile = buildTerrainProfile(base, [
    { azCenter: 120, width: 45, peakDeg: base + 2 },
    { azCenter: 280, width: 40, peakDeg: base + 1.5 },
  ], lat * 100 + normLon);

  // For sites deep inside craters (very negative elevation), raise the horizon mask
  if (elevation < -1000) {
    const depthFactor = Math.min(20, Math.abs(elevation) / 250);
    for (let i = 0; i < 360; i++) {
      profile.horizonMask[i] += depthFactor;
    }
  }

  return {
    id: `custom-${Date.now()}`,
    name: label,
    shortName: label.length > 18 ? label.slice(0, 18) + "…" : label,
    description: "User‑defined landing site.",
    category: "custom",
    latitude: lat,
    longitude: normLon,
    elevation,
    terrainProfile: profile,
  };
}

/**
 * Return a copy of `site` shifted by the given km / m offsets.
 * 1° lat ≈ 30.3 km on the Moon (circumference / 360).
 * 1° lon ≈ 30.3 km × cos(lat).
 */
export function shiftSite(
  site: LandingSite,
  deltaLatKm: number,
  deltaLonKm: number,
  deltaElevM: number,
): LandingSite {
  const kmPerDeg = (2 * Math.PI * 1737.4) / 360; // ≈ 30.34 km/°
  const newLat = site.latitude + deltaLatKm / kmPerDeg;
  const cosLat = Math.cos((site.latitude * Math.PI) / 180);
  const newLon = site.longitude + (deltaLonKm / (kmPerDeg * Math.max(cosLat, 0.01)));
  const newElev = site.elevation + deltaElevM;

  return createCustomSite(
    newLat,
    newLon,
    newElev,
    `${site.shortName} shifted`,
  );
}

