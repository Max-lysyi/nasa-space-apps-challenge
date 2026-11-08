"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Clock,
  Sun,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import type { LandingSite, SkillLevel, LunarCycleMetrics, MissionViability } from "@/lib/types";
import { CURATED_SITES, shiftSite } from "@/lib/landingSites";
import {
  computeLunarCycleMetrics,
  computeMissionViability,
  computeTimeline,
} from "@/lib/lunarEphemeris";
import { HOURS_PER_LUNAR_CYCLE, MS_PER_DAY } from "@/lib/constants";

interface ScenarioComparisonProps {
  siteA: LandingSite;
  dateA: Date;
  skillLevel: SkillLevel;
}

interface ScenarioData {
  site: LandingSite;
  date: Date;
  metrics: LunarCycleMetrics;
  viability: MissionViability;
}

function MetricBar({
  label,
  valueA,
  valueB,
  unit,
  color,
  max,
}: {
  label: string;
  valueA: number;
  valueB: number;
  unit: string;
  color: string;
  max: number;
}) {
  const pctA = Math.min(100, (valueA / max) * 100);
  const pctB = Math.min(100, (valueB / max) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{label}</span>
        <span>
          {valueA.toFixed(1)}
          {unit} vs {valueB.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctA}%`,
              background: color,
              opacity: 0.8,
            }}
          />
        </div>
        <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctB}%`,
              background: color,
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ViabilityBadge({ viability }: { viability: MissionViability }) {
  const colorMap = {
    Excellent: "text-accent-emerald bg-accent-emerald/10 border-accent-emerald/30",
    Good: "text-accent-blue bg-accent-blue/10 border-accent-blue/30",
    Marginal: "text-accent-gold bg-accent-gold/10 border-accent-gold/30",
    Critical: "text-accent-red bg-accent-red/10 border-accent-red/30",
  };
  const iconMap = {
    Excellent: <CheckCircle2 className="w-3.5 h-3.5" />,
    Good: <CheckCircle2 className="w-3.5 h-3.5" />,
    Marginal: <AlertTriangle className="w-3.5 h-3.5" />,
    Critical: <XCircle className="w-3.5 h-3.5" />,
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[viability.assessment]}`}
    >
      {iconMap[viability.assessment]}
      {viability.assessment} ({viability.overallScore}/100)
    </div>
  );
}

function ScenarioHorizonMini({
  site,
  date,
}: {
  site: LandingSite;
  date: Date;
}) {
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
    const timeline = computeTimeline(date, site, HOURS_PER_LUNAR_CYCLE, 2);

    // Draw sunlit/shadow timeline bar
    const barH = 8;
    const barY = H - barH;
    for (let i = 0; i < timeline.length; i++) {
      const x = (i / timeline.length) * W;
      const w = Math.max(1, W / timeline.length);
      if (timeline[i].isSunVisible) {
        ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + timeline[i].powerFactor * 0.5})`;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.03)";
      }
      ctx.fillRect(x, barY, w, barH);
    }

    // Draw DTE bar
    const dteBarY = barY - barH - 2;
    for (let i = 0; i < timeline.length; i++) {
      const x = (i / timeline.length) * W;
      const w = Math.max(1, W / timeline.length);
      ctx.fillStyle = timeline[i].isEarthVisible
        ? "rgba(59, 130, 246, 0.5)"
        : "rgba(255,255,255,0.03)";
      ctx.fillRect(x, dteBarY, w, barH);
    }

    // Draw mini horizon
    const plotH = H - 2 * barH - 8;
    const elevMin = -5;
    const elevMax = 30;
    const elevRange = elevMax - elevMin;

    // Terrain silhouette
    ctx.beginPath();
    ctx.moveTo(0, plotH);
    for (let az = 0; az <= 360; az++) {
      const x = (az / 360) * W;
      const maskElev = site.terrainProfile.horizonMask[az % 360];
      const y = (1 - (maskElev - elevMin) / elevRange) * plotH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(42, 45, 52, 0.6)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [site, date]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-lg"
      style={{ display: "block" }}
    />
  );
}

