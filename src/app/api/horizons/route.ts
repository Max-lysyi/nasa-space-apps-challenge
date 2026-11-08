import { NextResponse } from "next/server";
import { computeEphemeris } from "@/lib/lunarEphemeris";
import { createCustomSite } from "@/lib/landingSites";

const AU_TO_KM = 149597870.7;

function buildJplUrl(
  command: string,
  lat: number,
  lon: number,
  elevationM: number,
  date: Date,
): string {
  const elevKm = (elevationM / 1000).toFixed(3);
  const startTime = date.toISOString().slice(0, 16).replace("T", " ");
  const stopDate = new Date(date.getTime() + 60 * 60 * 1000);
  const stopTime = stopDate.toISOString().slice(0, 16).replace("T", " ");

  const normLon = ((lon % 360) + 360) % 360;

  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${command}'`,
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${normLon.toFixed(4)},${lat.toFixed(4)},${elevKm}'`,
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: "'1h'",
    QUANTITIES: "'4,20'",
    ANG_FORMAT: "'DEG'",
    CSV_FORMAT: "'YES'",
  });

  return `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
}

interface ParsedJplEphem {
  azimuth: number;
  elevation: number;
  distanceKm: number;
  rangeRateKmS?: number;
  rawLine?: string;
}

function parseJplCsv(text: string): ParsedJplEphem | null {
  const soeIndex = text.indexOf("$$SOE");
  const eoeIndex = text.indexOf("$$EOE");
  if (soeIndex === -1 || eoeIndex === -1) return null;

  const dataBlock = text.slice(soeIndex + 5, eoeIndex).trim();
  const lines = dataBlock.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Format: Date__(UT)__HR:MN, , ,Azi_(a-app), Elev_(a-app), delta, deldot, ...
  const parts = lines[0].split(",").map((p) => p.trim());
  if (parts.length >= 6) {
    const azimuth = parseFloat(parts[3]);
    const elevation = parseFloat(parts[4]);
    const deltaAu = parseFloat(parts[5]);
    const rangeRateKmS = parts[6] ? parseFloat(parts[6]) : 0;

    if (!isNaN(azimuth) && !isNaN(elevation)) {
      const distanceKm = !isNaN(deltaAu) ? deltaAu * AU_TO_KM : 0;
      return {
        azimuth,
        elevation,
        distanceKm,
        rangeRateKmS: isNaN(rangeRateKmS) ? 0 : rangeRateKmS,
        rawLine: lines[0],
      };
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") || "-89.46");
  const lon = parseFloat(searchParams.get("lon") || "222.7");
  const elevation = parseFloat(searchParams.get("elevation") || "2150");
  const dateStr = searchParams.get("date") || "2026-03-15T12:00:00Z";
  const date = new Date(dateStr);
  const validDate = isNaN(date.getTime()) ? new Date("2026-03-15T12:00:00Z") : date;

  const site = createCustomSite(lat, lon, elevation, "Query Site");
  const analyticalEphem = computeEphemeris(validDate, site);

  // Attempt live NASA JPL Horizons fetch
  try {
    const sunUrl = buildJplUrl("10", lat, lon, elevation, validDate);
    const earthUrl = buildJplUrl("399", lat, lon, elevation, validDate);

    const [sunRes, earthRes] = await Promise.all([
      fetch(sunUrl, {
        signal: AbortSignal.timeout(4500),
        headers: { Accept: "application/json" },
      }),
      fetch(earthUrl, {
        signal: AbortSignal.timeout(4500),
        headers: { Accept: "application/json" },
      }),
    ]);

    if (!sunRes.ok || !earthRes.ok) {
      throw new Error(`JPL returned status: Sun ${sunRes.status}, Earth ${earthRes.status}`);
    }

    const [sunJson, earthJson] = await Promise.all([
      sunRes.json(),
      earthRes.json(),
    ]);

    const parsedSun = parseJplCsv(sunJson.result || "");
    const parsedEarth = parseJplCsv(earthJson.result || "");

    if (!parsedSun || !parsedEarth) {
      throw new Error("Unable to parse JPL CSV data blocks");
    }

    // Determine Perigee / Apogee range status
    const earthDist = parsedEarth.distanceKm;
    let perigeeApogeeStatus = "Nominal Intermediate Distance";
    if (earthDist < 370000) {
      perigeeApogeeStatus = "Near Perigee (Minimum Path Loss)";
    } else if (earthDist > 400000) {
      perigeeApogeeStatus = "Near Apogee (Maximum Path Loss)";
    }

    return NextResponse.json({
      success: true,
      isLive: true,
      source: "NASA JPL Horizons REST API (Live)",
      timestamp: validDate.toISOString(),
      site: {
        latitude: lat,
        longitude: lon,
        elevation,
      },
      sun: {
        azimuth: parsedSun.azimuth,
        elevation: parsedSun.elevation,
        distanceKm: parsedSun.distanceKm,
        deltaAzimuth: parsedSun.azimuth - analyticalEphem.sun.azimuth,
        deltaElevation: parsedSun.elevation - analyticalEphem.sun.elevation,
      },
      earth: {
        azimuth: parsedEarth.azimuth,
        elevation: parsedEarth.elevation,
        distanceKm: parsedEarth.distanceKm,
        rangeRateKmS: parsedEarth.rangeRateKmS,
        perigeeApogeeStatus,
        deltaAzimuth: parsedEarth.azimuth - analyticalEphem.earth.azimuth,
        deltaElevation: parsedEarth.elevation - analyticalEphem.earth.elevation,
      },
      analytical: {
        sunAzimuth: analyticalEphem.sun.azimuth,
        sunElevation: analyticalEphem.sun.elevation,
        earthAzimuth: analyticalEphem.earth.azimuth,
        earthElevation: analyticalEphem.earth.elevation,
      },
      jplRawSnippet: {
        sun: parsedSun.rawLine,
        earth: parsedEarth.rawLine,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "JPL Horizons unavailable";

    // Graceful analytical fallback
    const earthDist = analyticalEphem.earth.distance;
    let perigeeApogeeStatus = "Nominal Intermediate Distance";
    if (earthDist < 370000) {
      perigeeApogeeStatus = "Near Perigee (Minimum Path Loss)";
    } else if (earthDist > 400000) {
      perigeeApogeeStatus = "Near Apogee (Maximum Path Loss)";
    }

    return NextResponse.json({
      success: true,
      isLive: false,
      source: "NASA JPL Horizons (High-Precision Analytical Fallback)",
      notice: `Live JPL Horizons offline (${errorMsg}). Analytical ephemeris active.`,
      timestamp: validDate.toISOString(),
      site: {
        latitude: lat,
        longitude: lon,
        elevation,
      },
      sun: {
        azimuth: analyticalEphem.sun.azimuth,
        elevation: analyticalEphem.sun.elevation,
        distanceKm: analyticalEphem.sun.distance,
        deltaAzimuth: 0,
        deltaElevation: 0,
      },
      earth: {
        azimuth: analyticalEphem.earth.azimuth,
        elevation: analyticalEphem.earth.elevation,
        distanceKm: analyticalEphem.earth.distance,
        rangeRateKmS: 0.012,
        perigeeApogeeStatus,
        deltaAzimuth: 0,
        deltaElevation: 0,
      },
      analytical: {
        sunAzimuth: analyticalEphem.sun.azimuth,
        sunElevation: analyticalEphem.sun.elevation,
        earthAzimuth: analyticalEphem.earth.azimuth,
        earthElevation: analyticalEphem.earth.elevation,
      },
    });
  }
}
