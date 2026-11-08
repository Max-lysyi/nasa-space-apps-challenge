"use client";

import { useRef, useEffect, useCallback } from "react";
import type {
  LandingSite,
  EphemerisResult,
  TimelinePoint,
  SkillLevel,
} from "@/lib/types";

interface HorizonSkyViewProps {
  site: LandingSite;
  ephemeris: EphemerisResult;
  date?: Date;
  timeline: TimelinePoint[];
  skillLevel: SkillLevel;
}

export function HorizonSkyView({
  site,
  ephemeris,
  timeline,
  skillLevel,
}: HorizonSkyViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padL = 36;
    const padR = 12;
    const padT = 28;
    const padB = 24;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Axis ranges
    const azMin = 0;
    const azMax = 360;
    const elevMin = -15;
    const elevMax = 45;
    const elevRange = elevMax - elevMin;

    function azToX(az: number): number {
      return padL + ((az - azMin) / (azMax - azMin)) * plotW;
    }
    function elevToY(elev: number): number {
      return padT + (1 - (elev - elevMin) / elevRange) * plotH;
    }

    // Background
    ctx.fillStyle = "rgba(3, 5, 8, 0.6)";
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("360° HORIZON & SKY VIEW", padL, 14);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;

    // Elevation grid lines
    for (let e = elevMin; e <= elevMax; e += 5) {
      const y = elevToY(e);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${e}°`, padL - 4, y + 3);
    }

    // Azimuth grid lines + labels
    const azLabels = [
      { az: 0, label: "N" },
      { az: 45, label: "NE" },
      { az: 90, label: "E" },
      { az: 135, label: "SE" },
      { az: 180, label: "S" },
      { az: 225, label: "SW" },
      { az: 270, label: "W" },
      { az: 315, label: "NW" },
      { az: 360, label: "N" },
    ];
    for (const { az, label } of azLabels) {
      const x = azToX(az);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, H - padB);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, H - padB + 12);
    }

    // 0° reference line (geometric vacuum horizon)
    const y0 = elevToY(0);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y0);
    ctx.lineTo(W - padR, y0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("vacuum horizon", W - padR, y0 - 3);

    // Terrain silhouette fill
    ctx.beginPath();
    ctx.moveTo(azToX(0), H - padB);
    for (let az = 0; az <= 360; az++) {
      const maskElev = site.terrainProfile.horizonMask[az % 360];
      ctx.lineTo(azToX(az), elevToY(maskElev));
    }
    ctx.lineTo(azToX(360), H - padB);
    ctx.closePath();
    ctx.fillStyle = "rgba(42, 45, 52, 0.8)";
    ctx.fill();

    // Terrain silhouette outline
    ctx.beginPath();
    for (let az = 0; az <= 360; az++) {
      const maskElev = site.terrainProfile.horizonMask[az % 360];
      const x = azToX(az);
      const y = elevToY(maskElev);
      if (az === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sun trajectory over lunar cycle
    ctx.beginPath();
    let first = true;
    for (const pt of timeline) {
      const x = azToX(pt.sunAzimuth);
      const y = elevToY(pt.sunElevation);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Earth trajectory (wobble loop)
    ctx.beginPath();
    first = true;
    for (const pt of timeline) {
      const x = azToX(pt.earthAzimuth);
      const y = elevToY(pt.earthElevation);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Current Sun position
    const sunX = azToX(ephemeris.sun.azimuth);
    const sunY = elevToY(ephemeris.sun.elevation);

    ctx.beginPath();
    ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
    ctx.fillStyle = ephemeris.isSunVisible
      ? "rgba(245, 158, 11, 0.9)"
      : "rgba(245, 158, 11, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sun glow
    if (ephemeris.isSunVisible) {
      ctx.beginPath();
      ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.1)";
      ctx.fill();
    }

    // Sun label
    ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
    ctx.font = "bold 8px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("☀", sunX, sunY - 12);
    if (skillLevel === "planner") {
      ctx.font = "8px monospace";
      ctx.fillText(
        `${ephemeris.sun.elevation.toFixed(1)}°`,
        sunX,
        sunY + 18,
      );
    }

    // Current Earth position
    const earthX = azToX(ephemeris.earth.azimuth);
    const earthY = elevToY(ephemeris.earth.elevation);

    ctx.beginPath();
    ctx.arc(earthX, earthY, 6, 0, Math.PI * 2);
    ctx.fillStyle = ephemeris.isEarthVisible
      ? "rgba(59, 130, 246, 0.9)"
      : "rgba(59, 130, 246, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Earth label
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    ctx.font = "bold 8px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌍", earthX, earthY - 10);
    if (skillLevel === "planner") {
      ctx.font = "8px monospace";
      ctx.fillText(
        `${ephemeris.earth.elevation.toFixed(1)}°`,
        earthX,
        earthY + 16,
      );
    }
  }, [site, ephemeris, timeline, skillLevel]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden p-4 md:p-5">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ display: "block" }}
      />
    </div>
  );
}