export function ScenarioComparison({
  siteA: initialSiteA,
  dateA: initialDateA,
  skillLevel,
}: ScenarioComparisonProps) {
  const [siteA, setSiteA] = useState(initialSiteA);
  const [dateA, setDateA] = useState(initialDateA);
  const [siteB, setSiteB] = useState(CURATED_SITES[1]);
  const [dateB, setDateB] = useState(initialDateA);

  const [prevInitial, setPrevInitial] = useState({
    site: initialSiteA,
    date: initialDateA,
  });
  if (
    prevInitial.site.id !== initialSiteA.id ||
    prevInitial.date.getTime() !== initialDateA.getTime()
  ) {
    setPrevInitial({ site: initialSiteA, date: initialDateA });
    setSiteA(initialSiteA);
    setDateA(initialDateA);
  }

  const scenarioA: ScenarioData = useMemo(() => {
    const metrics = computeLunarCycleMetrics(dateA, siteA);
    return { site: siteA, date: dateA, metrics, viability: computeMissionViability(metrics) };
  }, [siteA, dateA]);

  const scenarioB: ScenarioData = useMemo(() => {
    const metrics = computeLunarCycleMetrics(dateB, siteB);
    return { site: siteB, date: dateB, metrics, viability: computeMissionViability(metrics) };
  }, [siteB, dateB]);

  const quickShift = (type: string) => {
    switch (type) {
      case "+7d":
        setDateB(new Date(dateA.getTime() + 7 * MS_PER_DAY));
        setSiteB(siteA);
        break;
      case "+14d":
        setDateB(new Date(dateA.getTime() + 14 * MS_PER_DAY));
        setSiteB(siteA);
        break;
      case "crater":
        setSiteB(shiftSite(siteA, 0.5, 0, -800));
        setDateB(dateA);
        break;
      case "ridge":
        setSiteB(shiftSite(siteA, -0.3, 0.2, 400));
        setDateB(dateA);
        break;
    }
  };

  const exportData = () => {
    const data = {
      scenarioA: {
        site: { name: scenarioA.site.name, lat: scenarioA.site.latitude, lon: scenarioA.site.longitude, elev: scenarioA.site.elevation },
        date: scenarioA.date.toISOString(),
        metrics: scenarioA.metrics,
        viability: scenarioA.viability,
      },
      scenarioB: {
        site: { name: scenarioB.site.name, lat: scenarioB.site.latitude, lon: scenarioB.site.longitude, elev: scenarioB.site.elevation },
        date: scenarioB.date.toISOString(),
        metrics: scenarioB.metrics,
        viability: scenarioB.viability,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-16 pb-28 px-6 max-w-[1600px] mx-auto">
      {/* Quick shift buttons */}
      <div className="glass-panel rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-text-muted font-medium">Quick comparison:</span>
        <button onClick={() => quickShift("+7d")} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-text-secondary">
          +7 Day Delay
        </button>
        <button onClick={() => quickShift("+14d")} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-text-secondary">
          +14 Day Delay
        </button>
        <button onClick={() => quickShift("crater")} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-text-secondary">
          500m into Crater
        </button>
        <button onClick={() => quickShift("ridge")} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-text-secondary">
          Shift to Higher Ridge
        </button>

        <div className="flex-1" />

        {skillLevel === "planner" && (
          <button onClick={exportData} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-text-secondary flex items-center gap-1.5">
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        )}
      </div>

      {/* Side-by-Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Scenario A */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent-gold">SCENARIO A</h3>
            <ViabilityBadge viability={scenarioA.viability} />
          </div>

          {/* Site selector for A */}
          <select
            value={siteA.id}
            onChange={(e) => {
              const s = CURATED_SITES.find((s) => s.id === e.target.value);
              if (s) setSiteA(s);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
          >
            {CURATED_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="text-[10px] text-text-muted font-mono">
            {siteA.latitude.toFixed(2)}°{siteA.latitude >= 0 ? "N" : "S"},{" "}
            {siteA.longitude.toFixed(1)}°E · Date: {dateA.toISOString().slice(0, 10)}
          </div>

          <ScenarioHorizonMini site={siteA} date={dateA} />

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Sun className="w-3.5 h-3.5 text-accent-gold" />
              <span className="text-text-secondary">Sunlit:</span>
              <span className="font-mono text-white">
                {scenarioA.metrics.sunlitPercentage.toFixed(1)}%
              </span>
              <span className="text-text-muted">
                ({scenarioA.metrics.sunlitHours.toFixed(0)}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-text-secondary">DTE:</span>
              <span className="font-mono text-white">
                {scenarioA.metrics.dteWindowPercentage.toFixed(1)}%
              </span>
              <span className="text-text-muted">
                ({scenarioA.metrics.dteWindowHours.toFixed(0)}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-accent-emerald" />
              <span className="text-text-secondary">Combined:</span>
              <span className="font-mono text-white">
                {scenarioA.metrics.combinedWindowPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-secondary">Max shadow:</span>
              <span className="font-mono text-white">
                {scenarioA.metrics.longestShadowDuration.toFixed(0)}h
              </span>
            </div>
            {skillLevel === "planner" && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-secondary">Avg solar elev:</span>
                <span className="font-mono text-white">
                  {scenarioA.metrics.averageSolarElevation.toFixed(2)}°
                </span>
              </div>
            )}
          </div>

          {/* Viability details */}
          <div className="space-y-1">
            {scenarioA.viability.details.map((d, i) => (
              <p key={i} className="text-[10px] text-text-muted leading-tight">
                • {d}
              </p>
            ))}
          </div>
        </div>

        {/* Scenario B */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent-blue">SCENARIO B</h3>
            <ViabilityBadge viability={scenarioB.viability} />
          </div>

          <select
            value={CURATED_SITES.find((s) => s.id === siteB.id) ? siteB.id : ""}
            onChange={(e) => {
              const s = CURATED_SITES.find((s) => s.id === e.target.value);
              if (s) setSiteB(s);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
          >
            {CURATED_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {!CURATED_SITES.find((s) => s.id === siteB.id) && (
              <option value="">{siteB.name}</option>
            )}
          </select>

          <div className="flex items-center gap-2">
            <div className="text-[10px] text-text-muted font-mono flex-1">
              {siteB.latitude.toFixed(2)}°{siteB.latitude >= 0 ? "N" : "S"},{" "}
              {siteB.longitude.toFixed(1)}°E
            </div>
            <input
              type="date"
              value={dateB.toISOString().slice(0, 10)}
              onChange={(e) => {
                const d = new Date(e.target.value + "T00:00:00Z");
                if (!isNaN(d.getTime())) setDateB(d);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-mono outline-none"
            />
          </div>

          <ScenarioHorizonMini site={siteB} date={dateB} />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Sun className="w-3.5 h-3.5 text-accent-gold" />
              <span className="text-text-secondary">Sunlit:</span>
              <span className="font-mono text-white">
                {scenarioB.metrics.sunlitPercentage.toFixed(1)}%
              </span>
              <span className="text-text-muted">
                ({scenarioB.metrics.sunlitHours.toFixed(0)}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-text-secondary">DTE:</span>
              <span className="font-mono text-white">
                {scenarioB.metrics.dteWindowPercentage.toFixed(1)}%
              </span>
              <span className="text-text-muted">
                ({scenarioB.metrics.dteWindowHours.toFixed(0)}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-accent-emerald" />
              <span className="text-text-secondary">Combined:</span>
              <span className="font-mono text-white">
                {scenarioB.metrics.combinedWindowPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-secondary">Max shadow:</span>
              <span className="font-mono text-white">
                {scenarioB.metrics.longestShadowDuration.toFixed(0)}h
              </span>
            </div>
            {skillLevel === "planner" && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-secondary">Avg solar elev:</span>
                <span className="font-mono text-white">
                  {scenarioB.metrics.averageSolarElevation.toFixed(2)}°
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            {scenarioB.viability.details.map((d, i) => (
              <p key={i} className="text-[10px] text-text-muted leading-tight">
                • {d}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Comparative Metric Bars */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white">COMPARATIVE METRICS</h3>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-accent-gold">■ Scenario A</span>
            <span className="text-accent-blue">■ Scenario B</span>
          </div>
        </div>

        <MetricBar
          label="Sunlit Duration"
          valueA={scenarioA.metrics.sunlitPercentage}
          valueB={scenarioB.metrics.sunlitPercentage}
          unit="%"
          color="#f59e0b"
          max={100}
        />
        <MetricBar
          label="DTE Communication"
          valueA={scenarioA.metrics.dteWindowPercentage}
          valueB={scenarioB.metrics.dteWindowPercentage}
          unit="%"
          color="#3b82f6"
          max={100}
        />
        <MetricBar
          label="Combined Window"
          valueA={scenarioA.metrics.combinedWindowPercentage}
          valueB={scenarioB.metrics.combinedWindowPercentage}
          unit="%"
          color="#10b981"
          max={100}
        />
        <MetricBar
          label="Max Solar Elevation"
          valueA={scenarioA.metrics.maxSolarElevation}
          valueB={scenarioB.metrics.maxSolarElevation}
          unit="°"
          color="#fbbf24"
          max={45}
        />
        <MetricBar
          label="Longest Shadow"
          valueA={scenarioA.metrics.longestShadowDuration}
          valueB={scenarioB.metrics.longestShadowDuration}
          unit="h"
          color="#ef4444"
          max={Math.max(
            scenarioA.metrics.longestShadowDuration,
            scenarioB.metrics.longestShadowDuration,
            1,
          )}
        />

        {skillLevel === "educator" && (
          <div className="mt-4 p-5 rounded-xl bg-accent-blue/5 border border-accent-blue/10">
            <p className="text-xs text-accent-blue font-medium mb-1">
              💡 Why does this matter?
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {scenarioA.metrics.sunlitPercentage >
              scenarioB.metrics.sunlitPercentage
                ? `Scenario A receives ${(scenarioA.metrics.sunlitPercentage - scenarioB.metrics.sunlitPercentage).toFixed(1)}% more sunlight. On Earth, solar panels get ~12 hours/day everywhere. On the Moon's south pole, the difference between a ridge crest and a crater floor can be the difference between continuous operation and mission failure.`
                : `Scenario B receives ${(scenarioB.metrics.sunlitPercentage - scenarioA.metrics.sunlitPercentage).toFixed(1)}% more sunlight. Small changes in landing location dramatically affect power availability — something that never happens on Earth where the Sun crosses high overhead.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

