"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  LandingSite,
  SkillLevel,
  PlaybackSpeed,
  EphemerisResult,
  LunarCycleMetrics,
  TimelinePoint,
} from "@/lib/types";
import { CURATED_SITES } from "@/lib/landingSites";
import {
  computeEphemeris,
  computeLunarCycleMetrics,
  computeTimeline,
} from "@/lib/lunarEphemeris";
import { HOURS_PER_LUNAR_CYCLE, MS_PER_HOUR } from "@/lib/constants";

import { ScrollIntro } from "./ScrollIntro";
import { TelemetryBar } from "./TelemetryBar";
import { SiteSelector } from "./SiteSelector";
import { HorizonSkyView } from "./HorizonSkyView";
import { RegionalMap2D } from "./RegionalMap2D";
import { TimelineController } from "./TimelineController";
import { ScenarioComparison } from "./ScenarioComparison";
import { LunarSurface3D } from "./LunarSurface3D";

export function LunarApp() {
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ── Core view & simulation state ──────────────────────────────────────────
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);

  const [selectedSite, setSelectedSite] = useState<LandingSite>(
    CURATED_SITES[0],
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date("2026-03-15T12:00:00Z"),
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("educator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>("1h");
  const [showComparison, setShowComparison] = useState(false);

  // ── Computed data (memoised) ──────────────────────────────────────────────
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

  // ── Playback timer ────────────────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Reusable Workspace Visuals ────────────────────────────────────────────
  const workspaceVisuals = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 3D Surface View - 8 columns */}
      <div className="lg:col-span-8 h-[600px] rounded-xl overflow-hidden glass-panel">
        <LunarSurface3D
          site={selectedSite}
          ephemeris={ephemeris}
          date={selectedDate}
        />
      </div>

      {/* Right column: Horizon + Map stacked - 4 columns */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* 360° Horizon Sky View */}
        <div className="h-[290px] glass-panel rounded-xl overflow-hidden">
          <HorizonSkyView
            site={selectedSite}
            ephemeris={ephemeris}
            timeline={timeline}
            skillLevel={skillLevel}
          />
        </div>

        {/* 2D Regional Map */}
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
            {/* Top Dynamic Telemetry Bar */}
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
              />
            </motion.div>

            {/* Main Interactive HUD Workspace */}
            <div
              ref={workspaceRef}
              className="pt-16 pb-28 px-6 max-w-[1600px] mx-auto"
            >
              {/* Site Selector */}
              <SiteSelector
                selectedSite={selectedSite}
                onSiteChange={handleSiteChange}
                skillLevel={skillLevel}
              />

              {showComparison ? (
                <div className="mt-4">
                  <ScenarioComparison
                    siteA={selectedSite}
                    dateA={selectedDate}
                    skillLevel={skillLevel}
                  />
                </div>
              ) : (
                <div className="mt-4">{workspaceVisuals}</div>
              )}
            </div>

            {/* Bottom Multi-Track Timeline Controller */}
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
