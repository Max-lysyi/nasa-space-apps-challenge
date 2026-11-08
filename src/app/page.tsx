"use client";

import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type {
  LandingSite,
  SkillLevel,
  PlaybackSpeed,
  EphemerisResult,
  LunarCycleMetrics,
  TimelinePoint,
  SolarArrayType,
} from "@/lib/types";
import { CURATED_SITES } from "@/lib/landingSites";
import {
  computeEphemeris,
  computeLunarCycleMetrics,
  computeTimeline,
} from "@/lib/lunarEphemeris";
import { HOURS_PER_LUNAR_CYCLE, MS_PER_HOUR } from "@/lib/constants";

import { ScrollIntro } from "@/components/ScrollIntro";
import { TelemetryBar } from "@/components/TelemetryBar";
import { SiteSelector } from "@/components/SiteSelector";
import { HorizonSkyView } from "@/components/HorizonSkyView";
import { RegionalMap2D } from "@/components/RegionalMap2D";
import { TimelineController } from "@/components/TimelineController";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { JPLHorizonsModal } from "@/components/JPLHorizonsModal";

// Dynamically import 3D canvas with SSR disabled to prevent WebGL/server pre-render mismatches
const LunarSurface3D = dynamic(
  () => import("@/components/LunarSurface3D").then((mod) => mod.LunarSurface3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-space-black/60 text-text-muted gap-2">
        <div className="w-6 h-6 border-2 border-accent-gold/40 border-t-accent-gold rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider">LOADING 3D LUNAR TOPOGRAPHY...</span>
      </div>
    ),
  },
);

const LandingScrollScene3D = dynamic(
  () =>
    import("@/components/LandingScrollScene3D").then(
      (mod) => mod.LandingScrollScene3D
    ),
  { ssr: false }
);

