// ── Shared Type Definitions ────────────────────────────────────────────────────

/** 360‑element array: horizon‑mask elevation (degrees) at each integer azimuth */
export interface TerrainProfile {
  horizonMask: number[]; // length 360
}

/** A lunar landing site */
export interface LandingSite {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: "artemis" | "clps" | "apollo" | "international" | "custom";
  latitude: number;   // degrees; negative = south
  longitude: number;  // degrees east [0, 360)
  elevation: number;  // metres relative to mean lunar radius 1 737.4 km
  terrainProfile: TerrainProfile;
}

/** Azimuth / elevation of a celestial body seen from a site */
export interface CelestialPosition {
  azimuth: number;    // degrees 0‑360, 0 = north, 90 = east
  elevation: number;  // degrees above the geometric (vacuum) horizon
  distance: number;   // km
}

/** Full ephemeris snapshot for one site × one instant */
export interface EphemerisResult {
  timestamp: Date;
  site: LandingSite;
  sun: CelestialPosition;
  earth: CelestialPosition;
  isSunVisible: boolean;
  isEarthVisible: boolean;
  solarElevationAngle: number;
  earthElevationAngle: number;
  solarPowerFactor: number;      // sin(max(0, sunElev°→rad))
  timeToSunset: number | null;   // hours
  timeToSunrise: number | null;
  timeToEarthset: number | null;
  timeToEarthrise: number | null;
  librationLat: number;          // degrees
  librationLon: number;          // degrees
}

/** A contiguous period of time */
export interface TimePeriod {
  start: Date;
  end: Date;
  durationHours: number;
}

/** Aggregated metrics over one full synodic cycle */
export interface LunarCycleMetrics {
  sunlitHours: number;
  totalCycleHours: number;
  sunlitPercentage: number;
  longestShadowDuration: number;
  longestSunlitDuration: number;
  averageSolarElevation: number;
  averagePowerFactor: number;
  dteWindowPercentage: number;
  dteWindowHours: number;
  combinedWindowPercentage: number;
  combinedWindowHours: number;
  maxSolarElevation: number;
  minSolarElevation: number;
  sunlitPeriods: TimePeriod[];
  dtePeriods: TimePeriod[];
  combinedPeriods: TimePeriod[];
}

/** One sample along a time series */
export interface TimelinePoint {
  timestamp: Date;
  hourOffset: number;
  sunElevation: number;
  earthElevation: number;
  sunAzimuth: number;
  earthAzimuth: number;
  isSunVisible: boolean;
  isEarthVisible: boolean;
  powerFactor: number;
}

/** A user‑created scenario (Site + Date → metrics) */
export interface Scenario {
  id: string;
  label: string;
  site: LandingSite;
  startDate: Date;
  metrics: LunarCycleMetrics;
  timeline: TimelinePoint[];
  ephemeris: EphemerisResult;
}

/** High‑level mission feasibility assessment */
export interface MissionViability {
  overallScore: number;
  powerScore: number;
  communicationScore: number;
  thermalScore: number;
  assessment: "Excellent" | "Good" | "Marginal" | "Critical";
  details: string[];
}

export type SkillLevel = "planner" | "educator";
export type PlaybackSpeed = "1h" | "24h" | "cycle";
export type ViewMode = "orbital" | "surface" | "globe";
export type SolarArrayType = "vertical" | "horizontal";

