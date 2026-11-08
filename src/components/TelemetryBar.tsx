"use client";

import {
  Sun,
  Globe,
  Clock,
  Zap,
  Radio,
  BarChart3,
  Eye,
  GraduationCap,
} from "lucide-react";
import type { EphemerisResult, LunarCycleMetrics, SkillLevel } from "@/lib/types";
import { SOLAR_CONSTANT_W_M2 } from "@/lib/constants";

interface TelemetryBarProps {
  ephemeris: EphemerisResult;
  metrics: LunarCycleMetrics;
  skillLevel: SkillLevel;
  onSkillLevelChange: (level: SkillLevel) => void;
  onShowComparison: () => void;
  showComparison: boolean;
  onExitToLanding?: () => void;
}

function formatTimer(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatAngle(deg: number): string {
  return `${deg >= 0 ? "+" : ""}${deg.toFixed(2)}°`;
}

export function TelemetryBar({
  ephemeris,
  metrics,
  skillLevel,
  onSkillLevelChange,
  onShowComparison,
  showComparison,
  onExitToLanding,
}: TelemetryBarProps) {
  const e = ephemeris;
  const solarFlux = Math.round(
    SOLAR_CONSTANT_W_M2 * e.solarPowerFactor,
  );

  return (
    <div className="fixed top-0 left-0 w-full z-50 glass-panel rounded-none border-x-0 border-t-0 bg-space-black/80 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto h-14 px-6 py-2.5 flex items-center justify-between gap-6 overflow-x-auto text-xs">
        {/* Title / Return to Landing Page */}
        <button
          onClick={onExitToLanding}
          className="flex-shrink-0 mr-2 text-left cursor-pointer group flex items-center gap-2.5 transition-all outline-none"
          title="Return to Landing Page"
        >
          <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-accent-gold/20 border border-white/10 group-hover:border-accent-gold/40 flex items-center justify-center transition-all flex-shrink-0">
            <span className="text-xs group-hover:-translate-x-0.5 transition-transform text-text-muted group-hover:text-accent-gold font-bold">
              ←
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white group-hover:text-accent-gold transition-colors">
                LUNAR LANDING SITE NAVIGATOR
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted group-hover:text-accent-gold transition-colors font-mono">
                Home
              </span>
            </div>
            <p className="text-[10px] text-text-muted group-hover:text-text-secondary transition-colors">
              {e.site.shortName} · Click to exit
            </p>
          </div>
        </button>

        <div className="w-px h-8 bg-white/10 flex-shrink-0" />

        {/* Sun Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Sun
            className={`w-3.5 h-3.5 ${e.isSunVisible ? "text-accent-gold" : "text-text-muted"}`}
          />
          <div>
            <p className="text-text-muted">Sun Elev</p>
            <p
              className={`font-mono telemetry-value font-semibold ${e.isSunVisible ? "text-accent-gold" : "text-text-muted"}`}
            >
              {formatAngle(e.solarElevationAngle)}
            </p>
          </div>
        </div>

        {/* Sun Timer */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <div>
            <p className="text-text-muted">
              {e.isSunVisible ? "Sunset in" : "Sunrise in"}
            </p>
            <p className="font-mono telemetry-value font-semibold text-white">
              {formatTimer(e.isSunVisible ? e.timeToSunset : e.timeToSunrise)}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 flex-shrink-0" />

        {/* Earth Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Globe
            className={`w-3.5 h-3.5 ${e.isEarthVisible ? "text-accent-blue" : "text-text-muted"}`}
          />
          <div>
            <p className="text-text-muted">Earth Elev</p>
            <p
              className={`font-mono telemetry-value font-semibold ${e.isEarthVisible ? "text-accent-blue" : "text-text-muted"}`}
            >
              {formatAngle(e.earthElevationAngle)}
            </p>
          </div>
        </div>

        {/* Earth Timer */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Radio className="w-3.5 h-3.5 text-text-muted" />
          <div>
            <p className="text-text-muted">
              {e.isEarthVisible ? "Earthset in" : "Earthrise in"}
            </p>
            <p className="font-mono telemetry-value font-semibold text-white">
              {formatTimer(
                e.isEarthVisible ? e.timeToEarthset : e.timeToEarthrise,
              )}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 flex-shrink-0" />

        {/* Power */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Zap
            className={`w-3.5 h-3.5 ${e.isSunVisible ? "text-accent-gold" : "text-text-muted"}`}
          />
          <div>
            <p className="text-text-muted">
              {skillLevel === "planner" ? "Solar Flux" : "Power"}
            </p>
            <p className="font-mono telemetry-value font-semibold text-white">
              {skillLevel === "planner"
                ? `${solarFlux} W/m²`
                : `${Math.round(e.solarPowerFactor * 100)}%`}
            </p>
          </div>
        </div>

        {/* Cycle Sunlit */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <BarChart3 className="w-3.5 h-3.5 text-accent-emerald" />
          <div>
            <p className="text-text-muted">Cycle Sunlit</p>
            <p className="font-mono telemetry-value font-semibold text-accent-emerald">
              {metrics.sunlitPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {skillLevel === "planner" && (
          <>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div>
                <p className="text-text-muted">Libration</p>
                <p className="font-mono telemetry-value font-semibold text-text-secondary">
                  λ{e.librationLon >= 0 ? "+" : ""}
                  {e.librationLon.toFixed(1)}° β
                  {e.librationLat >= 0 ? "+" : ""}
                  {e.librationLat.toFixed(1)}°
                </p>
              </div>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Comparison Toggle */}
        <button
          onClick={onShowComparison}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer flex-shrink-0 ${
            showComparison
              ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
              : "bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10"
          }`}
        >
          <BarChart3 className="w-3 h-3" />
          Compare
        </button>

        {/* Skill Toggle */}
        <button
          onClick={() =>
            onSkillLevelChange(
              skillLevel === "planner" ? "educator" : "planner",
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
        >
          {skillLevel === "planner" ? (
            <>
              <Eye className="w-3 h-3" />
              <span>Planner</span>
            </>
          ) : (
            <>
              <GraduationCap className="w-3 h-3" />
              <span>Educator</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

