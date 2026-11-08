"use client";

import { useRef, useEffect, useCallback } from "react";
import type { LandingSite, EphemerisResult } from "@/lib/types";
import { CURATED_SITES } from "@/lib/landingSites";

interface RegionalMap2DProps {
  selectedSite: LandingSite;
  onSiteChange: (site: LandingSite) => void;
  ephemeris: EphemerisResult;
}

export function RegionalMap2D({
  selectedSite,
  onSiteChange,
  ephemeris,
}: RegionalMap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine map bounds based on selected site region
  const getMapBounds = useCallback(() => {
    const lat = selectedSite.latitude;
    // South pole region vs. equatorial
    if (lat < -60) {
      return { latMin: -92, latMax: -65, lonMin: -30, lonMax: 390 };
    }
    return {
      latMin: lat - 15,
      latMax: lat + 15,
      lonMin: selectedSite.longitude - 40,
      lonMax: selectedSite.longitude + 40,
    };
  }, [selectedSite]);

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
    const pad = 8;
    const plotW = W - 2 * pad;
    const plotH = H - 2 * pad - 16;

    const bounds = getMapBounds();

    function latToY(lat: number): number {
      return (
        pad +
        16 +
        (1 - (lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * plotH
      );
    }
    function lonToX(lon: number): number {
      let normLon = lon;
      if (normLon < bounds.lonMin) normLon += 360;
      return (
        pad + ((normLon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * plotW
      );
    }

    // Background
    ctx.fillStyle = "rgba(3, 5, 8, 0.6)";
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("REGIONAL MAP", pad, 12);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    const latStep = (bounds.latMax - bounds.latMin) / 6;
    for (let lat = bounds.latMin; lat <= bounds.latMax; lat += latStep) {
      const y = latToY(lat);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W - pad, y);
      ctx.stroke();
    }

    // Topographic contour-like features (simulated elevation shading)
    const isSouthPole = selectedSite.latitude < -60;
    if (isSouthPole) {
      // Draw approximate crater outlines for south pole
      const craterData = [
        { lat: -89.9, lon: 0, r: 10, label: "Shackleton" },
        { lat: -87.5, lon: 355, r: 14, label: "Haworth" },
        { lat: -87.3, lon: 315, r: 13, label: "Shoemaker" },
        { lat: -85.5, lon: 30, r: 12, label: "Nobile" },
      ];

      for (const c of craterData) {
        const cx = lonToX(c.lon);
        const cy = latToY(c.lat);
        const rx = (c.r / (bounds.lonMax - bounds.lonMin)) * plotW;
        const ry = (c.r / (bounds.latMax - bounds.latMin)) * plotH;

        // Crater rim
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Crater interior (darker)
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fill();

        // Label
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "7px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(c.label, cx, cy + ry + 8);
      }
    }

    // Plot curated sites
    for (const site of CURATED_SITES) {
      if (
        site.latitude < bounds.latMin ||
        site.latitude > bounds.latMax
      ) {
        continue;
      }

      const x = lonToX(site.longitude);
      const y = latToY(site.latitude);

      // Check if within plot area
      if (x < pad || x > W - pad || y < pad + 16 || y > H - pad) continue;

      const isSelected = site.id === selectedSite.id;

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? "rgba(239, 68, 68, 0.9)"
        : "rgba(255, 255, 255, 0.4)";
      ctx.fill();

      if (isSelected) {
        // Selection ring
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = isSelected
        ? "rgba(255,255,255,0.8)"
        : "rgba(255,255,255,0.3)";
      ctx.font = `${isSelected ? "bold " : ""}8px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(site.shortName, x + 8, y + 3);
    }

    // Sun direction arrow on the map
    if (ephemeris.isSunVisible) {
      const azRad = (ephemeris.sun.azimuth * Math.PI) / 180;
      const cx = lonToX(selectedSite.longitude);
      const cy = latToY(selectedSite.latitude);
      const arrowLen = 18;
      const dx = Math.sin(azRad) * arrowLen;
      const dy = -Math.cos(azRad) * arrowLen;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
      ctx.fill();
    }

    // Scale bar
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "7px monospace";
    ctx.textAlign = "right";
    const latRange = bounds.latMax - bounds.latMin;
    const kmRange = Math.round(latRange * 30.34);
    ctx.fillText(`~${kmRange} km range`, W - pad, H - 2);
  }, [selectedSite, ephemeris, getMapBounds]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // Handle click to select nearest site
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const bounds = getMapBounds();
      const pad = 8;
      const plotW = rect.width - 2 * pad;
      const plotH = rect.height - 2 * pad - 16;

      // Convert click to lat/lon
      const clickLon =
        bounds.lonMin + ((x - pad) / plotW) * (bounds.lonMax - bounds.lonMin);
      const clickLat =
        bounds.latMax - ((y - pad - 16) / plotH) * (bounds.latMax - bounds.latMin);

      // Find nearest site
      let bestDist = Infinity;
      let bestSite: LandingSite | null = null;
      for (const site of CURATED_SITES) {
        const dLat = site.latitude - clickLat;
        const dLon = site.longitude - clickLon;
        const dist = dLat * dLat + dLon * dLon;
        if (dist < bestDist) {
          bestDist = dist;
          bestSite = site;
        }
      }
      if (bestSite && bestDist < 100) {
        onSiteChange(bestSite);
      }
    },
    [onSiteChange, getMapBounds],
  );

  return (
    <div className="relative w-full h-full cursor-crosshair rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ display: "block" }}
        onClick={handleClick}
      />
    </div>
  );
}

