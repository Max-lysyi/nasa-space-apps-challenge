// ── Astronomical & Physical Constants ──────────────────────────────────────────

/** Mean lunar radius in meters */
export const LUNAR_RADIUS_M = 1_737_400;

/** Mean lunar radius in kilometers */
export const LUNAR_RADIUS_KM = 1_737.4;

/** Synodic month – new Moon to new Moon (days) */
export const SYNODIC_PERIOD_DAYS = 29.530_589;

/** Anomalistic month – perigee to perigee (days) */
export const ANOMALISTIC_MONTH_DAYS = 27.554_5;

/** Draconic (nodical) month – node to node (days) */
export const DRACONIC_MONTH_DAYS = 27.212_2;

/** Sidereal month – star‑referenced (days) */
export const SIDEREAL_MONTH_DAYS = 27.321_661;

/** Moon's obliquity to the ecliptic plane (degrees) */
export const LUNAR_OBLIQUITY_DEG = 1.5424;

/** Maximum optical libration in longitude (degrees) */
export const LIBRATION_LON_AMPLITUDE_DEG = 7.9;

/** Maximum optical libration in latitude (degrees) */
export const LIBRATION_LAT_AMPLITUDE_DEG = 6.68;

/** Mean Earth–Moon distance (km) */
export const EARTH_MEAN_DISTANCE_KM = 384_400;

/** Mean Sun–Moon distance ≈ 1 AU (km) */
export const SUN_MEAN_DISTANCE_KM = 149_597_870.7;

/** Solar constant at 1 AU (W/m²) */
export const SOLAR_CONSTANT_W_M2 = 1_361;

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

/** Duration of one synodic period in hours (~708.7 h) */
export const HOURS_PER_LUNAR_CYCLE = SYNODIC_PERIOD_DAYS * 24;

/** J2000.0 epoch */
export const J2000_EPOCH = new Date("2000-01-01T12:00:00Z");

/** A known New Moon for phase reference – 2025‑01‑29 12:36 UTC */
export const REFERENCE_NEW_MOON = new Date("2025-01-29T12:36:00Z");

/** Milliseconds per day */
export const MS_PER_DAY = 86_400_000;

/** Milliseconds per hour */
export const MS_PER_HOUR = 3_600_000;

