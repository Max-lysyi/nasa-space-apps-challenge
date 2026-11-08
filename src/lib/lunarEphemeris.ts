// ── Lunar Ephemeris Calculation Engine ─────────────────────────────────────────
// Rigorous analytical engine for computing Sun & Earth positions relative to
// any point on the lunar surface, accounting for the Moon's obliquity,
// synodic period, optical libration, vacuum horizon, and local terrain masks.

import {
  LUNAR_RADIUS_M,
  SYNODIC_PERIOD_DAYS,
  ANOMALISTIC_MONTH_DAYS,
  DRACONIC_MONTH_DAYS,
  LUNAR_OBLIQUITY_DEG,
  LIBRATION_LON_AMPLITUDE_DEG,
  LIBRATION_LAT_AMPLITUDE_DEG,
  EARTH_MEAN_DISTANCE_KM,
  SUN_MEAN_DISTANCE_KM,
  DEG_TO_RAD,
  RAD_TO_DEG,
  HOURS_PER_LUNAR_CYCLE,
  REFERENCE_NEW_MOON,
  MS_PER_DAY,
  MS_PER_HOUR,
} from "./constants";

import type {
  LandingSite,
  CelestialPosition,
  EphemerisResult,
  LunarCycleMetrics,
  TimelinePoint,
  TimePeriod,
  MissionViability,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Days elapsed since reference New Moon */
function daysSinceNewMoon(date: Date): number {
  return (date.getTime() - REFERENCE_NEW_MOON.getTime()) / MS_PER_DAY;
}

/** Lunar phase angle [0, 360) in degrees — 0 = new Moon */
export function lunarPhase(date: Date): number {
  const d = daysSinceNewMoon(date);
  return ((d / SYNODIC_PERIOD_DAYS) * 360 + 3600000) % 360;
}

/** Normalise an angle to [0, 360) */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalise an angle to [-180, 180) */
function normPM180(deg: number): number {
  const a = ((deg % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

/** Clamp a value between min and max */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Sub-Solar Point ───────────────────────────────────────────────────────────
// The sub-solar longitude sweeps 360° per synodic period (29.53 d).
// The sub-solar latitude oscillates ±1.5424° with the draconic month (27.21 d).

function subSolarPoint(date: Date): { latDeg: number; lonDeg: number } {
  const d = daysSinceNewMoon(date);

  // Sub-solar longitude: at New Moon the Sun and Moon are on the same side,
  // so sub-solar lon ≈ 0°. It advances 360°/synodic period.
  const lonDeg = norm360((d / SYNODIC_PERIOD_DAYS) * 360);

  // Sub-solar latitude oscillates with the draconic period
  // Phase offset: at reference new Moon assume sub-solar lat ≈ 0 (ascending)
  const latDeg =
    LUNAR_OBLIQUITY_DEG * Math.sin((2 * Math.PI * d) / DRACONIC_MONTH_DAYS);

  return { latDeg, lonDeg };
}

// ── Libration ─────────────────────────────────────────────────────────────────

export function computeLibration(date: Date): {
  latDeg: number;
  lonDeg: number;
} {
  const d = daysSinceNewMoon(date);

  // Optical libration in longitude — anomalistic period
  // At perigee the Moon's orbital speed exceeds its rotational speed,
  // exposing extra longitude on the eastern limb.
  const lonDeg =
    LIBRATION_LON_AMPLITUDE_DEG *
    Math.sin((2 * Math.PI * d) / ANOMALISTIC_MONTH_DAYS + 0.3);

  // Optical libration in latitude — draconic period
  // The Moon's rotational axis is tilted relative to its orbital plane.
  const latDeg =
    LIBRATION_LAT_AMPLITUDE_DEG *
    Math.sin((2 * Math.PI * d) / DRACONIC_MONTH_DAYS + 0.8);

  return { latDeg, lonDeg };
}

// ── Sub-Earth Point ───────────────────────────────────────────────────────────
// The mean sub-Earth point is (0°, 0°) on the Moon (centre of the near side).
// Libration shifts it by ±7.9° lon and ±6.68° lat.

function subEarthPoint(date: Date): { latDeg: number; lonDeg: number } {
  const lib = computeLibration(date);
  return { latDeg: lib.latDeg, lonDeg: lib.lonDeg };
}

// ── Body Position from a Surface Site ─────────────────────────────────────────
// Given a sub-body point and an observer site, compute the azimuth & elevation
// of that body as seen from the site using spherical coordinate geometry.

function bodyPositionFromSite(
  subBodyLatDeg: number,
  subBodyLonDeg: number,
  siteLatDeg: number,
  siteLonDeg: number,
  distanceKm: number,
): CelestialPosition {
  const φ1 = siteLatDeg * DEG_TO_RAD;
  const φ2 = subBodyLatDeg * DEG_TO_RAD;
  const Δλ = normPM180(subBodyLonDeg - siteLonDeg) * DEG_TO_RAD;

  // Elevation: angular altitude above the local horizontal plane
  // sin(elev) = sin(φ1)*sin(φ2) + cos(φ1)*cos(φ2)*cos(Δλ)
  const sinElev =
    Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const elevRad = Math.asin(clamp(sinElev, -1, 1));

  // Azimuth: measured clockwise from north
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const azRad = Math.atan2(y, x);
  const azDeg = norm360(azRad * RAD_TO_DEG);

  return {
    azimuth: azDeg,
    elevation: elevRad * RAD_TO_DEG,
    distance: distanceKm,
  };
}

// ── Vacuum Horizon Dip ────────────────────────────────────────────────────────
// On a perfect sphere with no atmosphere the geometric horizon dips below the
// mathematical horizontal by arccos(R / (R + h)).

export function computeVacuumHorizonDip(elevationM: number): number {
  if (elevationM <= 0) return 0;
  const R = LUNAR_RADIUS_M;
  const cosAngle = R / (R + elevationM);
  return Math.acos(clamp(cosAngle, -1, 1)) * RAD_TO_DEG;
}

// ── Terrain Mask Lookup ───────────────────────────────────────────────────────
// Interpolated lookup into the 360-element horizon mask.

function terrainElevationAtAzimuth(
  site: LandingSite,
  azimuthDeg: number,
): number {
  const az = norm360(azimuthDeg);
  const idx = Math.floor(az);
  const frac = az - idx;
  const a = site.terrainProfile.horizonMask[idx % 360];
  const b = site.terrainProfile.horizonMask[(idx + 1) % 360];
  return a + frac * (b - a);
}

// ── Compute Solar Position ────────────────────────────────────────────────────

export function computeSolarPosition(
  date: Date,
  site: LandingSite,
): CelestialPosition {
  const ss = subSolarPoint(date);
  return bodyPositionFromSite(
    ss.latDeg,
    ss.lonDeg,
    site.latitude,
    site.longitude,
    SUN_MEAN_DISTANCE_KM,
  );
}

// ── Compute Earth Position ────────────────────────────────────────────────────

export function computeEarthPosition(
  date: Date,
  site: LandingSite,
): CelestialPosition {
  const se = subEarthPoint(date);
  return bodyPositionFromSite(
    se.latDeg,
    se.lonDeg,
    site.latitude,
    site.longitude,
    EARTH_MEAN_DISTANCE_KM,
  );
}

// ── Full Ephemeris Snapshot ────────────────────────────────────────────────────

export function computeEphemeris(
  date: Date,
  site: LandingSite,
): EphemerisResult {
  const sun = computeSolarPosition(date, site);
  const earth = computeEarthPosition(date, site);
  const lib = computeLibration(date);

  // Geometric horizon dip (negative means the geometric horizon is below the
  // mathematical horizontal – we subtract it from the terrain mask).
  const dip = computeVacuumHorizonDip(Math.max(0, site.elevation));

  // Effective terrain threshold at each body's azimuth
  const sunTerrainThreshold =
    terrainElevationAtAzimuth(site, sun.azimuth) - dip;
  const earthTerrainThreshold =
    terrainElevationAtAzimuth(site, earth.azimuth) - dip;

  const isSunVisible = sun.elevation > sunTerrainThreshold;
  const isEarthVisible = earth.elevation > earthTerrainThreshold;

  const solarPowerFactor = Math.sin(
    Math.max(0, sun.elevation) * DEG_TO_RAD,
  );

  // Compute timers by stepping forward
  const timeToSunset = isSunVisible
    ? findTimeUntilCrossing(date, site, "sun", "set")
    : null;
  const timeToSunrise = !isSunVisible
    ? findTimeUntilCrossing(date, site, "sun", "rise")
    : null;
  const timeToEarthset = isEarthVisible
    ? findTimeUntilCrossing(date, site, "earth", "set")
    : null;
  const timeToEarthrise = !isEarthVisible
    ? findTimeUntilCrossing(date, site, "earth", "rise")
    : null;

  return {
    timestamp: date,
    site,
    sun,
    earth,
    isSunVisible,
    isEarthVisible,
    solarElevationAngle: sun.elevation,
    earthElevationAngle: earth.elevation,
    solarPowerFactor,
    timeToSunset,
    timeToSunrise,
    timeToEarthset,
    timeToEarthrise,
    librationLat: lib.latDeg,
    librationLon: lib.lonDeg,
  };
}

// ── Time-until-crossing helper ────────────────────────────────────────────────
// Steps forward in 30-min increments then refines with bisection to find when
// a body crosses the terrain threshold (rise or set).

function isBodyAboveTerrain(
  date: Date,
  site: LandingSite,
  body: "sun" | "earth",
): boolean {
  const pos =
    body === "sun"
      ? computeSolarPosition(date, site)
      : computeEarthPosition(date, site);
  const dip = computeVacuumHorizonDip(Math.max(0, site.elevation));
  const threshold = terrainElevationAtAzimuth(site, pos.azimuth) - dip;
  return pos.elevation > threshold;
}

function findTimeUntilCrossing(
  startDate: Date,
  site: LandingSite,
  body: "sun" | "earth",
  direction: "rise" | "set",
): number | null {
  const startAbove = isBodyAboveTerrain(startDate, site, body);
  const lookingForSet = direction === "set";

  // We expect the body is currently above if looking for set, below if looking for rise
  if (lookingForSet !== startAbove) return null;

  const stepMs = 30 * 60 * 1000; // 30 minutes
  const maxSteps = Math.ceil((HOURS_PER_LUNAR_CYCLE * MS_PER_HOUR) / stepMs);

  let prevTime = startDate.getTime();
  for (let i = 1; i <= maxSteps; i++) {
    const t = startDate.getTime() + i * stepMs;
    const d = new Date(t);
    const above = isBodyAboveTerrain(d, site, body);

    if (lookingForSet && !above) {
      // Crossed down between prevTime and t — bisect
      return bisectCrossing(prevTime, t, site, body, lookingForSet, startDate);
    }
    if (!lookingForSet && above) {
      // Crossed up
      return bisectCrossing(prevTime, t, site, body, lookingForSet, startDate);
    }
    prevTime = t;
  }
  // Body never crosses within one full cycle
  return null;
}

function bisectCrossing(
  tLow: number,
  tHigh: number,
  site: LandingSite,
  body: "sun" | "earth",
  lookingForSet: boolean,
  refDate: Date,
): number {
  // 8 iterations of bisection ≈ 7-second precision
  for (let i = 0; i < 8; i++) {
    const tMid = (tLow + tHigh) / 2;
    const above = isBodyAboveTerrain(new Date(tMid), site, body);
    if (lookingForSet) {
      if (above) tLow = tMid;
      else tHigh = tMid;
    } else {
      if (!above) tLow = tMid;
      else tHigh = tMid;
    }
  }
  const crossingMs = (tLow + tHigh) / 2;
  return (crossingMs - refDate.getTime()) / MS_PER_HOUR;
}

// ── Timeline Computation ──────────────────────────────────────────────────────
// Samples ephemeris at regular intervals for plotting.

export function computeTimeline(
  startDate: Date,
  site: LandingSite,
  durationHours: number = HOURS_PER_LUNAR_CYCLE,
  stepHours: number = 1,
): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  const dip = computeVacuumHorizonDip(Math.max(0, site.elevation));
  const steps = Math.ceil(durationHours / stepHours);

  for (let i = 0; i <= steps; i++) {
    const hourOffset = i * stepHours;
    const t = new Date(startDate.getTime() + hourOffset * MS_PER_HOUR);
    const sun = computeSolarPosition(t, site);
    const earth = computeEarthPosition(t, site);

    const sunThreshold = terrainElevationAtAzimuth(site, sun.azimuth) - dip;
    const earthThreshold =
      terrainElevationAtAzimuth(site, earth.azimuth) - dip;

    points.push({
      timestamp: t,
      hourOffset,
      sunElevation: sun.elevation,
      earthElevation: earth.elevation,
      sunAzimuth: sun.azimuth,
      earthAzimuth: earth.azimuth,
      isSunVisible: sun.elevation > sunThreshold,
      isEarthVisible: earth.elevation > earthThreshold,
      powerFactor: Math.sin(Math.max(0, sun.elevation) * DEG_TO_RAD),
    });
  }

  return points;
}

// ── Lunar Cycle Metrics ───────────────────────────────────────────────────────

export function computeLunarCycleMetrics(
  startDate: Date,
  site: LandingSite,
): LunarCycleMetrics {
  const timeline = computeTimeline(startDate, site, HOURS_PER_LUNAR_CYCLE, 1);
  const totalHours = HOURS_PER_LUNAR_CYCLE;
  const stepH = 1;

  let sunlitHours = 0;
  let dteHours = 0;
  let combinedHours = 0;
  let sunElevSum = 0;
  let sunElevCount = 0;
  let powerSum = 0;
  let powerCount = 0;
  let maxSunElev = -90;
  let minSunElevDuringSunlit = 90;

  // Period tracking
  const sunlitPeriods: TimePeriod[] = [];
  const dtePeriods: TimePeriod[] = [];
  const combinedPeriods: TimePeriod[] = [];

  let sunlitStart: Date | null = null;
  let dteStart: Date | null = null;
  let combinedStart: Date | null = null;

  // Shadow / sunlit run tracking
  let currentShadowRun = 0;
  let longestShadow = 0;
  let currentSunlitRun = 0;
  let longestSunlit = 0;

  for (let i = 0; i < timeline.length; i++) {
    const pt = timeline[i];

    // Sunlit metrics
    if (pt.isSunVisible) {
      sunlitHours += stepH;
      sunElevSum += pt.sunElevation;
      sunElevCount++;
      powerSum += pt.powerFactor;
      powerCount++;
      currentSunlitRun += stepH;
      currentShadowRun = 0;
      if (pt.sunElevation > maxSunElev) maxSunElev = pt.sunElevation;
      if (pt.sunElevation < minSunElevDuringSunlit)
        minSunElevDuringSunlit = pt.sunElevation;

      if (!sunlitStart) sunlitStart = pt.timestamp;
    } else {
      currentShadowRun += stepH;
      currentSunlitRun = 0;
      if (sunlitStart) {
        sunlitPeriods.push({
          start: sunlitStart,
          end: timeline[i - 1]?.timestamp ?? pt.timestamp,
          durationHours:
            ((timeline[i - 1]?.timestamp ?? pt.timestamp).getTime() -
              sunlitStart.getTime()) /
            MS_PER_HOUR,
        });
        sunlitStart = null;
      }
    }
    if (currentShadowRun > longestShadow) longestShadow = currentShadowRun;
    if (currentSunlitRun > longestSunlit) longestSunlit = currentSunlitRun;

    // DTE metrics
    if (pt.isEarthVisible) {
      dteHours += stepH;
      if (!dteStart) dteStart = pt.timestamp;
    } else {
      if (dteStart) {
        dtePeriods.push({
          start: dteStart,
          end: timeline[i - 1]?.timestamp ?? pt.timestamp,
          durationHours:
            ((timeline[i - 1]?.timestamp ?? pt.timestamp).getTime() -
              dteStart.getTime()) /
            MS_PER_HOUR,
        });
        dteStart = null;
      }
    }

    // Combined
    if (pt.isSunVisible && pt.isEarthVisible) {
      combinedHours += stepH;
      if (!combinedStart) combinedStart = pt.timestamp;
    } else {
      if (combinedStart) {
        combinedPeriods.push({
          start: combinedStart,
          end: timeline[i - 1]?.timestamp ?? pt.timestamp,
          durationHours:
            ((timeline[i - 1]?.timestamp ?? pt.timestamp).getTime() -
              combinedStart.getTime()) /
            MS_PER_HOUR,
        });
        combinedStart = null;
      }
    }
  }

  // Close any open periods
  const lastPt = timeline[timeline.length - 1];
  if (sunlitStart && lastPt) {
    sunlitPeriods.push({
      start: sunlitStart,
      end: lastPt.timestamp,
      durationHours:
        (lastPt.timestamp.getTime() - sunlitStart.getTime()) / MS_PER_HOUR,
    });
  }
  if (dteStart && lastPt) {
    dtePeriods.push({
      start: dteStart,
      end: lastPt.timestamp,
      durationHours:
        (lastPt.timestamp.getTime() - dteStart.getTime()) / MS_PER_HOUR,
    });
  }
  if (combinedStart && lastPt) {
    combinedPeriods.push({
      start: combinedStart,
      end: lastPt.timestamp,
      durationHours:
        (lastPt.timestamp.getTime() - combinedStart.getTime()) / MS_PER_HOUR,
    });
  }

  return {
    sunlitHours,
    totalCycleHours: totalHours,
    sunlitPercentage: (sunlitHours / totalHours) * 100,
    longestShadowDuration: longestShadow,
    longestSunlitDuration: longestSunlit,
    averageSolarElevation: sunElevCount > 0 ? sunElevSum / sunElevCount : 0,
    averagePowerFactor: powerCount > 0 ? powerSum / powerCount : 0,
    dteWindowPercentage: (dteHours / totalHours) * 100,
    dteWindowHours: dteHours,
    combinedWindowPercentage: (combinedHours / totalHours) * 100,
    combinedWindowHours: combinedHours,
    maxSolarElevation: maxSunElev,
    minSolarElevation: sunElevCount > 0 ? minSunElevDuringSunlit : 0,
    sunlitPeriods,
    dtePeriods,
    combinedPeriods,
  };
}

// ── Mission Viability Assessment ──────────────────────────────────────────────

export function computeMissionViability(
  metrics: LunarCycleMetrics,
): MissionViability {
  const details: string[] = [];

  // Power score: based on sunlit percentage and average power factor
  let powerScore = 0;
  if (metrics.sunlitPercentage >= 80) {
    powerScore = 90 + (metrics.sunlitPercentage - 80);
    details.push(
      `Excellent solar availability: ${metrics.sunlitPercentage.toFixed(1)}% sunlit`,
    );
  } else if (metrics.sunlitPercentage >= 50) {
    powerScore = 50 + ((metrics.sunlitPercentage - 50) / 30) * 40;
    details.push(
      `Adequate solar availability: ${metrics.sunlitPercentage.toFixed(1)}% sunlit`,
    );
  } else if (metrics.sunlitPercentage >= 20) {
    powerScore = 20 + ((metrics.sunlitPercentage - 20) / 30) * 30;
    details.push(
      `Limited solar availability: ${metrics.sunlitPercentage.toFixed(1)}% sunlit — battery reserves critical`,
    );
  } else {
    powerScore = (metrics.sunlitPercentage / 20) * 20;
    details.push(
      `Minimal solar power: ${metrics.sunlitPercentage.toFixed(1)}% — mission requires RTG or stored power`,
    );
  }

  // Boost/penalise by power factor quality
  powerScore = clamp(powerScore * (0.5 + 0.5 * metrics.averagePowerFactor), 0, 100);

  // Communication score
  let communicationScore = 0;
  if (metrics.dteWindowPercentage >= 70) {
    communicationScore = 85 + (metrics.dteWindowPercentage - 70) * 0.5;
    details.push(
      `Strong DTE windows: ${metrics.dteWindowPercentage.toFixed(1)}% Earth visibility`,
    );
  } else if (metrics.dteWindowPercentage >= 40) {
    communicationScore = 40 + ((metrics.dteWindowPercentage - 40) / 30) * 45;
    details.push(
      `Moderate DTE windows: ${metrics.dteWindowPercentage.toFixed(1)}% — plan data uplinks carefully`,
    );
  } else if (metrics.dteWindowPercentage >= 10) {
    communicationScore = 10 + ((metrics.dteWindowPercentage - 10) / 30) * 30;
    details.push(
      `Limited DTE windows: ${metrics.dteWindowPercentage.toFixed(1)}% — consider relay satellite`,
    );
  } else {
    communicationScore = metrics.dteWindowPercentage;
    details.push(
      `Critical: ${metrics.dteWindowPercentage.toFixed(1)}% Earth visibility — relay satellite required`,
    );
  }

  // Thermal score: based on longest shadow (survival)
  let thermalScore = 100;
  if (metrics.longestShadowDuration > 200) {
    thermalScore = 10;
    details.push(
      `Extreme thermal challenge: ${metrics.longestShadowDuration.toFixed(0)}h longest shadow — heaters essential`,
    );
  } else if (metrics.longestShadowDuration > 100) {
    thermalScore = 40;
    details.push(
      `Significant shadow period: ${metrics.longestShadowDuration.toFixed(0)}h — thermal management critical`,
    );
  } else if (metrics.longestShadowDuration > 24) {
    thermalScore = 70;
    details.push(
      `Moderate shadow: ${metrics.longestShadowDuration.toFixed(0)}h longest dark period`,
    );
  } else if (metrics.longestShadowDuration > 0) {
    thermalScore = 90;
    details.push(
      `Brief shadows: ${metrics.longestShadowDuration.toFixed(1)}h max — manageable thermal environment`,
    );
  } else {
    details.push("Near-continuous illumination — excellent thermal conditions");
  }

  const overallScore = Math.round(
    powerScore * 0.4 + communicationScore * 0.35 + thermalScore * 0.25,
  );

  let assessment: MissionViability["assessment"];
  if (overallScore >= 75) assessment = "Excellent";
  else if (overallScore >= 50) assessment = "Good";
  else if (overallScore >= 30) assessment = "Marginal";
  else assessment = "Critical";

  return {
    overallScore: clamp(Math.round(overallScore), 0, 100),
    powerScore: clamp(Math.round(powerScore), 0, 100),
    communicationScore: clamp(Math.round(communicationScore), 0, 100),
    thermalScore: clamp(Math.round(thermalScore), 0, 100),
    assessment,
    details,
  };
}