function NavigatorContent() {
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ── Core view & simulation state ──────────────────────────────────────────
  // Simulator is false by default: user starts in immersive full-screen Scrollytelling mode
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);

  const [selectedSite, setSelectedSite] = useState<LandingSite>(
    CURATED_SITES[0],
  );
  // Default to a deterministic mission timestamp (Spring 2026 south pole exploration epoch)
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-03-15T12:00:00Z"),
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("educator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>("1h");
  const [showComparison, setShowComparison] = useState(false);
  const [solarArrayType, setSolarArrayType] = useState<SolarArrayType>("vertical");
  const [showJplModal, setShowJplModal] = useState(false);

  // ── Computed ephemeris & metrics (memoized) ──────────────────────────────
  const ephemeris: EphemerisResult = useMemo(
    () => computeEphemeris(selectedDate, selectedSite),
    [selectedDate, selectedSite],
  );

  const cycleMetrics: LunarCycleMetrics = useMemo(
    () => computeLunarCycleMetrics(selectedDate, selectedSite),
    [selectedDate, selectedSite],
  );

  const timeline: TimelinePoint[] = useMemo(
    () => computeTimeline(selectedDate, selectedSite, HOURS_PER_LUNAR_CYCLE, 1),
    [selectedDate, selectedSite],
  );

  // ── Playback simulation timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const speedMap: Record<PlaybackSpeed, number> = {
      "1h": 1,
      "24h": 24,
      cycle: HOURS_PER_LUNAR_CYCLE / 30,
    };
    const hoursPerTick = speedMap[playbackSpeed];
    const interval = setInterval(() => {
      setSelectedDate(
        (d) => new Date(d.getTime() + hoursPerTick * MS_PER_HOUR),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // ── Mode transitions: enter & exit simulator ──────────────────────────────
  const handleLaunchSimulator = useCallback(() => {
    setIsSimulatorActive(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleExitToLanding = useCallback(() => {
    setIsSimulatorActive(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDateChange = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const handleSiteChange = useCallback((site: LandingSite) => {
    setSelectedSite(site);
  }, []);

  // ── Reusable Workspace Visuals (shared between blurred preview and live HUD)
  const workspaceVisuals = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 3D Lunar Surface View - 8 columns */}
      <div className="lg:col-span-8 h-[600px] rounded-xl overflow-hidden glass-panel">
        <LunarSurface3D
          site={selectedSite}
          ephemeris={ephemeris}
          date={selectedDate}
          onSiteChange={handleSiteChange}
        />
      </div>

      {/* Right column: 360° Horizon Sky View + 2D Regional Map - 4 columns */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* 360° Local Horizon Sky-Dome */}
        <div className="h-[290px] glass-panel rounded-xl overflow-hidden">
          <HorizonSkyView
            site={selectedSite}
            ephemeris={ephemeris}
            timeline={timeline}
            skillLevel={skillLevel}
          />
        </div>

        {/* 2D Regional Map with Crater Topography & Sun Vector */}
        <div className="h-[290px] glass-panel rounded-xl overflow-hidden">
          <RegionalMap2D
            selectedSite={selectedSite}
            onSiteChange={handleSiteChange}
            ephemeris={ephemeris}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-space-black text-text-primary">
      <AnimatePresence mode="wait">
        {!isSimulatorActive ? (
          /* ── Scrollytelling Landing Page (100% immersive, no top/bottom bars) ── */
          <motion.div
            key="scrollytelling-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5 }}
          >
            <LandingScrollScene3D />
            <ScrollIntro
              onLaunch={handleLaunchSimulator}
              workspacePreview={workspaceVisuals}
            />
          </motion.div>
        ) : (
          /* ── Active Interactive Mission Workspace (Full HUD + Controls) ─────── */
          <motion.div
            key="interactive-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4 }}
            className="relative min-h-screen"
          >
            {/* Top Dynamic Telemetry Bar (Animated Slide-in) */}
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed top-0 left-0 w-full z-50"
            >
              <TelemetryBar
                ephemeris={ephemeris}
                metrics={cycleMetrics}
                skillLevel={skillLevel}
                onSkillLevelChange={setSkillLevel}
                onShowComparison={() => setShowComparison(!showComparison)}
                showComparison={showComparison}
                onExitToLanding={handleExitToLanding}
                solarArrayType={solarArrayType}
              />
            </motion.div>

            {/* Main Interactive HUD Workspace */}
            <div
              ref={workspaceRef}
              className="pt-16 pb-28 px-6 max-w-[1600px] mx-auto"
            >
              {/* Site Selector with Curated + Custom coordinate input */}
              <SiteSelector
                selectedSite={selectedSite}
                onSiteChange={handleSiteChange}
                skillLevel={skillLevel}
              />

              {/* Engineering Sub-Bar: Solar Array Geometry & Battery Survival & JPL Horizons Live */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 mb-4 glass-panel rounded-xl text-xs">
                {/* Left: Solar Array Geometry Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-text-muted font-mono uppercase text-[10px] tracking-wider">
                    Solar Geometry:
                  </span>
                  <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setSolarArrayType("vertical")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        solarArrayType === "vertical"
                          ? "bg-accent-gold/25 text-accent-gold border border-accent-gold/40 shadow-sm"
                          : "text-text-muted hover:text-white"
                      }`}
                      title="Vertical tracking polar mast: captures grazing sunlight via cos(elevation) ≈ 100%"
                    >
                      <span>🗼</span>
                      <span>Vertical Mast (Tracking)</span>
                    </button>
                    <button
                      onClick={() => setSolarArrayType("horizontal")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        solarArrayType === "horizontal"
                          ? "bg-accent-blue/25 text-accent-blue border border-accent-blue/40 shadow-sm"
                          : "text-text-muted hover:text-white"
                      }`}
                      title="Flat horizontal deck array: grazing sunlight sin(elevation) yields only 2-5% power"
                    >
                      <span>☀️</span>
                      <span>Horizontal Deck</span>
                    </button>
                  </div>
                </div>

                {/* Center / Right: Shadow Survival Battery Metric & JPL Button */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px]">
                    <span>🔋</span>
                    <span className="text-text-muted">Survival Battery:</span>
                    <span className="text-white font-semibold">
                      {(cycleMetrics.longestShadowDuration * 0.25).toFixed(1)} kWh
                    </span>
                    <span className="text-text-muted text-[10px]">
                      (250W heater · {cycleMetrics.longestShadowDuration.toFixed(0)}h shadow)
                    </span>
                  </div>

                  {/* NASA JPL Horizons Live Modal Button */}
                  <button
                    onClick={() => setShowJplModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue border border-accent-blue/30 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                    title="Query official NASA JPL Horizons REST API"
                  >
                    <span>🛰️</span>
                    <span>JPL Horizons Live</span>
                  </button>
                </div>
              </div>

              {/* JPL Horizons Live Telemetry Modal */}
              <JPLHorizonsModal
                isOpen={showJplModal}
                onClose={() => setShowJplModal(false)}
                site={selectedSite}
                date={selectedDate}
                analyticalEphem={ephemeris}
              />

              {showComparison ? (
                /* Side-by-Side Scenario Comparison */
                <div className="mt-4">
                  <ScenarioComparison
                    siteA={selectedSite}
                    dateA={selectedDate}
                    skillLevel={skillLevel}
                  />
                </div>
              ) : (
                /* Active Visualization Grid */
                <div className="mt-4">{workspaceVisuals}</div>
              )}
            </div>

            {/* Bottom Multi-Track Timeline Controller (Animated Slide-up) */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed bottom-0 left-0 right-0 z-40"
            >
              <TimelineController
                date={selectedDate}
                onDateChange={handleDateChange}
                timeline={timeline}
                isPlaying={isPlaying}
                onPlayToggle={() => setIsPlaying(!isPlaying)}
                playbackSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
                skillLevel={skillLevel}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-space-black flex items-center justify-center text-text-muted text-sm font-mono">
          INITIALIZING LUNAR LANDING SITE NAVIGATOR...
        </div>
      }
    >
      <NavigatorContent />
    </Suspense>
  );
}
